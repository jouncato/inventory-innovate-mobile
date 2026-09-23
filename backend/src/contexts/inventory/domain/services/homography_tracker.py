import cv2
import numpy as np
from uuid import UUID
from backend.src.contexts.inventory.domain.entities import PhysicalObject
from backend.src.contexts.inventory.domain.ports import IHomographyTrackerPort
from backend.src.contexts.perception.domain.value_objects import BoundingBox


class HomographyTracker(IHomographyTrackerPort):
    """Domain Service de seguimiento y deduplicación espacial inter-fotografías.
    Evita el doble conteo de frascos que aparecen en imágenes consecutivas de una repisa."""

    def __init__(self, iou_match_threshold: float = 0.40):
        self.iou_match_threshold = iou_match_threshold

    def track_and_deduplicate(
        self,
        prev_image_bytes: bytes,
        curr_image_bytes: bytes,
        prev_objects: list[PhysicalObject],
        curr_objects: list[PhysicalObject],
    ) -> list[PhysicalObject]:
        if not prev_objects or not curr_objects:
            return curr_objects

        # 1. Estimar matriz de homografía entre ambas imágenes
        H = self._estimate_homography(prev_image_bytes, curr_image_bytes)
        if H is None:
            # Si no hay solape visual detectable, todos los objetos se tratan como nuevos
            return curr_objects

        # 2. Proyectar cajas de prev_objects al plano de curr_objects
        projected_prev_boxes = [self._project_box(obj.bounding_box, H) for obj in prev_objects]

        # 3. Construir matriz de costos basada en IoU
        # Filas: objetos previos proyectados; Columnas: objetos actuales
        n_prev = len(prev_objects)
        n_curr = len(curr_objects)
        cost_matrix = np.ones((n_prev, n_curr), dtype=np.float32)

        for i, proj_box in enumerate(projected_prev_boxes):
            if proj_box is None:
                continue
            for j, curr_obj in enumerate(curr_objects):
                iou = proj_box.calculate_iou(curr_obj.bounding_box)
                # Costo = 1.0 - IoU
                cost_matrix[i, j] = 1.0 - iou

        # 4. Resolver asignación lineal óptima (Algoritmo Húngaro / Greedy si scipy no está cargado)
        matches = self._solve_linear_assignment(cost_matrix)

        # 5. Deduplicar: los objetos actuales emparejados heredan el ID físico previo
        tracked_curr_objects: list[PhysicalObject] = []
        matched_curr_indices = set()

        for prev_idx, curr_idx in matches:
            if cost_matrix[prev_idx, curr_idx] <= (1.0 - self.iou_match_threshold):
                # Es el mismo frasco físico
                original_prev = prev_objects[prev_idx]
                curr_item = curr_objects[curr_idx]
                # Reutilizar el ID del frasco original para deduplicación
                curr_item.id = original_prev.id
                # Si el anterior ya estaba resuelto y el nuevo no, conservar la resolución
                if original_prev.is_resolved and not curr_item.is_resolved:
                    curr_item.resolved_product_id = original_prev.resolved_product_id
                    curr_item.confidence = original_prev.confidence

                matched_curr_indices.add(curr_idx)

        # Todos los objetos actuales se retornan con su ID actualizado
        return curr_objects

    def _estimate_homography(self, img1_bytes: bytes, img2_bytes: bytes) -> np.ndarray | None:
        try:
            im1 = cv2.imdecode(np.frombuffer(img1_bytes, np.uint8), cv2.IMREAD_GRAYSCALE)
            im2 = cv2.imdecode(np.frombuffer(img2_bytes, np.uint8), cv2.IMREAD_GRAYSCALE)
            if im1 is None or im2 is None:
                return None

            orb = cv2.ORB_create(nfeatures=1000)
            kp1, des1 = orb.detectAndCompute(im1, None)
            kp2, des2 = orb.detectAndCompute(im2, None)

            if des1 is None or des2 is None or len(des1) < 10 or len(des2) < 10:
                return None

            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = bf.match(des1, des2)
            matches = sorted(matches, key=lambda x: x.distance)

            # Tomar los mejores 50 matches
            good_matches = matches[:50]
            if len(good_matches) < 8:
                return None

            src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

            H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
            return H
        except Exception as e:
            print(f"[HomographyTracker] Error en estimación de homografía: {e}")
            return None

    def _project_box(self, box: BoundingBox, H: np.ndarray) -> BoundingBox | None:
        """Aplica la transformación afín/homográfica H a las esquinas de un BoundingBox."""
        try:
            pts = np.array([
                [[box.x1, box.y1]],
                [[box.x2, box.y1]],
                [[box.x2, box.y2]],
                [[box.x1, box.y2]],
            ], dtype=np.float32)

            projected = cv2.perspectiveTransform(pts, H)
            proj_x1 = float(np.min(projected[:, 0, 0]))
            proj_y1 = float(np.min(projected[:, 0, 1]))
            proj_x2 = float(np.max(projected[:, 0, 0]))
            proj_y2 = float(np.max(projected[:, 0, 1]))

            if proj_x2 > proj_x1 and proj_y2 > proj_y1:
                return BoundingBox(x1=proj_x1, y1=proj_y1, x2=proj_x2, y2=proj_y2)
        except Exception:
            pass
        return None

    @staticmethod
    def _solve_linear_assignment(cost_matrix: np.ndarray) -> list[tuple[int, int]]:
        """Resuelve el emparejamiento usando scipy o fallback greedy."""
        try:
            from scipy.optimize import linear_sum_assignment
            row_ind, col_ind = linear_sum_assignment(cost_matrix)
            return list(zip(row_ind, col_ind))
        except Exception:
            # Fallback greedy sin dependencias científicas
            matches = []
            visited_rows = set()
            visited_cols = set()
            flat_indices = np.argsort(cost_matrix, axis=None)
            for idx in flat_indices:
                r, c = np.unravel_index(idx, cost_matrix.shape)
                if r not in visited_rows and c not in visited_cols:
                    matches.append((r, c))
                    visited_rows.add(r)
                    visited_cols.add(c)
            return matches
