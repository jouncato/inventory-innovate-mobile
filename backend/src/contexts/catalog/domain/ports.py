from abc import ABC, abstractmethod
from uuid import UUID
from backend.src.contexts.catalog.domain.entities import Product
from backend.src.contexts.catalog.domain.value_objects import Barcode


class IVectorEmbeddingPort(ABC):
    @abstractmethod
    def generate_embedding(self, text: str) -> list[float]:
        """Genera el vector denso (768d) con EmbeddingGemma."""
        pass


class ICatalogRepositoryPort(ABC):
    @abstractmethod
    async def get_by_id(self, product_id: UUID) -> Product | None:
        pass

    @abstractmethod
    async def find_by_barcode(self, barcode: Barcode) -> Product | None:
        """Búsqueda exacta por código de barras verificado."""
        pass

    @abstractmethod
    async def find_top_k_by_embedding(self, embedding: list[float], top_k: int = 5) -> list[tuple[Product, float]]:
        """Búsqueda de vecinos más cercanos (HNSW) en pgvector."""
        pass

    @abstractmethod
    async def save_product(self, product: Product) -> None:
        pass
