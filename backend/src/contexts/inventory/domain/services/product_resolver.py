from uuid import UUID, uuid4
from backend.src.contexts.catalog.domain.entities import Product
from backend.src.contexts.inventory.domain.entities import ProductMatch
from backend.src.contexts.inventory.domain.value_objects import ConfidenceScore, ResolutionStatus
from backend.src.contexts.perception.domain.ports import BarcodeReadResult, OcrReadResult, RawDetection


class ProductResolver:
    """Domain Service encargado de consolidar todas las evidencias y calcular el score de confianza.
    Evita delegar decisiones de negocio a LLMs generativos sin supervisión matemática."""

    def resolve(
        self,
        detection: RawDetection,
        barcode_results: list[BarcodeReadResult],
        ocr_result: OcrReadResult,
        candidate_matches: list[tuple[Product, float]],  # (Producto, similitud semántica pgvector)
        vlm_prediction: dict[str, str | float] | None = None,
    ) -> ProductMatch:
        participating_models = [
            {"model": "yolov8x", "version": "8.0.0-solgar-v1", "role": "object_detection"},
        ]
        signals: dict[str, float] = {
            "yolo_detection": detection.confidence,
            "barcode": 0.0,
            "ocr": ocr_result.confidence,
            "semantic_vector": 0.0,
            "multimodal": 0.0,
        }

        # 1. Regla Cortocircuito: Código de Barras Verificado (certeza determinística 100%)
        if barcode_results and candidate_matches:
            best_product, _ = candidate_matches[0]
            for b in barcode_results:
                for prod_barcode in best_product.barcodes:
                    if b.code == prod_barcode.value:
                        signals["barcode"] = 1.0
                        participating_models.append({"model": "pyzbar", "version": "0.1.9", "role": "barcode_reader"})
                        return ProductMatch(
                            id=uuid4(),
                            detection_id=uuid4(),
                            resolved_product_id=best_product.id,
                            status=ResolutionStatus.MATCHED,
                            confidence=ConfidenceScore(1.00),
                            signals_breakdown=signals,
                            participating_models=participating_models,
                        )

        # 2. Evaluación de candidatos vectoriales
        best_candidate: Product | None = None
        sem_score = 0.0
        if candidate_matches:
            best_candidate, sem_score = candidate_matches[0]
            signals["semantic_vector"] = sem_score
            participating_models.append({"model": "embeddinggemma", "version": "latest", "role": "vector_embeddings"})

        if ocr_result.raw_text:
            participating_models.append({"model": "paddleocr_v4", "version": "4.0.0", "role": "ocr_label_extractor"})

        # 3. Incorporación de VLM si participó en la evaluación
        vlm_score = 0.0
        if vlm_prediction:
            vlm_score = float(vlm_prediction.get("confidence", 0.75))
            signals["multimodal"] = vlm_score
            participating_models.append({"model": "qwen3-vl", "version": "2b-instruct", "role": "ambiguity_arbitrator"})

        # 4. Cálculo Ponderado de Fusión Multi-Señal
        # Pesos: detección (10%), OCR (35%), semántica (35%), multimodal (20%)
        w_det, w_ocr, w_sem, w_vlm = 0.10, 0.35, 0.35, 0.20
        raw_final = (
            (w_det * detection.confidence)
            + (w_ocr * ocr_result.confidence)
            + (w_sem * sem_score)
            + (w_vlm * vlm_score)
        )

        # 5. Penalización por Discordancia de Concentración (ej. OCR dice 500mg, candidato es 1000mg)
        ocr_conc = ocr_result.parsed_fields.get("concentration", "").lower()
        if best_candidate and ocr_conc:
            if ocr_conc not in best_candidate.name.lower() and ocr_conc not in best_candidate.presentation.lower():
                raw_final *= 0.50  # Fuerte penalización por discordancia

        final_score_value = max(0.0, min(1.0, round(raw_final, 3)))
        final_confidence = ConfidenceScore(final_score_value)

        resolved_id = best_candidate.id if best_candidate and final_confidence.status != ResolutionStatus.UNKNOWN else None

        return ProductMatch(
            id=uuid4(),
            detection_id=uuid4(),
            resolved_product_id=resolved_id,
            status=final_confidence.status,
            confidence=final_confidence,
            signals_breakdown=signals,
            participating_models=participating_models,
        )
