from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import UUID, uuid4
from backend.src.contexts.inventory.domain.entities import PhysicalObject, UserValidation, ValidationAction
from backend.src.contexts.inventory.domain.value_objects import SessionStatus
from backend.src.shared.domain import DomainEvent, DomainException


class SessionAlreadyClosedException(DomainException):
    pass


class UnresolvedExceptionsExistException(DomainException):
    pass


# Domain Events
class CaptureAddedEvent(DomainEvent):
    session_id: UUID
    capture_id: UUID
    detected_count: int


class InventorySessionClosedEvent(DomainEvent):
    session_id: UUID
    total_physical_count: int
    verified_skus_count: int


class ExceptionResolvedEvent(DomainEvent):
    session_id: UUID
    physical_object_id: UUID
    action_taken: str


class InventorySession:
    """Aggregate Root del contexto de inventario.
    Centraliza y protege todos los invariantes de la sesión de conteo físico."""

    def __init__(
        self,
        session_id: UUID,
        location_id: UUID,
        operator_id: str,
        status: SessionStatus = SessionStatus.IN_PROGRESS,
        started_at: datetime | None = None,
        closed_at: datetime | None = None,
    ):
        self.id = session_id
        self.location_id = location_id
        self.operator_id = operator_id
        self.status = status
        self.started_at = started_at or datetime.now(timezone.utc)
        self.closed_at = closed_at
        self._physical_objects: dict[UUID, PhysicalObject] = {}
        self._capture_ids: list[UUID] = []
        self._domain_events: list[DomainEvent] = []

    @classmethod
    def start(cls, location_id: UUID, operator_id: str) -> "InventorySession":
        return cls(
            session_id=uuid4(),
            location_id=location_id,
            operator_id=operator_id,
            status=SessionStatus.IN_PROGRESS,
        )

    @property
    def physical_objects(self) -> list[PhysicalObject]:
        return list(self._physical_objects.values())

    @property
    def total_count(self) -> int:
        # Los falsos positivos eliminados por el operador no cuentan
        return len([
            obj for obj in self._physical_objects.values()
            if not (obj.validation and obj.validation.action_taken == ValidationAction.REMOVED_FALSE_POSITIVE)
        ])

    @property
    def pending_exceptions_count(self) -> int:
        return len([obj for obj in self._physical_objects.values() if obj.is_ambiguous])

    def add_capture(self, capture_id: UUID, objects: list[PhysicalObject]) -> None:
        """Invariante: no se pueden agregar capturas a una sesión cerrada."""
        if self.status == SessionStatus.CLOSED:
            raise SessionAlreadyClosedException(
                f"No se pueden registrar capturas en la sesión {self.id} porque ya está cerrada."
            )

        self._capture_ids.append(capture_id)
        for obj in objects:
            self._physical_objects[obj.id] = obj

        if self.pending_exceptions_count > 0:
            self.status = SessionStatus.REVIEW_REQUIRED

        self._domain_events.append(
            CaptureAddedEvent(
                session_id=self.id,
                capture_id=capture_id,
                detected_count=len(objects),
            )
        )

    def resolve_exception(self, object_id: UUID, validation: UserValidation) -> None:
        """Permite al operador humano resolver una ambigüedad o corregir un SKU."""
        if object_id not in self._physical_objects:
            raise DomainException(f"Objeto físico {object_id} no pertenece a esta sesión.")

        target = self._physical_objects[object_id]
        target.validation = validation
        if validation.corrected_product_id:
            target.resolved_product_id = validation.corrected_product_id

        if self.pending_exceptions_count == 0:
            self.status = SessionStatus.IN_PROGRESS

        self._domain_events.append(
            ExceptionResolvedEvent(
                session_id=self.id,
                physical_object_id=object_id,
                action_taken=validation.action_taken.value,
            )
        )

    def close(self) -> None:
        """Invariante: No se puede cerrar la sesión si existen excepciones sin resolver."""
        if self.pending_exceptions_count > 0:
            raise UnresolvedExceptionsExistException(
                f"Imposible cerrar sesión {self.id}: existen {self.pending_exceptions_count} "
                "productos ambiguos o desconocidos pendientes de confirmación."
            )

        self.status = SessionStatus.CLOSED
        self.closed_at = datetime.now(timezone.utc)
        self._domain_events.append(
            InventorySessionClosedEvent(
                session_id=self.id,
                total_physical_count=self.total_count,
                verified_skus_count=len({
                    obj.resolved_product_id for obj in self._physical_objects.values()
                    if obj.resolved_product_id is not None
                }),
            )
        )

    def pull_domain_events(self) -> list[DomainEvent]:
        events = list(self._domain_events)
        self._domain_events.clear()
        return events
