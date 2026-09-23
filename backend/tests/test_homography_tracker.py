from uuid import uuid4
import numpy as np
import pytest
from backend.src.contexts.inventory.domain.entities import PhysicalObject
from backend.src.contexts.inventory.domain.services.homography_tracker import HomographyTracker
from backend.src.contexts.inventory.domain.value_objects import ConfidenceScore
from backend.src.contexts.perception.domain.value_objects import BoundingBox


class TestHomographyTracker:
    def setup_method(self):
        self.tracker = HomographyTracker(iou_match_threshold=0.40)

    def test_solve_linear_assignment_optimal(self):
        # 3x3 cost matrix
        cost_matrix = np.array([
            [0.1, 0.9, 0.9],
            [0.9, 0.2, 0.9],
            [0.9, 0.9, 0.15],
        ], dtype=np.float32)

        matches = self.tracker._solve_linear_assignment(cost_matrix)
        assert len(matches) == 3
        # Optimal assignments should be (0, 0), (1, 1), (2, 2)
        match_dict = dict(matches)
        assert match_dict[0] == 0
        assert match_dict[1] == 1
        assert match_dict[2] == 2

    def test_project_box_with_identity(self):
        box = BoundingBox(10.0, 20.0, 50.0, 80.0)
        H_identity = np.eye(3, dtype=np.float32)

        projected = self.tracker._project_box(box, H_identity)
        assert projected is not None
        assert pytest.approx(projected.x1, 0.01) == 10.0
        assert pytest.approx(projected.y1, 0.01) == 20.0
        assert pytest.approx(projected.x2, 0.01) == 50.0
        assert pytest.approx(projected.y2, 0.01) == 80.0

    def test_project_box_with_translation(self):
        box = BoundingBox(10.0, 20.0, 50.0, 80.0)
        # Shift x by +30, y by +10
        H_trans = np.array([
            [1.0, 0.0, 30.0],
            [0.0, 1.0, 10.0],
            [0.0, 0.0, 1.0],
        ], dtype=np.float32)

        projected = self.tracker._project_box(box, H_trans)
        assert projected is not None
        assert pytest.approx(projected.x1, 0.01) == 40.0
        assert pytest.approx(projected.y1, 0.01) == 30.0
        assert pytest.approx(projected.x2, 0.01) == 80.0
        assert pytest.approx(projected.y2, 0.01) == 90.0

    def test_deduplication_preserves_persistent_id(self):
        # Create an existing object in previous shot
        original_id = uuid4()
        prev_obj = PhysicalObject(
            id=original_id,
            first_seen_capture_id=uuid4(),
            bounding_box=BoundingBox(10.0, 20.0, 50.0, 80.0),
            resolved_product_id=uuid4(),
            confidence=ConfidenceScore(0.95),
        )

        # In the next shot, camera shifted slightly, object is at [12.0, 21.0, 52.0, 81.0]
        new_temporary_id = uuid4()
        curr_obj = PhysicalObject(
            id=new_temporary_id,
            first_seen_capture_id=uuid4(),
            bounding_box=BoundingBox(12.0, 21.0, 52.0, 81.0),
            resolved_product_id=None,
            confidence=ConfidenceScore(0.0),
        )

        # Mock _estimate_homography to return identity matrix
        self.tracker._estimate_homography = lambda img1, img2: np.eye(3, dtype=np.float32)

        deduped = self.tracker.track_and_deduplicate(
            prev_image_bytes=b"dummy1",
            curr_image_bytes=b"dummy2",
            prev_objects=[prev_obj],
            curr_objects=[curr_obj],
        )

        assert len(deduped) == 1
        # The current object must inherit the original ID (no double counting!)
        assert deduped[0].id == original_id
        # Also inherits the resolved product ID from previous high-confidence shot
        assert deduped[0].resolved_product_id == prev_obj.resolved_product_id
