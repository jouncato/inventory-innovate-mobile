from abc import ABC, abstractmethod
from uuid import UUID
from backend.src.contexts.inventory.domain.aggregates import InventorySession
from backend.src.contexts.inventory.domain.entities import PhysicalObject


class IInventoryRepositoryPort(ABC):
    @abstractmethod
    async def get_session(self, session_id: UUID) -> InventorySession | None:
        pass

    @abstractmethod
    async def save_session(self, session: InventorySession) -> None:
        pass

    @abstractmethod
    async def update_session(self, session: InventorySession) -> None:
        pass


class IObjectStoragePort(ABC):
    @abstractmethod
    async def generate_presigned_upload_url(self, bucket: str, key: str, expires_in: int = 900) -> str:
        pass

    @abstractmethod
    async def generate_presigned_download_url(self, bucket: str, key: str, expires_in: int = 900) -> str:
        pass

    @abstractmethod
    async def upload_bytes(self, bucket: str, key: str, data: bytes, content_type: str = "image/webp") -> str:
        pass

    @abstractmethod
    async def download_bytes(self, bucket: str, key: str) -> bytes:
        pass


class IMultimodalReasonerPort(ABC):
    @abstractmethod
    def reason_ambiguous_crop(self, crop_bytes: bytes, candidates_context: list[str]) -> dict[str, str | float]:
        """Invoca Qwen3-VL o Gemma 4 para resolver variantes ambiguas."""
        pass


class IHomographyTrackerPort(ABC):
    @abstractmethod
    def track_and_deduplicate(
        self,
        prev_image_bytes: bytes,
        curr_image_bytes: bytes,
        prev_objects: list[PhysicalObject],
        curr_objects: list[PhysicalObject],
    ) -> list[PhysicalObject]:
        """Calcula matriz H y resuelve emparejamiento húngaro entre tomas continuas."""
        pass
