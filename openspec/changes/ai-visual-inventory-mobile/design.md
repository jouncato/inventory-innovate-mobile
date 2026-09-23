## Context

El conteo manual de inventario en bodegas de distribución farmacéutica y nutricional (como las operadas por Innovate Nutrition para Solgar Colombia) involucra cientos de referencias en presentaciones morfológicamente casi idénticas (frascos cilíndricos de vidrio ámbar, tapas doradas reflectantes y etiquetas doradas con mínimas variaciones tipográficas en concentración y conteo de cápsulas).

Este diseño técnico establece la arquitectura para la fase inicial del proyecto bajo los paradigmas de **Domain-Driven Design (DDD) Estratégico y Táctico**, **Arquitectura Hexagonal (Ports & Adapters)** y **Clean Code**, organizando el repositorio con separación física absoluta de componentes:
- `backend/`: Núcleo de servicios, workers de visión artificial y APIs.
- `mobile/`: Aplicación Flutter multiplataforma para Android e iOS.
- `frontend/`: Consola web de supervisión, auditoría y conciliación de inventario.
- `infra/`: Definiciones de infraestructura local con Docker Compose (PostgreSQL 18 con `pgvector`, MinIO, Redis, Ollama).

---

## 1. Topología y Separación Estricta de Proyectos

El repositorio se estructura en módulos completamente desacoplados, permitiendo que cada uno tenga su propio ciclo de dependencias, compilación y pruebas:

```
inventory-innovate-mobile/
├── infra/                      # Orquestación de infraestructura local
│   ├── docker-compose.yml      # Postgres 18 + pgvector, MinIO, Redis, Ollama
│   ├── postgres/
│   │   ├── init.sql            # DDL relacional, particiones y pgvector HNSW
│   │   └── seed_solgar.sql     # Catálogo oficial Solgar Colombia
│   └── minio/
│       └── create-buckets.sh   # Inicialización de buckets y políticas
│
├── backend/                    # DDD Hexagonal (Python 3.12+ / FastAPI / Celery)
│   ├── src/
│   │   ├── contexts/           # Bounded Contexts de DDD
│   │   │   ├── inventory/      # Contexto de Sesiones y Conteo
│   │   │   ├── perception/     # Contexto de Visión Artificial y YOLO
│   │   │   ├── catalog/        # Contexto de Productos y Embeddings
│   │   │   └── audit/          # Contexto de Trazabilidad y Logs Forenses
│   │   ├── shared/             # Kernel compartido (DomainEvent, ValueObjects base)
│   │   └── main.py             # Entrada del servidor FastAPI
│   └── tests/                  # Unitarias, integración y contract tests
│
├── mobile/                     # Clean Architecture (Flutter Dart 3.x para Android/iOS)
│   ├── lib/
│   │   ├── core/               # Theme Innovate, Network, Local SQLite (Drift)
│   │   └── features/
│   │       ├── inventory_capture/ # Cámara, validación Laplaciana, retícula
│   │       ├── exception_review/  # UI Human-in-the-loop (confirmar SKUs)
│   │       └── offline_sync/      # SyncManager con idempotencia
│   └── test/                   # Widget tests y unit tests
│
└── frontend/                   # Web de Administración y Auditoría (Vite / React / TS)
    ├── src/
    │   ├── components/         # Design System Innovate Nutrition
    │   ├── modules/
    │   │   ├── sessions/       # Monitoreo de conteos en tiempo real
    │   │   ├── discrepancies/  # Matriz de excepciones y resolución masiva
    │   │   └── audit_trail/    # Visor forense (foto -> crop -> modelo -> usuario)
    └── package.json
```

---

## 2. Domain-Driven Design (DDD) Estratégico

