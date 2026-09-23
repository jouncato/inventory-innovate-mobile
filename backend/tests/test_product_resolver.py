import pytest
from backend.src.contexts.catalog.domain.entities import Product
from backend.src.contexts.catalog.domain.value_objects import Barcode, BarcodeSymbology
from backend.src.contexts.inventory.domain.services.product_resolver import ProductResolver
from backend.src.contexts.inventory.domain.value_objects import ResolutionStatus
from backend.src.contexts.perception.domain.ports import (
    BarcodeReadResult,
    OcrReadResult,
    RawDetection,
)
from backend.src.contexts.perception.domain.value_objects import BoundingBox


def create_sample_product(sku_str: str, name: str, presentation: str, barcode_str: str) -> Product:
    return Product.create(
        sku=sku_str,
        name=name,
        brand="Solgar",
        presentation=presentation,
        category="Suplementos",
        barcodes=[Barcode(value=barcode_str, symbology=BarcodeSymbology.UPC_A)],
    )


class TestProductResolver:
    def setup_method(self):
        self.resolver = ProductResolver()
        self.solgar_ester_c = create_sample_product(
            sku_str="SOL-01300",
            name="Ester-C Plus 1000 mg Vitamina C",
            presentation="Frasco ámbar x 90 comprimidos",
            barcode_str="033984013001",
        )
        self.solgar_ester_c_500 = create_sample_product(
            sku_str="SOL-01302",
            name="Ester-C Plus 500 mg Vitamina C",
            presentation="Frasco ámbar x 100 cápsulas",
            barcode_str="033984013025",
        )

    def test_short_circuit_on_exact_barcode(self):
        detection = RawDetection(
            bbox=BoundingBox(10, 10, 50, 80),
            confidence=0.92,
            detected_class="amber_bottle",
        )
        barcode_result = BarcodeReadResult(
            code="033984013001",
            symbology="UPC_A",
            confidence=1.0,
        )
        ocr_result = OcrReadResult(
            raw_text="SOLGAR ESTER-C",
            confidence=0.70,
            parsed_fields={},
        )
        candidates = [(self.solgar_ester_c, 0.95)]

        match = self.resolver.resolve(
            detection=detection,
            barcode_results=[barcode_result],
            ocr_result=ocr_result,
            candidate_matches=candidates,
        )

        assert match.status == ResolutionStatus.MATCHED
        assert match.confidence.value == 1.00
        assert match.resolved_product_id == self.solgar_ester_c.id
        assert match.signals_breakdown["barcode"] == 1.0

    def test_multi_signal_without_barcode_matched(self):
        # Front-facing shot: No barcode visible, but clear OCR and semantic vector
        detection = RawDetection(
            bbox=BoundingBox(10, 10, 50, 80),
            confidence=0.95,
            detected_class="amber_bottle",
        )
        ocr_result = OcrReadResult(
            raw_text="SOLGAR ESTER-C PLUS 1000 MG 90 TABLETS",
            confidence=0.90,
            parsed_fields={"concentration": "1000 mg", "count": "90"},
        )
        # Vector search similarity = 0.92
        candidates = [(self.solgar_ester_c, 0.92)]

        match = self.resolver.resolve(
            detection=detection,
            barcode_results=[],  # No barcode
            ocr_result=ocr_result,
            candidate_matches=candidates,
        )

        # 0.10*0.95 + 0.35*0.90 + 0.35*0.92 = 0.095 + 0.315 + 0.322 = 0.732 (PROBABLE_MATCH)
        assert match.status in (ResolutionStatus.MATCHED, ResolutionStatus.PROBABLE_MATCH)
        assert match.resolved_product_id == self.solgar_ester_c.id

    def test_concentration_mismatch_applies_penalty(self):
        # OCR reads "500 mg", but top candidate is the "1000 mg" bottle
        detection = RawDetection(
            bbox=BoundingBox(10, 10, 50, 80),
            confidence=0.90,
            detected_class="amber_bottle",
        )
        ocr_result = OcrReadResult(
            raw_text="SOLGAR ESTER-C PLUS 500 MG",
            confidence=0.85,
            parsed_fields={"concentration": "500 mg"},
        )
        candidates = [(self.solgar_ester_c, 0.88)]  # Candidate is 1000 mg!

        match = self.resolver.resolve(
            detection=detection,
            barcode_results=[],
            ocr_result=ocr_result,
            candidate_matches=candidates,
        )

        # Due to 50% concentration penalty, confidence drops into AMBIGUOUS or UNKNOWN
        assert match.status in (ResolutionStatus.AMBIGUOUS, ResolutionStatus.UNKNOWN)
        assert match.confidence.requires_human_review

    def test_vlm_arbitration_boosts_ambiguous_case(self):
        detection = RawDetection(
            bbox=BoundingBox(10, 10, 50, 80),
            confidence=0.90,
            detected_class="amber_bottle",
        )
        ocr_result = OcrReadResult(
            raw_text="SOLGAR ESTER-C",
            confidence=0.60,
            parsed_fields={},
        )
        candidates = [(self.solgar_ester_c, 0.70)]

        # Without VLM
        match_no_vlm = self.resolver.resolve(
            detection=detection,
            barcode_results=[],
            ocr_result=ocr_result,
            candidate_matches=candidates,
        )

        # With Qwen3-VL arbiter confirmation
        vlm_prediction = {
            "model": "qwen3-vl:2b",
            "confidence": 0.95,
            "verdict": "Ester-C Plus 1000 mg",
        }
        match_with_vlm = self.resolver.resolve(
            detection=detection,
            barcode_results=[],
            ocr_result=ocr_result,
            candidate_matches=candidates,
            vlm_prediction=vlm_prediction,
        )

        assert match_with_vlm.confidence.value > match_no_vlm.confidence.value
        assert any(m["model"] == "qwen3-vl" for m in match_with_vlm.participating_models)
