from dataclasses import dataclass
from enum import Enum
from backend.src.shared.domain import DomainException


class ResolutionStatus(str, Enum):
    MATCHED = "MATCHED"                 # >= 0.90
    PROBABLE_MATCH = "PROBABLE_MATCH"   # 0.70 - 0.89
    AMBIGUOUS = "AMBIGUOUS"             # 0.40 - 0.69
    UNKNOWN = "UNKNOWN"                 # < 0.40


class SessionStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    CLOSED = "CLOSED"


@dataclass(frozen=True)
class ConfidenceScore:
    value: float

    def __post_init__(self):
        if not (0.0 <= self.value <= 1.0):
            raise DomainException(f"El ConfidenceScore debe estar entre 0.0 y 1.0. Recibido: {self.value}")

    @property
    def status(self) -> ResolutionStatus:
        if self.value >= 0.90:
            return ResolutionStatus.MATCHED
        elif self.value >= 0.70:
            return ResolutionStatus.PROBABLE_MATCH
        elif self.value >= 0.40:
            return ResolutionStatus.AMBIGUOUS
        return ResolutionStatus.UNKNOWN

    @property
    def requires_human_review(self) -> bool:
        return self.status in (ResolutionStatus.AMBIGUOUS, ResolutionStatus.UNKNOWN)
