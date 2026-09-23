## 1. Infraestructura Local (`infra/`)

- [x] 1.1 Configurar archivo `infra/docker-compose.yml` con servicios de PostgreSQL 18 (`pgvector`), MinIO (S3 API), Redis y Ollama.
- [x] 1.2 Implementar script DDL `infra/postgres/init.sql` con esquema relacional, particionamiento de capturas e índice HNSW para `pgvector`.
- [x] 1.3 Crear script de datos semilla `infra/postgres/seed_solgar.sql` con catálogo de productos Solgar Colombia y códigos de barras oficiales.
- [x] 1.4 Configurar script `infra/minio/create-buckets.sh` para inicializar buckets `raw-captures` y `crops` con políticas de URLs prefirmadas.

## 2. Backend Domain Core y Bounded Contexts (`backend/`)

- [x] 2.1 Estructurar Bounded Contexts en `backend/src/contexts/` (`inventory`, `perception`, `catalog`, `audit`) con separación estricta de Domain, Application e Infrastructure.
- [x] 2.2 Implementar Value Objects inmutables (`BoundingBox`, `ConfidenceScore`, `Barcode`, `Sha256Checksum`) y entidades de dominio.
- [x] 2.3 Implementar Aggregate Root `InventorySession` protegiendo invariantes de negocio (no permitir capturas en sesiones cerradas ni cierre con excepciones pendientes).
- [x] 2.4 Definir contratos abstractos de puertos de salida (`IVisionDetectorPort`, `IBarcodeReaderPort`, `IOcrExtractorPort`, `IVectorEmbeddingPort`, `IInventoryRepositoryPort`).
- [x] 2.5 Configurar servidor FastAPI en `backend/src/main.py` con inyección de dependencias para enlazar adaptadores a los puertos de dominio.

## 3. Pipeline de Visión y Adaptadores de IA (`backend/`)

- [x] 3.1 Implementar `YoloV8DetectorAdapter` implementando `IVisionDetectorPort` para detectar frascos cilíndricos y tapas doradas.
- [x] 3.2 Desarrollar módulo de recorte y almacenamiento de evidencias en MinIO `MinioStorageAdapter`.
- [x] 3.3 Implementar `PyzbarBarcodeAdapter` para decodificación y validación de checksums en códigos EAN-13 y UPC.
- [x] 3.4 Implementar `PaddleOcrV4Adapter` para extracción y segmentación de texto en etiquetas frontales.

## 4. Product Resolver y Búsqueda Vectorial (`backend/`)

- [x] 4.1 Implementar `OllamaEmbeddingAdapter` para vectorizar textos de catálogo y OCR mediante `embeddinggemma:latest`.
- [x] 4.2 Crear repositorio `CatalogRepositoryPg` para consulta de vecinos más cercanos con `pgvector` (HNSW).
- [x] 4.3 Desarrollar servicio de dominio `ProductResolver` para fusión de evidencias multi-señal y cálculo de confidence score.
- [x] 4.4 Implementar `OllamaVlmAdapter` para fallback condicional a `qwen3-vl:2b` y `gemma4:12b` en detecciones ambiguas.
- [x] 4.5 Implementar endpoints REST y WebSocket de excepciones (`GET /api/v1/sessions/{id}/exceptions`, `POST /api/v1/validations`).

## 5. Deduplicación y Tracking Inter-Fotografías (`backend/`)

- [x] 5.1 Implementar servicio de dominio `HomographyTracker` para estimación de transformación proyectiva entre tomas contiguas.
- [x] 5.2 Implementar algoritmo Húngaro (Kuhn-Munkres) sobre matriz de costos (IoU proyectado + similitud de embeddings visuales).
- [x] 5.3 Asegurar que objetos deduplicados mantengan el mismo `physical_object_id` y no incrementen el conteo físico de la sesión.

## 6. Aplicación Móvil en Flutter (`mobile/`)

- [x] 6.1 Inicializar proyecto Flutter en `mobile/` con Clean Architecture y soporte multiplataforma (Android e iOS).
- [x] 6.2 Implementar paleta de colores y tema corporativo de Innovate Nutrition (`mobile/lib/core/theme/app_theme.dart`).
- [x] 6.3 Implementar analizador de calidad en el dispositivo (varianza Laplaciana para desenfoque y saturación de luminancia).
- [x] 6.4 Implementar pantalla de cámara con retícula guía, bloqueo de exposición y disparo asistido.
- [x] 6.5 Desarrollar base de datos local SQLite (Drift) y `SyncManager` offline con cabecera de idempotencia `X-Idempotency-Key`.
- [x] 6.6 Implementar overlay de bounding boxes y pantalla de resolución ágil de excepciones (Human-in-the-loop).

## 7. Consola Web Administrativa y Auditoría (`frontend/`)

- [x] 7.1 Inicializar aplicación web en `frontend/` (Vite + React + TypeScript) con el sistema de diseño Innovate Nutrition.
- [x] 7.2 Implementar panel de monitoreo de sesiones de inventario en tiempo real con recepción de eventos WebSocket.
- [x] 7.3 Desarrollar interfaz de conciliación de discrepancias con visualización comparativa de foto original vs catálogo.
- [x] 7.4 Desarrollar visor de trazabilidad forense que muestre la cadena inmutable de cada ítem inventariado.

## 8. Pruebas E2E y Validación de Catálogo Solgar

- [x] 8.1 Ejecutar suite de pruebas unitarias sobre invariantes de dominio, cálculos matemáticos y Value Objects.
- [x] 8.2 Realizar prueba de integración E2E completa: Captura Mobile -> Backend Celery -> YOLO -> OCR -> Resolver -> Postgres -> Web Admin.
- [x] 8.3 Verificar trazabilidad forense inmutable de 50 ítems de prueba del catálogo Solgar.