### 2.1 Bounded Contexts (Contextos Delimitados)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CONTEXT MAP DEL SISTEMA                                  │
│                                                                                        │
│   ┌───────────────────────────┐                ┌───────────────────────────┐           │
│   │    PERCEPTION CONTEXT     │                │      CATALOG CONTEXT      │           │
│   │  - Detección física YOLO  │                │  - Productos y SKUs       │           │
│   │  - Extracción de crops    │                │  - Códigos EAN / UPC      │           │
│   │  - Barcode & OCR          │                │  - Embeddings vectoriales │           │
│   │  - Homografía inter-fotos │                │    (EmbeddingGemma)       │           │
│   └─────────────┬─────────────┘                └─────────────┬─────────────┘           │
│                 │                                            │                         │
│                 │ (Detections & Evidences)                   │ (Product Candidates)    │
│                 ▼                                            ▼                         │
│   ┌────────────────────────────────────────────────────────────────────────┐           │
│   │                           INVENTORY CONTEXT                            │           │
│   │  - InventorySession (Aggregate Root)                                   │           │
│   │  - PhysicalCount (Deduplicación & Agregación)                          │           │
│   │  - ProductResolver Domain Service                                      │           │
│   │  - Discrepancy & Exception Management                                  │           │
│   └───────────────────────────────────┬────────────────────────────────────┘           │
│                                       │                                                │
│                                       │ (Domain Events: SessionClosed, MatchCorrected) │
│                                       ▼                                                │
│   ┌────────────────────────────────────────────────────────────────────────┐           │
│   │                             AUDIT CONTEXT                              │           │
│   │  - Registro inmutable de eventos forenses                              │           │
│   │  - Métricas de exactitud y corrección humana                           │           │
│   └────────────────────────────────────────────────────────────────────────┘           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Perception Context:**
   - **Responsabilidad:** Transformar imágenes crudas en evidencias geométricas y textuales.
   - **Conceptos clave:** `ImageCapture`, `RawBoundingBox`, `ImageCrop`, `BarcodeRead`, `OcrTextSegment`, `HomographyTransformation`.
2. **Catalog Context:**
   - **Responsabilidad:** Administrar la verdad canónica de referencias, simbologías y representaciones semánticas.
   - **Conceptos clave:** `Product`, `Sku`, `Barcode`, `ProductEmbeddingVector`.
3. **Inventory Context:**
   - **Responsabilidad:** Coordinar las sesiones de conteo físico, ubicación espacial, consolidación de evidencias, resolución de referencias y deduplicación.
   - **Conceptos clave:** `InventorySession` (Aggregate Root), `PhysicalItemCounter`, `ProductResolutionPolicy`, `InventoryException`.
4. **Audit Context:**
   - **Responsabilidad:** Trazabilidad inmutable de toda decisión tomada por IA o por humanos.
   - **Conceptos clave:** `AuditEvent`, `ModelExecutionRecord`, `HumanCorrectionLog`.

---

## 3. DDD Táctico: Estructura Interna de Cada Bounded Context

Cada contexto en `backend/src/contexts/<context_name>/` implementa estrictamente las cuatro capas de la Arquitectura Hexagonal:

```
backend/src/contexts/inventory/
├── domain/                         # Reglas de negocio puras (sin dependencias externas)
│   ├── aggregates/
│   │   └── inventory_session.py    # Aggregate Root que impone invariantes
│   ├── entities/
│   │   ├── physical_object.py      # Entidad con identidad global rastreada
│   │   └── product_match.py        # Coincidencia con producto y score
│   ├── value_objects/
│   │   ├── bounding_box.py         # Inmutable [x1, y1, x2, y2]
│   │   ├── confidence_score.py     # Valor acotado [0.0, 1.0]
│   │   └── session_status.py       # Enum tipado (IN_PROGRESS, REVIEW, CLOSED)
│   ├── events/
│   │   ├── capture_processed.py    # Domain Event
│   │   └── exception_raised.py     # Domain Event
│   ├── services/
│   │   ├── product_resolver.py     # Fusión multi-señal determinística
│   │   └── hungarian_tracker.py    # Deduplicación y tracking espacial
│   └── repositories/
│       └── i_session_repository.py # Interface pura de persistencia
│
├── application/                    # Orquestación de Casos de Uso (CQRS / Use Cases)
│   ├── commands/
│   │   ├── start_session_cmd.py
│   │   ├── process_capture_cmd.py
│   │   └── resolve_exception_cmd.py
│   ├── queries/
│   │   ├── get_session_summary.py
│   │   └── list_pending_exceptions.py
│   └── dtos/
│       └── session_dtos.py
│
├── infrastructure/                 # Implementaciones técnicas concretas
│   ├── persistence/
│   │   ├── session_repository_pg.py# Adaptador PostgreSQL 18 con asyncpg
│   │   └── orm_models.py           # Modelos de tabla SQLAlchemy / SQLModel
│   ├── adapters/
│   │   └── minio_storage_adapter.py# Adaptador de almacenamiento S3
│   └── mappers/
│       └── session_mapper.py       # Mapper entre ORM y Dominio
│
└── presentation/                   # Puntos de entrada
    ├── api/
    │   └── session_router.py       # FastAPI Endpoints
    └── websockets/
        └── session_ws_handler.py   # Streaming en tiempo real
```

