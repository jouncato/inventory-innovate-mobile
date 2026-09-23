-- ==============================================================================
-- INVENTORY VISION AI - SEED DATA: SOLGAR COLOMBIA / INNOVATE NUTRITION
-- ==============================================================================

-- 1. Bodega Principal y Ubicaciones Iniciales
INSERT INTO warehouses (id, code, name) VALUES
('a0000000-0000-0000-0000-000000000001', 'BOD-CENTRAL', 'Bodega Central Innovate Nutrition')
ON CONFLICT (code) DO NOTHING;

INSERT INTO locations (id, warehouse_id, zone, aisle, shelf, tray, barcode_identifier) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'ZONA-A', 'PASILLO-01', 'ESTANTE-01', 'BANDEJA-01', 'LOC-A01-E01-B01'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'ZONA-A', 'PASILLO-01', 'ESTANTE-01', 'BANDEJA-02', 'LOC-A01-E01-B02'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'ZONA-A', 'PASILLO-01', 'ESTANTE-02', 'BANDEJA-01', 'LOC-A01-E02-B01')
ON CONFLICT (barcode_identifier) DO NOTHING;

-- 2. Catálogo Oficial Solgar Colombia
INSERT INTO products (id, sku, name, brand, presentation, category) VALUES
('c0000000-0000-0000-0000-000000000001', 'SOL-BCOMP-100', 'B-Complex with Vitamin C', 'Solgar', '100 Tablets', 'Vitaminas'),
('c0000000-0000-0000-0000-000000000002', 'SOL-VITD3-400', 'Vitamin D3 (Cholecalciferol) 400 IU', 'Solgar', '100 Softgels', 'Vitaminas'),
('c0000000-0000-0000-0000-000000000003', 'SOL-ESTERC-500', 'Ester-C Plus 500 mg', 'Solgar', '100 Vegetable Capsules', 'Vitaminas'),
('c0000000-0000-0000-0000-000000000004', 'SOL-VITC-1000', 'Vitamin C 1000 mg with Rose Hips', 'Solgar', '100 Tablets', 'Vitaminas'),
('c0000000-0000-0000-0000-000000000005', 'SOL-VITB12-500', 'Vitamin B12 500 mcg', 'Solgar', '100 Tablets', 'Vitaminas'),
('c0000000-0000-0000-0000-000000000006', 'SOL-OMEGA-950', 'Omega-3 EPA & DHA 950 mg', 'Solgar', '100 Softgels', 'Ácidos Grasos Esenciales'),
('c0000000-0000-0000-0000-000000000007', 'SOL-GENTLE-25', 'Gentle Iron (Iron Bisglycinate) 25 mg', 'Solgar', '90 Vegetable Capsules', 'Minerales'),
('c0000000-0000-0000-0000-000000000008', 'SOL-SKIN-NAILS', 'Skin, Nails & Hair Formula', 'Solgar', '120 Tablets', 'Suplementos Especializados'),
('c0000000-0000-0000-0000-000000000009', 'SOL-MAGN-CHEL', 'Chelated Magnesium', 'Solgar', '100 Tablets', 'Minerales'),
('c0000000-0000-0000-0000-000000000010', 'SOL-ZINC-PICOL', 'Zinc Picolinate 22 mg', 'Solgar', '100 Tablets', 'Minerales')
ON CONFLICT (sku) DO NOTHING;

-- 3. Códigos de Barras UPC Oficiales Solgar
INSERT INTO product_barcodes (product_id, barcode, barcode_type) VALUES
('c0000000-0000-0000-0000-000000000001', '033984002104', 'UPC'),
('c0000000-0000-0000-0000-000000000002', '033984033108', 'UPC'),
('c0000000-0000-0000-0000-000000000003', '033984010307', 'UPC'),
('c0000000-0000-0000-0000-000000000004', '033984022102', 'UPC'),
('c0000000-0000-0000-0000-000000000005', '033984031104', 'UPC'),
('c0000000-0000-0000-0000-000000000006', '033984020528', 'UPC'),
('c0000000-0000-0000-0000-000000000007', '033984012509', 'UPC'),
('c0000000-0000-0000-0000-000000000008', '033984017306', 'UPC'),
('c0000000-0000-0000-0000-000000000009', '033984007109', 'UPC'),
('c0000000-0000-0000-0000-000000000010', '033984036000', 'UPC')
ON CONFLICT (barcode) DO NOTHING;

-- 4. Registro de Modelos Base en el Registry
INSERT INTO model_registry (model_name, model_version, weights_hash) VALUES
('yolov8x', '8.0.0-solgar-v1', 'hash_weights_yolov8x_amber_bottles_2026'),
('paddleocr_v4', '4.0.0-latin', 'hash_weights_paddleocr_latin_v4'),
('embeddinggemma', 'latest-768d', 'hash_weights_embeddinggemma_768d'),
('qwen3-vl', '2b-instruct-q4', 'hash_weights_qwen3_vl_2b_instruct'),
('gemma4', '12b-it-q4', 'hash_weights_gemma4_12b_it')
ON CONFLICT (model_name, model_version) DO NOTHING;
