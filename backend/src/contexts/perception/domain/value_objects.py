import re
from dataclasses import dataclass
from backend.src.shared.domain import DomainException


class InvalidBoundingBoxException(DomainException):
    pass


class InvalidChecksumException(DomainException):
    pass


@dataclass(frozen=True)
class BoundingBox:
    x1: float
    y1: float
    x2: float
    y2: float

    def __post_init__(self):
        if not (0.0 <= self.x1 < self.x2) or not (0.0 <= self.y1 < self.y2):
            raise InvalidBoundingBoxException(
                f"Coordenadas inválidas: [{self.x1}, {self.y1}, {self.x2}, {self.y2}]. "
                "Se requiere x1 < x2 y y1 < y2."
            )

    @property
    def width(self) -> float:
        return self.x2 - self.x1

    @property
    def height(self) -> float:
        return self.y2 - self.y1

    @property
    def area(self) -> float:
        return self.width * self.height

    @property
    def center(self) -> tuple[float, float]:
        return (self.x1 + self.width / 2.0, self.y1 + self.height / 2.0)

    def calculate_iou(self, other: "BoundingBox") -> float:
        inter_x1 = max(self.x1, other.x1)
        inter_y1 = max(self.y1, other.y1)
        inter_x2 = min(self.x2, other.x2)
        inter_y2 = min(self.y2, other.y2)

        if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
            return 0.0

        intersection = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
        union = self.area + other.area - intersection
        return intersection / union if union > 0 else 0.0


@dataclass(frozen=True)
class QualityMetrics:
    blur_score: float
    luminance: float
    min_blur_threshold: float = 100.0

    @property
    def is_blurry(self) -> bool:
        return self.blur_score < self.min_blur_threshold

    @property
    def is_overexposed(self) -> bool:
        return self.luminance > 220.0

    @property
    def is_underexposed(self) -> bool:
        return self.luminance < 35.0

    @property
    def is_acceptable(self) -> bool:
        return not self.is_blurry and not self.is_overexposed and not self.is_underexposed


@dataclass(frozen=True)
class Sha256Checksum:
    value: str

    def __post_init__(self):
        if not re.fullmatch(r"[a-fA-F0-9]{64}", self.value):
            raise InvalidChecksumException(f"Checksum SHA-256 inválido: '{self.value}'")
