## Why

El conteo físico de inventario en bodegas y estanterías comerciales es un proceso manual lento, propenso a errores humanos y con un alto costo operativo. Esta iniciativa implementa una solución de inventario visual inteligente asistida por IA para productos de nutrición y suplementos (catálogo Solgar / Innovate Nutrition), permitiendo a los operadores tomar fotografías desde dispositivos móviles Android e iOS para detectar, contar, leer códigos/etiquetas y reconciliar existencias automáticamente, minimizando la intervención manual y registrando evidencia forense inmutable en PostgreSQL 18.

## What Changes

- **Separación Modular y Arquitectura Hexagonal con DDD:** Organización del repositorio en proyectos físicamente independientes: `backend/` (FastAPI / Celery con Bounded Contexts y Arquitectura Hexagonal), `mobile/` (Flutter para Android/iOS con Clean Architecture), `frontend/` (Dashboard Web de supervisión y auditoría en React/TypeScript) e `infra/` (Docker Compose con PostgreSQL 18 + `pgvector`, MinIO, Redis y Ollama).
- **Captura Asistida en el Dispositivo (Mobile Edge):** Implementación de una aplicación móvil en Flutter (Android/iOS) con validación instantánea de calidad fotográfica (desenfoque mediante Laplaciano, nivel de iluminación y movimiento) y escaneo local de códigos de ubicación (estante/bandeja).
- **Consola Web de Supervisión y Auditoría:** Interfaz web para supervisores que permite monitorear sesiones de inventario en curso, resolver discrepancias masivas y consultar la trazabilidad forense de cada detección.
- **Procesamiento Asíncrono Desacoplado:** Arquitectura backend local basada en FastAPI, Redis Streams y workers Celery que procesa imágenes sin bloquear la interacción del operador.
- **Detección y Conteo Físico Determinístico (YOLO):** Detección espacial y conteo preciso de unidades físicas (frascos cilíndricos y tapas) mediante modelos YOLO, delimitando recortes (crops) individuales.
- **Pipeline Multi-Señal Especializado:** Integración escalonada de lectura de códigos de barras (EAN-13/UPC), OCR (PaddleOCR v4) para extracción de campos de etiqueta (concentración, lote, presentación) y búsqueda semántica vectorial con `embeddinggemma:latest` sobre el catálogo.
- **Fusión de Evidencias (Product Resolver):** Motor determinístico que calcula un índice de confianza multifactorial y consulta condicionalmente a `qwen3-vl:2b` y `gemma4:12b` solo en casos ambiguos.
- **Deduplicación y Tracking Inter-Fotografías:** Mecanismo de homografía y emparejamiento húngaro para impedir el doble conteo de frascos que aparecen en fotos consecutivas de un mismo estante.
- **Persistencia, Vectorización y Auditoría en PostgreSQL 18:** Modelo relacional con `pgvector` para búsqueda de similitud de catálogo, particionamiento de capturas y auditoría completa de inferencias y correcciones humanas (Human-in-the-loop).

## Capabilities

### New Capabilities
- `mobile-capture`: Experiencia móvil Flutter para captura guiada, validación pre-flight de calidad, escaneo de ubicación, funcionamiento offline en SQLite y sincronización idempotente.
- `web-admin`: Consola web de supervisión para visualización de sesiones en tiempo real, conciliación de discrepancias y auditoría forense.
- `vision-orchestrator`: Servicio backend de orquestación visual que procesa capturas fotográficas, ejecuta YOLO para localización/conteo y extrae códigos de barras y texto OCR de cada producto.
- `product-resolver`: Motor de resolución de referencias y cálculo de confidence score que integra búsqueda semántica (`embeddinggemma`) y arbitraje multimodal condicional (`qwen3-vl`, `gemma4`).
- `inventory-tracking`: Algoritmo de seguimiento espacial y visual entre tomas continuas para deduplicar productos solapados en una misma sesión de inventario.
- `inventory-persistence`: Esquema relacional en PostgreSQL 18 con almacenamiento vectorial (`pgvector`), almacenamiento de objetos (MinIO/S3) y trazabilidad completa para auditoría.

### Modified Capabilities
<!-- None: Este es el inicio del sistema -->

## Impact

- **Estructura del Proyecto:** Separación en subproyectos independientes (`backend/`, `mobile/`, `frontend/`, `infra/`).
- **Dispositivos Móviles:** Aplicación Flutter ejecutable en Android e iOS, requiriendo permisos de cámara y almacenamiento local.
- **Infraestructura Local:** Despliegue mediante Docker Compose que incluye PostgreSQL 18 con `pgvector`, MinIO (S3 local), Redis, Ollama (para LLM/VLM locales), FastAPI y Celery Workers.
- **APIs:** Nuevos endpoints REST y WebSockets para gestión de sesiones, subida de capturas mediante URLs prefirmadas, notificación en tiempo real de resultados y resolución de excepciones.
- **Datos y Modelos:** Dependencia en modelos abiertos locales (`yolov8x`, `paddleocr`, `embeddinggemma:latest`, `qwen3-vl:2b`, `gemma4:12b`).
