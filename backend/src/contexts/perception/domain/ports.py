from abc import ABC, abstractmethod
from dataclasses import dataclass
from backend.src.contexts.perception.domain.value_objects import BoundingBox


@dataclass(frozen=True)
class RawDetection:
    bbox: BoundingBox
    confidence: float
    detected_class: str


@dataclass(frozen=True)
class BarcodeReadResult:
    code: str
    symbology: str
    confidence: float


@dataclass(frozen=True)
class OcrReadResult:
    raw_text: str
    parsed_fields: dict[str, str]
    confidence: float


class IVisionDetectorPort(ABC):
    @abstractmethod
    def detect_objects(self, image_bytes: bytes) -> list[RawDetection]:
        """Ejecuta YOLO para detectar frascos cilíndricos y tapas doradas."""
        pass


class IBarcodeReaderPort(ABC):
    @abstractmethod
    def read_barcodes(self, image_bytes: bytes) -> list[BarcodeReadResult]:
        """Detecta y decodifica simbologías 1D/2D con cálculo de checksum."""
        pass


class IOcrExtractorPort(ABC):
    @abstractmethod
    def extract_text(self, image_bytes: bytes) -> OcrReadResult:
        """Extrae texto de etiquetas frontales y segmenta concentración y presentación."""
        pass
