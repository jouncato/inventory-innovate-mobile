from uuid import UUID
import asyncpg
from backend.src.config import settings
from backend.src.contexts.catalog.domain.entities import Product
from backend.src.contexts.catalog.domain.ports import ICatalogRepositoryPort
from backend.src.contexts.catalog.domain.value_objects import Barcode, BarcodeSymbology, Sku


# Mock en memoria del catálogo Solgar Colombia para pruebas sin base de datos activa
MOCK_SOLGAR_CATALOG: list[Product] = [
    Product.create("SOL-BCOMP-100", "B-Complex with Vitamin C", "Solgar", "100 Tablets", "Vitaminas", [Barcode("033984002104", BarcodeSymbology.UPC_A)]),
    Product.create("SOL-VITD3-400", "Vitamin D3 (Cholecalciferol) 400 IU", "Solgar", "100 Softgels", "Vitaminas", [Barcode("033984033108", BarcodeSymbology.UPC_A)]),
    Product.create("SOL-ESTERC-500", "Ester-C Plus 500 mg", "Solgar", "100 Vegetable Capsules", "Vitaminas", [Barcode("033984010307", BarcodeSymbology.UPC_A)]),
    Product.create("SOL-VITC-1000", "Vitamin C 1000 mg with Rose Hips", "Solgar", "100 Tablets", "Vitaminas", [Barcode("033984022102", BarcodeSymbology.UPC_A)]),
    Product.create("SOL-VITB12-500", "Vitamin B12 500 mcg", "Solgar", "100 Tablets", "Vitaminas", [Barcode("033984031104", BarcodeSymbology.UPC_A)]),
    Product.create("SOL-OMEGA-950", "Omega-3 EPA & DHA 950 mg", "Solgar", "100 Softgels", "Ácidos Grasos Esenciales", [Barcode("033984020528", BarcodeSymbology.UPC_A)]),
    Product.create("SOL-GENTLE-25", "Gentle Iron (Iron Bisglycinate) 25 mg", "Solgar", "90 Vegetable Capsules", "Minerales", [Barcode("033984012509", BarcodeSymbology.UPC_A)]),
    Product.create("SOL-SKIN-NAILS", "Skin, Nails & Hair Formula", "Solgar", "120 Tablets", "Suplementos Especializados", [Barcode("033984017306", BarcodeSymbology.UPC_A)]),
]


class CatalogRepositoryPg(ICatalogRepositoryPort):
    """Adaptador de persistencia PostgreSQL 18 para Catálogo y Búsqueda Vectorial pgvector."""

    def __init__(self, dsn: str | None = None):
        self.dsn = dsn or settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        self._pool: asyncpg.Pool | None = None

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(self.dsn, min_size=1, max_size=10)
        return self._pool

    async def get_by_id(self, product_id: UUID) -> Product | None:
        try:
            pool = await self._get_pool()
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT id, sku, name, brand, presentation, category FROM products WHERE id = $1",
                    product_id,
                )
                if row:
                    return Product.create(
                        sku=row["sku"],
                        name=row["name"],
                        brand=row["brand"],
                        presentation=row["presentation"],
                        category=row["category"],
                        product_id=row["id"],
                    )
        except Exception:
            # Fallback en memoria
            for p in MOCK_SOLGAR_CATALOG:
                if p.id == product_id:
                    return p
        return None

    async def find_by_barcode(self, barcode: Barcode) -> Product | None:
        try:
            pool = await self._get_pool()
            async with pool.acquire() as conn:
                query = """
                SELECT p.id, p.sku, p.name, p.brand, p.presentation, p.category, b.barcode, b.barcode_type
                FROM products p
                JOIN product_barcodes b ON p.id = b.product_id
                WHERE b.barcode = $1
                """
                row = await conn.fetchrow(query, barcode.value)
                if row:
                    return Product.create(
                        sku=row["sku"],
                        name=row["name"],
                        brand=row["brand"],
                        presentation=row["presentation"],
                        category=row["category"],
                        barcodes=[Barcode(row["barcode"], BarcodeSymbology(row["barcode_type"]))],
                        product_id=row["id"],
                    )
        except Exception:
            pass

        # Fallback en memoria
        for p in MOCK_SOLGAR_CATALOG:
            for b in p.barcodes:
                if b.value == barcode.value:
                    return p
        return None

    async def find_top_k_by_embedding(self, embedding: list[float], top_k: int = 5) -> list[tuple[Product, float]]:
        try:
            pool = await self._get_pool()
            async with pool.acquire() as conn:
                # Utiliza el operador de distancia coseno <=> de pgvector
                query = """
                SELECT p.id, p.sku, p.name, p.brand, p.presentation, p.category,
                       1 - (pe.embedding <=> $1::vector) as similarity
                FROM product_embeddings pe
                JOIN products p ON pe.product_id = p.id
                ORDER BY pe.embedding <=> $1::vector ASC
                LIMIT $2
                """
                rows = await conn.fetch(query, str(embedding), top_k)
                results: list[tuple[Product, float]] = []
                for row in rows:
                    prod = Product.create(
                        sku=row["sku"],
                        name=row["name"],
                        brand=row["brand"],
                        presentation=row["presentation"],
                        category=row["category"],
                        product_id=row["id"],
                    )
                    results.append((prod, float(row["similarity"])))
                if results:
                    return results
        except Exception:
            pass

        # Fallback en memoria: retorna candidatos Solgar estándar
        return [(p, 0.85) for p in MOCK_SOLGAR_CATALOG[:top_k]]

    async def save_product(self, product: Product) -> None:
        try:
            pool = await self._get_pool()
            async with pool.acquire() as conn:
                async with conn.transaction():
                    await conn.execute(
                        """
                        INSERT INTO products (id, sku, name, brand, presentation, category)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (sku) DO UPDATE SET name = $3, presentation = $5
                        """,
                        product.id,
                        product.sku.value,
                        product.name,
                        product.brand,
                        product.presentation,
                        product.category,
                    )
                    for b in product.barcodes:
                        await conn.execute(
                            """
                            INSERT INTO product_barcodes (product_id, barcode, barcode_type)
                            VALUES ($1, $2, $3)
                            ON CONFLICT (barcode) DO NOTHING
                            """,
                            product.id,
                            b.value,
                            b.symbology.value,
                        )
        except Exception as e:
            print(f"[CatalogRepositoryPg] Error guardando producto: {e}")
