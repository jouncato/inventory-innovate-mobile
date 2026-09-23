from uuid import uuid4
import pytest
from backend.src.contexts.inventory.domain.aggregates import (
    InventorySession,
    SessionAlreadyClosedException,
    UnresolvedExceptionsExistException,
    CaptureAddedEvent,
    InventorySessionClosedEvent,
    ExceptionResolvedEvent,
)
from backend.src.contexts.inventory.domain.entities import (
    PhysicalObject,
    UserValidation,
    ValidationAction,
)
from backend.src.contexts.inventory.domain.value_objects import (
    SessionStatus,
    ConfidenceScore,
)
from backend.src.contexts.perception.domain.value_objects import BoundingBox


def create_mock_object(confidence_val: float, product_id=None) -> PhysicalObject:
    return PhysicalObject(
        id=uuid4(),
        first_seen_capture_id=uuid4(),
        bounding_box=BoundingBox(x1=10.0, y1=10.0, x2=50.0, y2=80.0),
        resolved_product_id=product_id or uuid4(),
        confidence=ConfidenceScore(confidence_val),
    )


class TestInventorySessionAggregate:
    def test_session_lifecycle_happy_path(self):
        location_id = uuid4()
        session = InventorySession.start(location_id=location_id, operator_id="op-carlos-m")

        assert session.status == SessionStatus.IN_PROGRESS
        assert session.total_count == 0
        assert session.pending_exceptions_count == 0

        # Add capture with 3 high confidence items (0.95 each)
        capture_id = uuid4()
        items = [create_mock_object(0.95) for _ in range(3)]
        session.add_capture(capture_id=capture_id, objects=items)

        assert session.status == SessionStatus.IN_PROGRESS
        assert session.total_count == 3
        assert session.pending_exceptions_count == 0

        # Close session
        session.close()
        assert session.status == SessionStatus.CLOSED
        assert session.closed_at is not None

        events = session.pull_domain_events()
        event_types = [type(e) for e in events]
        assert CaptureAddedEvent in event_types
        assert InventorySessionClosedEvent in event_types

    def test_cannot_close_session_with_unresolved_exceptions(self):
        session = InventorySession.start(location_id=uuid4(), operator_id="op-test")

        # Add 1 confident item and 1 ambiguous item (confidence 0.50)
        capture_id = uuid4()
        ambiguous_obj = create_mock_object(0.50)
        items = [create_mock_object(0.92), ambiguous_obj]
        session.add_capture(capture_id=capture_id, objects=items)

        # Invariant: Status must switch to REVIEW_REQUIRED
        assert session.status == SessionStatus.REVIEW_REQUIRED
        assert session.pending_exceptions_count == 1

        # Invariant: Closing MUST raise UnresolvedExceptionsExistException
        with pytest.raises(UnresolvedExceptionsExistException):
            session.close()

        # Resolve the exception via human validation
        validation = UserValidation(
            id=uuid4(),
            product_match_id=uuid4(),
            reviewed_by_user_id="op-test",
            action_taken=ValidationAction.CONFIRMED,
            original_product_id=ambiguous_obj.resolved_product_id,
            corrected_product_id=ambiguous_obj.resolved_product_id,
            reason="Confirmed Solgar Ester-C 1000mg",
        )
        session.resolve_exception(ambiguous_obj.id, validation)

        assert session.pending_exceptions_count == 0
        assert session.status == SessionStatus.IN_PROGRESS

        # Now closing succeeds
        session.close()
        assert session.status == SessionStatus.CLOSED

    def test_cannot_add_capture_to_closed_session(self):
        session = InventorySession.start(location_id=uuid4(), operator_id="op-test")
        session.close()
        assert session.status == SessionStatus.CLOSED

        with pytest.raises(SessionAlreadyClosedException):
            session.add_capture(capture_id=uuid4(), objects=[create_mock_object(0.95)])

    def test_removed_false_positive_not_counted(self):
        session = InventorySession.start(location_id=uuid4(), operator_id="op-test")
        false_positive = create_mock_object(0.40)
        valid_item = create_mock_object(0.95)

        session.add_capture(uuid4(), [valid_item, false_positive])
        assert session.total_count == 2

        # Mark false positive as removed
        validation = UserValidation(
            id=uuid4(),
            product_match_id=uuid4(),
            reviewed_by_user_id="supervisor",
            action_taken=ValidationAction.REMOVED_FALSE_POSITIVE,
            original_product_id=None,
            corrected_product_id=None,
            reason="Reflejo dorado en repisa metálica, no es frasco",
        )
        session.resolve_exception(false_positive.id, validation)

        assert session.pending_exceptions_count == 0
        assert session.total_count == 1  # Only 1 true item counted!
