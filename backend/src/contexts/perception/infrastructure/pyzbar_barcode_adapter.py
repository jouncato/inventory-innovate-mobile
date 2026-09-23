import cv2
import numpy as np
from backend.src.contexts.perception.domain.ports import IBarcodeReaderPort, BarcodeReadResult


class PyzbarBarcodeAdapter(IBarcodeReaderPort):
    """Adaptador de infraestructura para detección determinística de códigos de barras (1D/2D)."""

    def read_barcodes(self, image_bytes: bytes) -> list[BarcodeReadResult]:
        image_np = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
        if img is None:
            return []

        results: list[BarcodeReadResult] = []

        try:
            from pyzbar import pyzbar
            # Intentar decodificación directa en escala de grises
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            decoded = pyzbar.decode(gray)

            # Si no detecta de inmediato, aplicar realce adaptativo CLAHE (ideal para frascos oscuros reflectantes)
            if not decoded:
                clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
                enhanced = clahe.apply(gray)
                decoded = pyzbar.decode(enhanced)

            for item in decoded:
                code_str = item.data.decode("utf-8", errors="ignore").strip()
                symbology = str(item.type)
                if code_str:
                    results.append(
                        BarcodeReadResult(
                            code=code_str,
                            symbology=symbology,
                            confidence=1.0,
                        )
                    )
        except Exception as e:
            # Fallback seguro si pyzbar / zbar shared library no está presente en el host
            print(f"[PyzbarBarcodeAdapter] Error al procesar barcode: {e}")

        # Intentar también con el detector nativo de OpenCV si pyzbar no encontró nada
        if not results:
            results.extend(self._opencv_fallback_reader(img))

        return results

    def _opencv_fallback_reader(self, img: np.ndarray) -> list[BarcodeReadResult]:
        fallback_results: list[BarcodeReadResult] = []
        try:
            detector = cv2.barcode.BarcodeDetector()
            ok, decoded_info, decoded_type, _ = detector.detectAndDecode(img)
            if ok and decoded_info:
                for code, sym in zip(decoded_info, decoded_type):
                    if code:
                        fallback_results.append(
                            BarcodeReadResult(code=code, symbology=str(sym), confidence=1.0)
                        )
        except Exception:
            pass
        return fallback_results
