from abc import ABC
from datetime import datetime, timezone
from uuid import UUID, uuid4
from pydantic import BaseModel, Field


class DomainEvent(BaseModel, ABC):
    event_id: UUID = Field(default_factory=uuid4)
    occurred_on: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DomainException(Exception):
    """Excepción base para violaciones de invariantes de dominio."""
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message
