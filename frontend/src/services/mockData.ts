import type { InventorySession, SolgarProduct, DetectedObject, AuditTrailEvent } from '../types/inventory';

export const MOCK_SESSIONS: InventorySession[] = [
  {
    id: 'ses-col-bgo-001',
    session_code: 'INV-2026-0923-01',
    warehouse_id: 'wh-bgo-central',
    warehouse_name: 'Bodega Principal Bogotá - Calle 80',
    location_zone: 'Pasillo 04 - Estantería B (Suplementos Vitamínicos)',
    operator_id: 'op-carlos-m',
    operator_name: 'Carlos Mendoza (Operador Bodega)',
    status: 'OPEN',
    started_at: '2026-09-23T08:30:00Z',
    total_captures: 14,
    total_detected_units: 128,
    total_unique_products: 16,
    auto_resolved_count: 119,
    pending_exceptions_count: 9,
    accuracy_rate: 93.0,
  },
  {
    id: 'ses-col-med-002',
    session_code: 'INV-2026-0922-04',
    warehouse_id: 'wh-med-distrib',
    warehouse_name: 'Centro de Distribución Medellín - Envigado',
    location_zone: 'Pasillo 02 - Zona Fría / Antioxidantes',
    operator_id: 'op-laura-v',
    operator_name: 'Laura Valencia (Supervisora Calidad)',
    status: 'CLOSED',
    started_at: '2026-09-22T14:15:00Z',
    closed_at: '2026-09-22T16:45:00Z',
    total_captures: 26,
    total_detected_units: 342,
    total_unique_products: 24,
    auto_resolved_count: 335,
    pending_exceptions_count: 0,
    accuracy_rate: 98.0,
  },
];

export const MOCK_CATALOG: SolgarProduct[] = [
  {
    sku: 'SOL-01300',
    name: 'Ester-C® Plus 1000 mg Vitamina C',
    presentation: 'Frasco ámbar x 90 comprimidos',
    barcode: '033984013001',
    category: 'Vitamina C y Antioxidantes',
    active_ingredients: 'Vitamina C no ácida (L-ascorbato cálcico), bioflavonoides cítricos, escaramujo',
    theoretical_stock: 45,
    counted_stock: 42,
    discrepancy: -3,
    catalog_image_url: 'https://solgarcolombia.com/wp-content/uploads/2021/04/Ester-C-1000mg.jpg',
  },
  {
    sku: 'SOL-02050',
    name: 'Omega 3-6-9 EFA Doble Concentración',
    presentation: 'Frasco ámbar x 120 softgels',
    barcode: '033984020504',
    category: 'Ácidos Grasos Esenciales',
    active_ingredients: 'Aceite de pescado purificado, aceite de linaza, aceite de borraja',
    theoretical_stock: 30,
    counted_stock: 30,
    discrepancy: 0,
    catalog_image_url: 'https://solgarcolombia.com/wp-content/uploads/2021/04/Omega-369.jpg',
  },
  {
    sku: 'SOL-03410',
    name: 'Vitamina D3 (Colecalciferol) 5000 UI',
    presentation: 'Frasco ámbar x 100 softgels',
    barcode: '033984034105',
    category: 'Vitaminas Liposolubles',
    active_ingredients: 'Vitamina D3 natural de aceite de hígado de bacalao',
    theoretical_stock: 60,
    counted_stock: 58,
    discrepancy: -2,
    catalog_image_url: 'https://solgarcolombia.com/wp-content/uploads/2021/04/Vit-D3-5000UI.jpg',
  },
  {
    sku: 'SOL-00520',
    name: 'Calcio y Magnesio con Vitamina D3',
    presentation: 'Frasco ámbar x 150 tabletas',
    barcode: '033984005204',
    category: 'Minerales y Huesos',
    active_ingredients: 'Citrato de calcio, óxido de magnesio, colecalciferol',
    theoretical_stock: 25,
    counted_stock: 26,
    discrepancy: 1,
    catalog_image_url: 'https://solgarcolombia.com/wp-content/uploads/2021/04/Calcium-Mag-D3.jpg',
  },
  {
    sku: 'SOL-01430',
    name: 'Curcumina de Espectro Completo NovaSOL®',
    presentation: 'Frasco ámbar x 60 softgels',
    barcode: '033984014305',
    category: 'Hierbas Estandarizadas',
    active_ingredients: 'Extracto micelar de cúrcuma (Curcuma longa) 185x biodisponible',
    theoretical_stock: 20,
    counted_stock: 20,
    discrepancy: 0,
    catalog_image_url: 'https://solgarcolombia.com/wp-content/uploads/2021/04/Full-Spectrum-Curcumin.jpg',
  },
  {
    sku: 'SOL-00340',
    name: 'Biotina 5000 mcg (Vitamina B7)',
    presentation: 'Frasco ámbar x 100 cápsulas vegetales',
    barcode: '033984003406',
    category: 'Salud Piel, Uñas y Cabello',
    active_ingredients: 'D-Biotina pura USP',
    theoretical_stock: 40,
    counted_stock: 37,
    discrepancy: -3,
    catalog_image_url: 'https://solgarcolombia.com/wp-content/uploads/2021/04/Biotin-5000mcg.jpg',
  },
  {
    sku: 'SOL-00120',
    name: 'Complejo B "100" Alta Potencia',
    presentation: 'Frasco ámbar x 100 cápsulas vegetales',
    barcode: '033984001204',
    category: 'Complejo B y Energía',
    active_ingredients: 'Tiamina B1, Riboflavina B2, Niacina B3, B6, Folato, B12, Biotina',
    theoretical_stock: 18,
    counted_stock: 18,
    discrepancy: 0,
    catalog_image_url: 'https://solgarcolombia.com/wp-content/uploads/2021/04/B-Complex-100.jpg',
  }
];

