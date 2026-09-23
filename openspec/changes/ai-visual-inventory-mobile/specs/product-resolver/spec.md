## ADDED Requirements

### Requirement: Deterministic Multi-Signal Evidence Fusion
El componente Product Resolver SHALL consolidar las evidencias procedentes de detección física (YOLO), código de barras, OCR, similitud vectorial y modelos multimodales, calculando un índice de confianza final normalizado entre 0.0 y 1.0.

#### Scenario: Resolución unívoca por código de barras verificado
- **WHEN** una detección posee un código de barras válido que coincide con una referencia existente en el catálogo
- **THEN** el Product Resolver clasifica el estado como MATCHED con score 1.00, omitiendo ejecuciones de inferencia generativa.

#### Scenario: Fusión de OCR y búsqueda semántica
- **WHEN** no hay código de barras legible pero el texto extraído por OCR genera una alta coincidencia vectorial
- **THEN** el Product Resolver calcula el score ponderado C_final y clasifica como MATCHED (≥ 0.90) o PROBABLE_MATCH (0.70 - 0.89).

### Requirement: Vector Catalog Search via EmbeddingGemma
El Product Resolver SHALL generar un vector de embedding para los textos extraídos por OCR utilizando `embeddinggemma:latest` y consultar los Top-K candidatos en PostgreSQL 18 mediante distancia coseno (`pgvector`).

#### Scenario: Búsqueda de candidatos similares
- **WHEN** se extrae el texto "B-COMPLEX WITH VITAMIN C 100 TABS"
- **THEN** el sistema genera el vector denso y recupera en menos de 20 ms los 5 productos más afines del catálogo almacenados en la tabla product_embeddings.

### Requirement: Conditional Multimodal Fallback (Qwen3-VL & Gemma 4)
El sistema SHALL invocar a `qwen3-vl:2b` o `gemma4:12b` de forma estrictamente condicional, únicamente cuando el score de resolución se encuentre en rango de ambigüedad (0.40 a 0.69).

#### Scenario: Desempate visual multimodal con Qwen3-VL
- **WHEN** un recorte presenta un score de resolución ambiguo y etiqueta con texto ruidoso
- **THEN** el orquestador envía el recorte a Qwen3-VL solicitando identificación de variante en formato JSON estructurado, ajustando el score de confianza final.

#### Scenario: Clasificación como excepción humana
- **WHEN** tras la evaluación condicional el score de confianza resultante permanece inferior a 0.70
- **THEN** el sistema marca el producto como AMBIGUOUS o UNKNOWN e incluye la detección en la lista de excepciones para confirmación obligatoria del operador.
