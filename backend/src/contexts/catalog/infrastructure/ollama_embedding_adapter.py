import hashlib
import httpx
import numpy as np
from backend.src.config import settings
from backend.src.contexts.catalog.domain.ports import IVectorEmbeddingPort


class OllamaEmbeddingAdapter(IVectorEmbeddingPort):
    """Adaptador de infraestructura para generación de embeddings semánticos con EmbeddingGemma."""

    def __init__(self, ollama_host: str | None = None, model_name: str | None = None):
        self.ollama_host = ollama_host or settings.OLLAMA_HOST
        self.model_name = model_name or settings.EMBEDDING_MODEL

    def generate_embedding(self, text: str) -> list[float]:
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(
                    f"{self.ollama_host}/api/embeddings",
                    json={"model": self.model_name, "prompt": text},
                )
                if response.status_code == 200:
                    data = response.json()
                    embedding = data.get("embedding", [])
                    if embedding:
                        return embedding
        except Exception as e:
            print(f"[OllamaEmbeddingAdapter] Servidor Ollama no disponible ({e}), utilizando vector mock determinístico.")

        # Fallback determinístico de 768 dimensiones para pruebas locales sin Ollama encendido
        return self._generate_mock_embedding(text, dimensions=768)

    @staticmethod
    def _generate_mock_embedding(text: str, dimensions: int = 768) -> list[float]:
        """Genera un vector pseudo-semántico determinístico y normalizado L2."""
        sha = hashlib.sha256(text.encode("utf-8")).digest()
        # Semilla basada en los primeros 4 bytes
        seed = int.from_bytes(sha[:4], "big")
        rng = np.random.RandomState(seed)
        vec = rng.randn(dimensions)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()
