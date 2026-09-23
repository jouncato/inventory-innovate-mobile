import io
import cv2
import numpy as np
from PIL import Image
from backend.src.contexts.perception.domain.ports import IVisionDetectorPort, RawDetection
from backend.src.contexts.perception.domain.value_objects import BoundingBox


class YoloV8DetectorAdapter(IVisionDetectorPort):
    """Adaptador de infraestructura para detección de frascos Solgar mediante YOLO.
    Implementa IVisionDetectorPort aislando librerías de inferencia del dominio."""

    def __init__(self, model_path: str | None = None, confidence_threshold: float = 0.40):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self._model = None
        self._load_model()

    def _load_model(self):
        if self.model_path:
            try:
                from ultralytics import YOLO
                self._model = YOLO(self.model_path)
            except Exception as e:
                # Si no está instalado ultralytics o no existen pesos locales todavía, se activa el modo heurístico/simulación
                print(f"[YoloV8DetectorAdapter] Aviso: Modelo ultralytics no cargado ({e}). Operando en modo computer vision clásico.")
                self._model = None

    def detect_objects(self, image_bytes: bytes) -> list[RawDetection]:
        # Cargar imagen en memoria
        image_np = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
        if img is None:
            return []

        h, w, _ = img.shape

        # Si el modelo YOLO está cargado y disponible:
        if self._model is not None:
            results = self._model.predict(img, conf=self.confidence_threshold, verbose=False)
            detections: list[RawDetection] = []
            for r in results:
                for box in r.boxes:
                    coords = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    cls_name = r.names.get(cls_id, "solgar_bottle")

                    x1 = max(0.0, float(coords[0]))
                    y1 = max(0.0, float(coords[1]))
                    x2 = min(float(w), float(coords[2]))
                    y2 = min(float(h), float(coords[3]))

                    if x2 > x1 and y2 > y1:
                        detections.append(
                            RawDetection(
                                bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                                confidence=conf,
                                detected_class=cls_name,
                            )
                        )
            return detections

        # Modo fallback Computer Vision: Detección por segmentación de frascos ámbar y tapas doradas
        return self._detect_amber_bottles_fallback(img, w, h)

    def _detect_amber_bottles_fallback(self, img: np.ndarray, w: int, h: int) -> list[RawDetection]:
        """Heurística morfológica para delimitar frascos cilíndricos oscuros sobre fondo claro."""
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Rango para vidrio ámbar oscuro / marrón
        lower_amber = np.array([5, 40, 20])
        upper_amber = np.array([25, 255, 180])
        mask = cv2.inRange(hsv, lower_amber, upper_amber)

        # Operaciones morfológicas para unir áreas del cuerpo del frasco
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 25))
        closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detections: list[RawDetection] = []

        min_area = (w * h) * 0.01  # Al menos 1% del área de la imagen
        max_area = (w * h) * 0.40

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if min_area <= area <= max_area:
                x, y, bw, bh = cv2.boundingRect(cnt)
                aspect_ratio = bh / float(bw)
                
                # Relación de aspecto cilíndrica típica de frascos Solgar (1.3 a 3.0)
                if 1.1 <= aspect_ratio <= 3.5:
                    x1 = float(max(0, x))
                    y1 = float(max(0, y))
                    x2 = float(min(w, x + bw))
                    y2 = float(min(h, y + bh))

                    detections.append(
                        RawDetection(
                            bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                            confidence=0.88,
                            detected_class="solgar_bottle",
                        )
                    )

        # Ordenar de izquierda a derecha en la bandeja
        detections.sort(key=lambda d: d.bbox.x1)
        return detections
