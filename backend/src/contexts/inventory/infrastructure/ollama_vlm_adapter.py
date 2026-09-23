import base64
import json
import httpx
from backend.src.config import settings
from backend.src.contexts.inventory.domain.ports import IMultimodalReasonerPort


class OllamaVlmAdapter(IMultimodalReasonerPort):
    """Adaptador de infraestructura para razonamiento multimodal con Qwen3-VL y Gemma 4.
    Se activa únicamente de forma condicional para resolver ambigüedades en recortes de frascos."""

    def __init__(self, ollama_host: str | None = None, vlm_model: str | None = None):
        self.ollama_host = ollama_host or settings.OLLAMA_HOST
        self.vlm_model = vlm_model or settings.VLM_MODEL

    def reason_ambiguous_crop(self, crop_bytes: bytes, candidates_context: list[str]) -> dict[str, str | float]:
        crop_base64 = base64.b64encode(crop_bytes).decode("utf-8")
        candidates_str = ", ".join(candidates_context[:5])

        prompt = (
            f"Analiza este frasco de suplemento Solgar. Candidatos probables: [{candidates_str}]. "
            "Responde estrictamente en formato JSON válido con los campos: "
            '{"best_match_name": "nombre", "confidence": 0.85, "reason": "texto legible"}'
        )

        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(
                    f"{self.ollama_host}/api/generate",
                    json={
                        "model": self.vlm_model,
                        "prompt": prompt,
                        "images": [crop_base64],
                        "stream": False,
                        "format": "json",
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    response_text = data.get("response", "{}")
                    parsed = json.loads(response_text)
                    return {
                        "best_match_name": str(parsed.get("best_match_name", "")),
                        "confidence": float(parsed.get("confidence", 0.70)),
                        "reason": str(parsed.get("reason", "Inferencia visual Qwen3-VL")),
                    }
        except Exception as e:
            print(f"[OllamaVlmAdapter] VLM no disponible ({e}), utilizando respuesta heurística.")

        # Fallback de simulación en desarrollo
        fallback_name = candidates_context[0] if candidates_context else "Ester-C Plus 500 mg"
        return {
            "best_match_name": fallback_name,
            "confidence": 0.75,
            "reason": "Resolución multimodal simulada (VLM offline)",
        }
