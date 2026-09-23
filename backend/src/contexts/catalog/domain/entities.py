from dataclasses import dataclass, field
from uuid import UUID, uuid4
from backend.src.contexts.catalog.domain.value_objects import Sku, Barcode


@dataclass
class Product:
    id: UUID
    sku: Sku
    name: str
    brand: str
    presentation: str
    category: str
    barcodes: list[Barcode] = field(default_factory=list)
    embedding: list[float] | None = None

    @classmethod
    def create(
        cls,
        sku: str,
        name: str,
        brand: str = "Solgar",
        presentation: str = "",
        category: str = "",
        barcodes: list[Barcode] | None = None,
        product_id: UUID | None = None,
    ) -> "Product":
        return cls(
            id=product_id or uuid4(),
            sku=Sku(sku),
            name=name,
            brand=brand,
            presentation=presentation,
            category=category,
            barcodes=barcodes or [],
        )
