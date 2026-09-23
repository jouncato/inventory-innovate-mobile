from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4
from backend.src.contexts.inventory.domain.value_objects import ConfidenceScore, ResolutionStatus
from backend.src.contexts.perception.domain.value_objects import BoundingBox


class ValidationAction(str, Enum):
    CONFIRMED = "CONFIRMED"
    CORRECTED_SKU = "CORRECTED_SKU"
    REMOVED_FALSE_POSITIVE = "REMOVED_FALSE_POSITIVE"
    ADDED_MISSED = "ADDED_MISSED"


@dataclass
class ProductMatch:
    id: UUID
    detection_id: UUID
    resolved_product_id: UUID | None
    status: ResolutionStatus
    confidence: ConfidenceScore
    signals_breakdown: dict[str, float]
    participating_models: list[dict[str, str]]
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class UserValidation:
    id: UUID
    product_match_id: UUID
    reviewed_by_user_id: str
    action_taken: ValidationAction
    original_product_id: UUID | None
    corrected_product_id: UUID | None
    reason: str | None
    reviewed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class PhysicalObject:
    """Representa una unidad física real en la bandeja/estante."""
    id: UUID
    first_seen_capture_id: UUID
    bounding_box: BoundingBox
    resolved_product_id: UUID | None = None
    confidence: ConfidenceScore = field(default_factory=lambda: ConfidenceScore(0.0))
    crop_storage_s3_key: str | None = None
    match: ProductMatch | None = None
    validation: UserValidation | None = None

    @property
    def is_resolved(self) -> bool:
        return self.confidence.status in (ResolutionStatus.MATCHED, ResolutionStatus.PROBABLE_MATCH)

    @property
    def is_ambiguous(self) -> bool:
        return self.confidence.requires_human_review and self.validation is None