### Invariantes del Aggregate Root (`InventorySession`)

```python
class InventorySession:
    """Aggregate Root del contexto de inventario.
    Garantiza que ninguna regla de negocio sea violada."""
    
    def __init__(self, id: SessionId, location_id: LocationId, operator_id: UserId):
        self.id = id
        self.location_id = location_id
        self.operator_id = operator_id
        self.status = SessionStatus.IN_PROGRESS
        self._captures: list[Capture] = []
        self._physical_items: dict[ObjectId, PhysicalItem] = {}
        self._domain_events: list[DomainEvent] = []

    def add_capture(self, capture: Capture) -> None:
        # Invariante: No se pueden agregar capturas a una sesión cerrada
        if self.status == SessionStatus.CLOSED:
            raise SessionAlreadyClosedException(f"Sesión {self.id} ya se encuentra cerrada.")
        self._captures.append(capture)

    def close_session(self) -> None:
        # Invariante: No se puede cerrar la sesión si existen excepciones sin resolver
        unresolved = [item for item in self._physical_items.values() if item.is_ambiguous]
        if unresolved:
            raise UnresolvedExceptionsExistException(
                f"No se puede cerrar la sesión: existen {len(unresolved)} productos por validar."
            )
        self.status = SessionStatus.CLOSED
        self._record_event(InventorySessionClosedEvent(session_id=self.id))
```

---

## 4. Arquitectura Hexagonal y Principios SOLID

### 4.1 Principios SOLID Aplicados

- **S (Single Responsibility):** Cada clase tiene una sola razón para cambiar:
  - `YoloDetectorAdapter`: Solo interactúa con el modelo de detección.
  - `ProductResolverService`: Solo ejecuta la fusión ponderada de evidencias.
  - `HungarianTracker`: Solo resuelve la matriz de asignación inter-fotos.
- **O (Open/Closed):** Nuevos detectores o modelos (como actualizar de YOLOv8 a YOLOv11) se incorporan creando un nuevo adaptador sin alterar el dominio.
- **L (Liskov Substitution):** Cualquier implementación de `IVisionDetectorPort` o `IInventoryRepositoryPort` es intercambiable por mocks en pruebas unitarias.
- **I (Interface Segregation):** Puertos especializados y granulares (`IBarcodeReaderPort`, `IOcrExtractorPort`, `IVectorEmbeddingPort`).
- **D (Dependency Inversion):** La capa de Dominio no importa frameworks ni librerías de terceros; las dependencias se inyectan desde la infraestructura.

---

## 5. Clean Code: Buenas Prácticas de Desarrollo

1. **Value Objects Inmutables:** Los objetos que no tienen identidad conceptual (`BoundingBox`, `ConfidenceScore`, `Barcode`, `Sha256Checksum`) son inmutables (`dataclass(frozen=True)` en Python / `@immutable` con `freezed` en Dart).
2. **Sin 'Efectos Secundarios Ocultos':** Las funciones de cálculo matemático de IoU, homografía y puntuación bayesiana son **funciones puras**.
3. **Excepciones Expresivas:** Errores tipados que comunican el problema de negocio (`BlurryImageQualityException`, `UnresolvedExceptionsExistException`, `ChecksumMismatchException`).
4. **Mappers Bidireccionales:** Las entidades de base de datos nunca se exponen en la API ni se usan dentro del dominio; existen mappers explícitos `to_domain()` y `to_persistence()`.

---

## Goals / Non-Goals

**Goals:**
- Separación física e independiente de repositorios/carpetas: `backend/`, `mobile/`, `frontend/`, `infra/`.
- Modelo de dominio guiado por DDD con Aggregate Roots e invariantes protegidos.
- Desacoplamiento total de modelos de IA mediante puertos abstractos.
- Persistencia estructurada en PostgreSQL 18 con vectorización `pgvector`.
- Experiencia móvil nativa en Flutter con diseño alineado a la marca **Innovate Nutrition**.
- Consola web para supervisión y resolución de excepciones de inventario.

**Non-Goals:**
- No mezclar lógica de base de datos dentro de las entidades de dominio.
- No procesar inferencias de visión artificial directamente dentro de los controladores HTTP.
- No omitir trazabilidad en ninguna unidad contada.