export const MOCK_DISCREPANCIES: DetectedObject[] = [
  {
    id: 'obj-exc-001',
    capture_id: 'cap-008-p4',
    session_id: 'ses-col-bgo-001',
    bbox: { x_min: 0.12, y_min: 0.35, x_max: 0.28, y_max: 0.88 },
    crop_s3_key: 'crops/2026/09/23/ses-col-bgo-001/crop-obj-001.webp',
    crop_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="340" viewBox="0 0 220 340"><rect width="220" height="340" fill="%231E293B" rx="16"/><rect x="40" y="30" width="140" height="40" rx="8" fill="%2386754D"/><rect x="30" y="80" width="160" height="230" rx="16" fill="%2358311F"/><rect x="45" y="110" width="130" height="150" fill="%23F3E8D0" rx="6"/><text x="110" y="145" font-family="sans-serif" font-weight="bold" font-size="14" fill="%2333499C" text-anchor="middle">SOLGAR</text><text x="110" y="170" font-family="sans-serif" font-size="11" fill="%231B2559" text-anchor="middle">ESTER-C PLUS</text><text x="110" y="195" font-family="sans-serif" font-size="13" font-weight="bold" fill="%2386754D" text-anchor="middle">1000 MG</text><text x="110" y="235" font-family="sans-serif" font-size="10" fill="%23555" text-anchor="middle">[Etiqueta de Espalda]</text></svg>',
    status: 'NEEDS_REVIEW',
    ocr_extracted_text: 'SOLGAR SINCE 1947 ESTER-C PLUS 1000 MG VITAMIN C 90 TABLETS NON-ACIDIC',
    barcode_detected: undefined,
    vector_distance: 0.142,
    vlm_verdict: 'Frasco de vidrio ámbar Solgar con tapa dorada metálica estriada. El texto frontal identifica Ester-C Plus 1000 mg de 90 comprimidos. El código de barras no fue visible por orientación frontal.',
    matched_product: {
      product_id: 'prod-01',
      sku: 'SOL-01300',
      name: 'Ester-C® Plus 1000 mg Vitamina C',
      presentation: 'Frasco ámbar x 90 comprimidos',
      barcode: '033984013001',
      confidence: 0.74,
      resolution_type: 'VECTOR_OCR_HYBRID',
      signals_used: ['YOLO_BOTTLE', 'OCR_EXTRACT', 'EMBEDDING_GEMMA_768D']
    },
    candidates: [
      {
        product_id: 'prod-01',
        sku: 'SOL-01300',
        name: 'Ester-C® Plus 1000 mg Vitamina C (90 tabs)',
        presentation: 'Frasco ámbar x 90 comprimidos',
        barcode: '033984013001',
        confidence: 0.74,
        resolution_type: 'VECTOR_OCR_HYBRID',
        signals_used: ['OCR_TEXT_MATCH', 'EMBEDDING_COSINE_0.858']
      },
      {
        product_id: 'prod-02',
        sku: 'SOL-01302',
        name: 'Ester-C® Plus 500 mg Vitamina C (100 caps)',
        presentation: 'Frasco ámbar x 100 cápsulas',
        barcode: '033984013025',
        confidence: 0.51,
        resolution_type: 'VECTOR_OCR_HYBRID',
        signals_used: ['SIMILAR_BRAND_TITLE']
      }
    ],
    inference_logs: [
      {
        model_name: 'yolov8x-solgar-custom',
        model_version: 'v2.1.0',
        latency_ms: 38,
        confidence: 0.94,
        signals: { class: 'amber_bottle', gold_cap_detected: true },
        timestamp: '2026-09-23T08:34:12Z'
      },
      {
        model_name: 'paddleocr-v4-es',
        model_version: '4.0.2',
        latency_ms: 112,
        confidence: 0.81,
        signals: { raw_lines: ['SOLGAR', 'ESTER-C PLUS', '1000 MG', '90 TABLETS'] },
        timestamp: '2026-09-23T08:34:12Z'
      },
      {
        model_name: 'embeddinggemma:latest',
        model_version: 'ollama-gemma-embed-768d',
        latency_ms: 64,
        confidence: 0.86,
        signals: { cosine_distance: 0.142, nearest_sku: 'SOL-01300' },
        timestamp: '2026-09-23T08:34:12Z'
      },
      {
        model_name: 'qwen3-vl:2b',
        model_version: 'ollama-qwen3-vl-q4_k_m',
        latency_ms: 380,
        confidence: 0.89,
        signals: { prompt_token_count: 512, reasoning: 'Identified 1000 mg concentration in upper label' },
        timestamp: '2026-09-23T08:34:13Z'
      }
    ]
  },
  {
    id: 'obj-exc-002',
    capture_id: 'cap-011-p4',
    session_id: 'ses-col-bgo-001',
    bbox: { x_min: 0.55, y_min: 0.28, x_max: 0.72, y_max: 0.85 },
    crop_s3_key: 'crops/2026/09/23/ses-col-bgo-001/crop-obj-002.webp',
    crop_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="340" viewBox="0 0 220 340"><rect width="220" height="340" fill="%231E293B" rx="16"/><rect x="40" y="30" width="140" height="40" rx="8" fill="%2386754D"/><rect x="30" y="80" width="160" height="230" rx="16" fill="%2358311F"/><rect x="45" y="110" width="130" height="150" fill="%23F3E8D0" rx="6"/><text x="110" y="145" font-family="sans-serif" font-weight="bold" font-size="14" fill="%2333499C" text-anchor="middle">SOLGAR</text><text x="110" y="170" font-family="sans-serif" font-size="11" fill="%231B2559" text-anchor="middle">OMEGA 3-6-9</text><text x="110" y="195" font-family="sans-serif" font-size="12" font-weight="bold" fill="%2386754D" text-anchor="middle">120 SOFTGELS</text><text x="110" y="235" font-family="sans-serif" font-size="9" fill="%23E11D48" text-anchor="middle">[Brillo especular en cap]</text></svg>',
    status: 'NEEDS_REVIEW',
    ocr_extracted_text: 'SOLGAR OMEGA 3-6-9 EFA 120 SOFTGELS FISH OIL FLAX BORAGE',
    barcode_detected: undefined,
    vector_distance: 0.188,
    vlm_verdict: 'Frasco ámbar de gran porte con brillo especular en la etiqueta derecha. Coincide morfológicamente con presentación de 120 softgels.',
    matched_product: {
      product_id: 'prod-02',
      sku: 'SOL-02050',
      name: 'Omega 3-6-9 EFA Doble Concentración',
      presentation: 'Frasco ámbar x 120 softgels',
      barcode: '033984020504',
      confidence: 0.68,
      resolution_type: 'VLM_ARBITRATION',
      signals_used: ['YOLO_BOTTLE', 'OCR_EXTRACT', 'QWEN3_VL_ARBITER']
    },
    candidates: [
      {
        product_id: 'prod-02',
        sku: 'SOL-02050',
        name: 'Omega 3-6-9 EFA Doble Concentración (120 softgels)',
        presentation: 'Frasco ámbar x 120 softgels',
        barcode: '033984020504',
        confidence: 0.68,
        resolution_type: 'VLM_ARBITRATION',
        signals_used: ['OCR_TEXT_MATCH', 'VLM_CONCENTRATION_CHECK']
      },
      {
        product_id: 'prod-03',
        sku: 'SOL-02051',
        name: 'Omega 3 Doble Potencia (60 softgels)',
        presentation: 'Frasco ámbar x 60 softgels',
        barcode: '033984020511',
        confidence: 0.44,
        resolution_type: 'VECTOR_OCR_HYBRID',
        signals_used: ['SIMILAR_BRAND_TITLE']
      }
    ],
    inference_logs: [
      {
        model_name: 'yolov8x-solgar-custom',
        model_version: 'v2.1.0',
        latency_ms: 41,
        confidence: 0.91,
        signals: { class: 'amber_bottle' },
        timestamp: '2026-09-23T08:38:05Z'
      },
      {
        model_name: 'paddleocr-v4-es',
        model_version: '4.0.2',
        latency_ms: 98,
        confidence: 0.72,
        signals: { raw_lines: ['SOLGAR', 'OMEGA 3-6-9', '120 SOFTGELS'] },
        timestamp: '2026-09-23T08:38:05Z'
      },
      {
        model_name: 'qwen3-vl:2b',
        model_version: 'ollama-qwen3-vl-q4_k_m',
        latency_ms: 360,
        confidence: 0.78,
        signals: { decision: 'Omega 3-6-9 120 softgels' },
        timestamp: '2026-09-23T08:38:06Z'
      }
    ]
  }
];

