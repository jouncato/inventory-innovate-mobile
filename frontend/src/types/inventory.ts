export interface QualityMetrics {
  blur_score: number;
  is_blurry: boolean;
  luminance: number;
  is_overexposed: boolean;
  is_underexposed: boolean;
}

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface ModelInferenceLog {
  model_name: string;
  model_version: string;
  latency_ms: number;
  confidence: number;
  signals: Record<string, any>;
  timestamp: string;
}

export interface ProductMatch {
  product_id: string;
  sku: string;
  name: string;
  presentation: string;
  barcode: string;
  confidence: number;
  resolution_type: 'BARCODE_EXACT' | 'VECTOR_OCR_HYBRID' | 'VLM_ARBITRATION' | 'MANUAL_OVERRIDE';
  signals_used: string[];
}

export interface DetectedObject {
  id: string;
  capture_id: string;
  session_id: string;
  bbox: BoundingBox;
  crop_s3_key: string;
  crop_url: string;
  status: 'PENDING' | 'RESOLVED_AUTO' | 'NEEDS_REVIEW' | 'MANUAL_VERIFIED' | 'DISCARDED';
  matched_product?: ProductMatch;
  candidates?: ProductMatch[];
  inference_logs: ModelInferenceLog[];
  ocr_extracted_text?: string;
  barcode_detected?: string;
  vector_distance?: number;
  vlm_verdict?: string;
  validation_notes?: string;
  validated_by?: string;
  validated_at?: string;
}

export interface CaptureEvidence {
  id: string;
  session_id: string;
  image_s3_key: string;
  image_url: string;
  sha256_hash: string;
  timestamp: string;
  quality: QualityMetrics;
  objects_detected_count: number;
  status: 'PROCESSED' | 'PROCESSING' | 'FAILED';
  detected_objects: DetectedObject[];
}

export interface InventorySession {
  id: string;
  session_code: string;
  warehouse_id: string;
  warehouse_name: string;
  location_zone: string;
  operator_id: string;
  operator_name: string;
  status: 'OPEN' | 'PAUSED' | 'IN_REVIEW' | 'CLOSED' | 'SYNCED';
  started_at: string;
  closed_at?: string;
  total_captures: number;
  total_detected_units: number;
  total_unique_products: number;
  auto_resolved_count: number;
  pending_exceptions_count: number;
  accuracy_rate: number;
}

export interface SolgarProduct {
  sku: string;
  name: string;
  presentation: string;
  barcode: string;
  category: string;
  active_ingredients: string;
  theoretical_stock: number;
  counted_stock: number;
  discrepancy: number;
  catalog_image_url: string;
}

export interface AuditTrailEvent {
  event_id: string;
  timestamp: string;
  event_type: 'CAPTURE_UPLOADED' | 'YOLO_INFERENCE' | 'OCR_EMBEDDING' | 'VLM_ARBITRATION' | 'HOMOGRAPHY_DEDUP' | 'HUMAN_VALIDATION' | 'SESSION_CLOSED';
  aggregate_id: string;
  operator_or_system: string;
  details: Record<string, any>;
  evidence_sha256?: string;
  evidence_s3_uri?: string;
}
