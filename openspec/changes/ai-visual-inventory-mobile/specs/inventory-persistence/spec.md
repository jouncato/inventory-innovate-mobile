## ADDED Requirements

### Requirement: Structured Relational and Vector Schema in PostgreSQL 18
El sistema SHALL persistir la totalidad de sesiones, capturas, evidencias, detecciones, versiones de modelos e ítems de inventario consolidado en PostgreSQL 18, utilizando la extensión `pgvector` para indexación HNSW de embeddings semánticos.

#### Scenario: Creación de sesión de inventario vinculada a ubicación
- **WHEN** un operador inicia una sesión enviando el código de una bandeja o estante
- **THEN** el sistema registra la tupla en inventory_sessions validando integridad referencial contra la tabla de ubicaciones geográficas y bodegas.

#### Scenario: Persistencia de vectores de catálogo con HNSW
- **WHEN** se sincroniza o actualiza el catálogo de productos
- **THEN** las representaciones vectoriales generadas con EmbeddingGemma se almacenan en product_embeddings indexadas mediante un índice HNSW con métrica vector_cosine_ops.

### Requirement: Forensic Traceability and Audit Trail
El sistema SHALL almacenar la trazabilidad completa de cada unidad física contada, relacionando el conteo final con la captura original, el recorte en S3, la versión del modelo participante, las señales individuales y cualquier corrección humana.

#### Scenario: Reconstrucción de evidencia de un ítem contado
- **WHEN** un auditor consulta la trazabilidad de un SKU inventariado en una sesión
- **THEN** el sistema retorna la cadena inmutable que enlaza el registro final con las coordenadas BBox, el enlace a la imagen original en MinIO/S3, los scores de cada señal y el identificador del usuario que validó la excepción.

### Requirement: Human-in-the-Loop Validation Logging
El sistema SHALL registrar en la tabla `user_validations` cada acción correctiva ejecutada por el operador (confirmar, corregir SKU, descartar falso positivo, agregar omitido), preservando el estado previo y posterior.

#### Scenario: Corrección manual de un producto ambiguo
- **WHEN** el operador selecciona una referencia corregida para una detección no resuelta
- **THEN** el sistema almacena la tupla de validación con el ID del operador, timestamp exacto, motivo y actualiza el conteo consolidado en `inventory_items`.
