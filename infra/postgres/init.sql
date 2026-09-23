-- ==============================================================================
-- INVENTORY VISION AI - POSTGRESQL 18 DDL SCHEMA
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- 1. Jerarquía Organizacional y Ubicaciones
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    zone VARCHAR(50) NOT NULL,
    aisle VARCHAR(50),
    shelf VARCHAR(50),
    tray VARCHAR(50),
    barcode_identifier VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 2. Catálogo Canónico de Productos y Embeddings (Solgar / Innovate Nutrition)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL DEFAULT 'Solgar',
    presentation VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS product_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode VARCHAR(100) NOT NULL UNIQUE,
    barcode_type VARCHAR(20) NOT NULL DEFAULT 'UPC'
);

-- Tabla para representación semántica con EmbeddingGemma (vector 768d)
CREATE TABLE IF NOT EXISTS product_embeddings (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    embedding vector(768) NOT NULL,
    source_text TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_product_embeddings_hnsw 
ON product_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 3. Sesiones de Inventario
CREATE TABLE IF NOT EXISTS inventory_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id),
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'REVIEW_REQUIRED', 'CLOSED'
    operator_id VARCHAR(100) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    closed_at TIMESTAMPTZ
);

-- 4. Capturas y Evidencias Fotográficas (Particionadas por fecha)
CREATE TABLE IF NOT EXISTS inventory_captures (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    storage_s3_key VARCHAR(500) NOT NULL,
    image_sha256 CHAR(64) NOT NULL,
    sequence_number INT NOT NULL,
    homography_matrix JSONB,
    quality_metrics JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partición default para capturas
CREATE TABLE IF NOT EXISTS inventory_captures_default PARTITION OF inventory_captures DEFAULT;

-- 5. Registro de Inferencia y Versiones de Modelos
CREATE TABLE IF NOT EXISTS model_registry (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    weights_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (model_name, model_version)
);

-- 6. Detecciones Físicas (Bounding Boxes de YOLO)
CREATE TABLE IF NOT EXISTS detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capture_id UUID NOT NULL,
    capture_created_at TIMESTAMPTZ NOT NULL,
    bbox_x1 REAL NOT NULL,
    bbox_y1 REAL NOT NULL,
    bbox_x2 REAL NOT NULL,
    bbox_y2 REAL NOT NULL,
    yolo_confidence REAL NOT NULL,
    yolo_class VARCHAR(50) NOT NULL,
    crop_storage_s3_key VARCHAR(500),
    global_physical_object_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 7. Evidencias Específicas por Detección
CREATE TABLE IF NOT EXISTS barcode_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detection_id UUID NOT NULL REFERENCES detections(id) ON DELETE CASCADE,
    raw_code VARCHAR(100) NOT NULL,
    symbology VARCHAR(30) NOT NULL,
    confidence REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS ocr_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detection_id UUID NOT NULL REFERENCES detections(id) ON DELETE CASCADE,
    extracted_text TEXT NOT NULL,
    parsed_fields JSONB,
    confidence REAL NOT NULL
);

-- 8. Resolución y Emparejamiento de Producto (Product Match)
CREATE TABLE IF NOT EXISTS product_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detection_id UUID NOT NULL REFERENCES detections(id) ON DELETE CASCADE,
    resolved_product_id UUID REFERENCES products(id),
    resolution_status VARCHAR(30) NOT NULL, -- 'MATCHED', 'PROBABLE_MATCH', 'AMBIGUOUS', 'UNKNOWN'
    confidence_score REAL NOT NULL,
    signals_breakdown JSONB NOT NULL,
    participating_models JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 9. Validación Humana (Human-in-the-Loop)
CREATE TABLE IF NOT EXISTS user_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_match_id UUID NOT NULL REFERENCES product_matches(id) ON DELETE CASCADE,
    reviewed_by_user_id VARCHAR(100) NOT NULL,
    action_taken VARCHAR(50) NOT NULL, -- 'CONFIRMED', 'CORRECTED_SKU', 'REMOVED_FALSE_POSITIVE', 'ADDED_MISSED'
    original_product_id UUID REFERENCES products(id),
    corrected_product_id UUID REFERENCES products(id),
    reason TEXT,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 10. Conteo Consolidado e Ítems de Inventario
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    physical_count INT NOT NULL,
    deduplicated_detections_count INT NOT NULL,
    final_status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE(session_id, product_id)
);

-- 11. Auditoría Forense Inmutable
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
