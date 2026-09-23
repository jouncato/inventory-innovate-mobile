import pytest
from backend.src.shared.domain import DomainException
from backend.src.contexts.perception.domain.value_objects import (
    BoundingBox,
    QualityMetrics,
    Sha256Checksum,
    InvalidBoundingBoxException,
    InvalidChecksumException,
)
from backend.src.contexts.catalog.domain.value_objects import (
    Barcode,
    BarcodeSymbology,
    Sku,
    InvalidBarcodeException,
)
from backend.src.contexts.inventory.domain.value_objects import (
    ConfidenceScore,
    ResolutionStatus,
)


class TestBoundingBox:
    def test_valid_bounding_box(self):
        bbox = BoundingBox(x1=10.0, y1=20.0, x2=50.0, y2=80.0)
        assert bbox.width == 40.0
        assert bbox.height == 60.0
        assert bbox.area == 2400.0
        assert bbox.center == (30.0, 50.0)

    def test_invalid_coords_raise_exception(self):
        with pytest.raises(InvalidBoundingBoxException):
            BoundingBox(x1=50.0, y1=20.0, x2=10.0, y2=80.0)  # x1 > x2

        with pytest.raises(InvalidBoundingBoxException):
            BoundingBox(x1=10.0, y1=80.0, x2=50.0, y2=20.0)  # y1 > y2

        with pytest.raises(InvalidBoundingBoxException):
            BoundingBox(x1=-5.0, y1=10.0, x2=50.0, y2=60.0)  # x1 < 0

    def test_iou_identical_boxes(self):
        box1 = BoundingBox(x1=0.0, y1=0.0, x2=10.0, y2=10.0)
        box2 = BoundingBox(x1=0.0, y1=0.0, x2=10.0, y2=10.0)
        assert pytest.approx(box1.calculate_iou(box2), 0.001) == 1.0

    def test_iou_disjoint_boxes(self):
        box1 = BoundingBox(x1=0.0, y1=0.0, x2=10.0, y2=10.0)
        box2 = BoundingBox(x1=20.0, y1=20.0, x2=30.0, y2=30.0)
        assert box1.calculate_iou(box2) == 0.0

    def test_iou_partial_overlap(self):
        box1 = BoundingBox(x1=0.0, y1=0.0, x2=10.0, y2=10.0)  # Area 100
        box2 = BoundingBox(x1=5.0, y1=0.0, x2=15.0, y2=10.0)  # Area 100
        # Intersection: [5..10] x [0..10] = 5 * 10 = 50
        # Union: 100 + 100 - 50 = 150
        # IoU: 50 / 150 = 0.3333
        assert pytest.approx(box1.calculate_iou(box2), 0.01) == 0.333


class TestQualityMetrics:
    def test_acceptable_quality(self):
        metrics = QualityMetrics(blur_score=150.0, luminance=120.0)
        assert metrics.is_acceptable
        assert not metrics.is_blurry
        assert not metrics.is_overexposed
        assert not metrics.is_underexposed

    def test_blurry_image(self):
        metrics = QualityMetrics(blur_score=45.0, luminance=120.0)
        assert not metrics.is_acceptable
        assert metrics.is_blurry

    def test_overexposed_image(self):
        metrics = QualityMetrics(blur_score=200.0, luminance=235.0)
        assert not metrics.is_acceptable
        assert metrics.is_overexposed

    def test_underexposed_image(self):
        metrics = QualityMetrics(blur_score=200.0, luminance=20.0)
        assert not metrics.is_acceptable
        assert metrics.is_underexposed


class TestSha256Checksum:
    def test_valid_sha256(self):
        valid_hash = "a3f89e24b78c12de45fa1098ef45b91024cd9812faeb4718029decf8471201aa"
        chk = Sha256Checksum(value=valid_hash)
        assert chk.value == valid_hash

    def test_invalid_sha256_raises(self):
        with pytest.raises(InvalidChecksumException):
            Sha256Checksum(value="not-a-valid-sha256-too-short")


class TestConfidenceScore:
    def test_score_boundaries(self):
        assert ConfidenceScore(0.0).value == 0.0
        assert ConfidenceScore(1.0).value == 1.0

        with pytest.raises(DomainException):
            ConfidenceScore(-0.1)

        with pytest.raises(DomainException):
            ConfidenceScore(1.01)

    def test_resolution_status_mapping(self):
        assert ConfidenceScore(0.95).status == ResolutionStatus.MATCHED
        assert not ConfidenceScore(0.95).requires_human_review

        assert ConfidenceScore(0.78).status == ResolutionStatus.PROBABLE_MATCH
        assert not ConfidenceScore(0.78).requires_human_review

        assert ConfidenceScore(0.55).status == ResolutionStatus.AMBIGUOUS
        assert ConfidenceScore(0.55).requires_human_review

        assert ConfidenceScore(0.20).status == ResolutionStatus.UNKNOWN
        assert ConfidenceScore(0.20).requires_human_review


class TestBarcodeAndSku:
    def test_valid_solgar_upc_a(self):
        # Solgar Ester-C 1000mg official UPC: 033984013001
        barcode = Barcode(value="033984013001", symbology=BarcodeSymbology.UPC_A)
        assert barcode.value == "033984013001"

    def test_invalid_upc_checksum_raises(self):
        with pytest.raises(InvalidBarcodeException):
            Barcode(value="033984013009", symbology=BarcodeSymbology.UPC_A)  # Wrong check digit

    def test_valid_ean13(self):
        barcode = Barcode(value="7702001001231", symbology=BarcodeSymbology.EAN_13)
        assert barcode.value == "7702001001231"

    def test_empty_barcode_raises(self):
        with pytest.raises(InvalidBarcodeException):
            Barcode(value="   ")

    def test_valid_sku(self):
        sku = Sku("SOL-01300")
        assert sku.value == "SOL-01300"

    def test_invalid_sku_raises(self):
        with pytest.raises(DomainException):
            Sku("A")
