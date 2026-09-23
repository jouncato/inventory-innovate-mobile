from dataclasses import dataclass
from enum import Enum
from backend.src.shared.domain import DomainException


class InvalidBarcodeException(DomainException):
    pass


class BarcodeSymbology(str, Enum):
    UPC_A = "UPC_A"
    EAN_13 = "EAN_13"
    CODE_128 = "CODE_128"
    QR = "QR"


@dataclass(frozen=True)
class Barcode:
    value: str
    symbology: BarcodeSymbology = BarcodeSymbology.UPC_A

    def __post_init__(self):
        cleaned = self.value.strip()
        if not cleaned:
            raise InvalidBarcodeException("El código de barras no puede estar vacío.")

        # Validación de checksum para UPC-A (12 dígitos) y EAN-13 (13 dígitos)
        if self.symbology == BarcodeSymbology.UPC_A and cleaned.isdigit() and len(cleaned) == 12:
            if not self._verify_upc_checksum(cleaned):
                raise InvalidBarcodeException(f"Checksum UPC-A inválido para '{cleaned}'")
        elif self.symbology == BarcodeSymbology.EAN_13 and cleaned.isdigit() and len(cleaned) == 13:
            if not self._verify_ean13_checksum(cleaned):
                raise InvalidBarcodeException(f"Checksum EAN-13 inválido para '{cleaned}'")

    @staticmethod
    def _verify_upc_checksum(code: str) -> bool:
        odd_sum = sum(int(code[i]) for i in range(0, 11, 2))
        even_sum = sum(int(code[i]) for i in range(1, 10, 2))
        total = (odd_sum * 3) + even_sum
        check_digit = (10 - (total % 10)) % 10
        return check_digit == int(code[11])

    @staticmethod
    def _verify_ean13_checksum(code: str) -> bool:
        odd_sum = sum(int(code[i]) for i in range(1, 12, 2))
        even_sum = sum(int(code[i]) for i in range(0, 12, 2))
        total = (odd_sum * 3) + even_sum
        check_digit = (10 - (total % 10)) % 10
        return check_digit == int(code[12])


@dataclass(frozen=True)
class Sku:
    value: str

    def __post_init__(self):
        if not self.value or len(self.value.strip()) < 3:
            raise DomainException(f"SKU inválido: '{self.value}'")