export const MOCK_AUDIT_TRAIL: AuditTrailEvent[] = [
  {
    event_id: 'ev-001',
    timestamp: '2026-09-23T08:30:00Z',
    event_type: 'CAPTURE_UPLOADED',
    aggregate_id: 'cap-008-p4',
    operator_or_system: 'Mobile Operator (Carlos Mendoza)',
    details: {
      resolution: '4000x3000',
      device: 'Samsung Galaxy Tab Active4 Pro',
      laplacian_blur_score: 342.5,
      is_blurry: false,
      luminance: 142.1
    },
    evidence_sha256: 'a3f89e24b78c12de45fa1098ef45b91024cd9812faeb4718029decf8471201aa',
    evidence_s3_uri: 's3://raw-captures/2026/09/23/ses-col-bgo-001/cap-008-p4.webp'
  },
  {
    event_id: 'ev-002',
    timestamp: '2026-09-23T08:30:01Z',
    event_type: 'YOLO_INFERENCE',
    aggregate_id: 'cap-008-p4',
    operator_or_system: 'YOLOv8x Vision Detector (Celery Worker 01)',
    details: {
      model_version: 'yolov8x-solgar-v2.1',
      bounding_boxes_count: 8,
      latency_ms: 38,
      target_crop_bbox: { x_min: 0.12, y_min: 0.35, x_max: 0.28, y_max: 0.88 }
    },
    evidence_s3_uri: 's3://crops/2026/09/23/ses-col-bgo-001/crop-obj-001.webp'
  },
  {
    event_id: 'ev-003',
    timestamp: '2026-09-23T08:30:02Z',
    event_type: 'OCR_EMBEDDING',
    aggregate_id: 'obj-exc-001',
    operator_or_system: 'PaddleOCR v4 + Ollama embeddinggemma',
    details: {
      ocr_text: 'SOLGAR SINCE 1947 ESTER-C PLUS 1000 MG VITAMIN C 90 TABLETS',
      vector_dim: 768,
      nearest_neighbor_sku: 'SOL-01300',
      cosine_distance: 0.142
    }
  },
  {
    event_id: 'ev-004',
    timestamp: '2026-09-23T08:30:03Z',
    event_type: 'VLM_ARBITRATION',
    aggregate_id: 'obj-exc-001',
    operator_or_system: 'Ollama Qwen3-VL Arbiter',
    details: {
      reason_triggered: 'Confidence score (0.74) below automatic acceptance threshold (0.85)',
      verdict_sku: 'SOL-01300',
      verdict_rationale: 'Confirmed Ester-C Plus 1000 mg based on visible label banner',
      latency_ms: 380
    }
  },
  {
    event_id: 'ev-005',
    timestamp: '2026-09-23T08:30:04Z',
    event_type: 'HOMOGRAPHY_DEDUP',
    aggregate_id: 'obj-exc-001',
    operator_or_system: 'HomographyTracker (RANSAC + Hungarian)',
    details: {
      previous_capture_id: 'cap-007-p4',
      matched_previous_object: false,
      allocated_persistent_id: 'phys-obj-sol-01300-884',
      inliers_ratio: 0.82
    }
  },
  {
    event_id: 'ev-006',
    timestamp: '2026-09-23T08:45:10Z',
    event_type: 'HUMAN_VALIDATION',
    aggregate_id: 'obj-exc-001',
    operator_or_system: 'Supervisor Web Console (Carlos Mendoza)',
    details: {
      action: 'CONFIRM_MATCH',
      assigned_sku: 'SOL-01300',
      supervisor_notes: 'Etiqueta frontal perfectamente legible. Confirmado Ester-C 1000 mg 90 comprimidos.',
      ip_address: '192.168.1.45',
      user_agent: 'Chrome/124.0.0.0 (Windows NT 10.0)'
    }
  }
];
