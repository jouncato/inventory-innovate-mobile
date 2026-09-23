## ADDED Requirements

### Requirement: Deterministic Object Detection and Counting via YOLO
El servicio de orquestación visual SHALL procesar la imagen completa recibida mediante un modelo YOLO (YOLOv8x / YOLO-World) para detectar individualmente cada producto (frascos cilíndricos y tapas doradas), determinando sus coordenadas espaciales y el conteo físico preliminar.

#### Scenario: Detección y conteo de frascos en bandeja
- **WHEN** se envía una fotografía válida que contiene 12 frascos Solgar al endpoint de procesamiento
- **THEN** el orquestador visual MUST retornar exactamente las 12 coordenadas de bounding boxes [x1, y1, x2, y2] con su índice de confianza geométrica, sin alucinación de cantidades.

### Requirement: Local Crop Generation and Storage
El orquestador visual SHALL recortar (crop) individualmente cada objeto detectado y persistirlo en el almacenamiento de objetos (MinIO / S3) como evidencia visual independiente.

#### Scenario: Recorte individual de frasco
- **WHEN** YOLO detecta un bounding box con confianza superior al umbral configurado (ej. 0.50)
- **THEN** el servicio genera un recorte en formato WebP con compresión sin pérdida y almacena la clave S3 correspondiente en el registro de la detección.

### Requirement: Dedicated Barcode Extraction on Crops
El sistema SHALL ejecutar un detector y lector especializado de códigos de barras (EAN-13, UPC, Code 128) tanto sobre la imagen completa como sobre cada recorte individual generado.

#### Scenario: Lectura exitosa de código de barras
- **WHEN** un frasco presenta su código de barras visible y con calidad legible en el recorte
- **THEN** el lector decodifica el valor exacto, calcula la validez del dígito de verificación (checksum) y asocia el código a la evidencia con confianza 1.0.

### Requirement: Label OCR and Entity Parsing
El sistema SHALL ejecutar un motor OCR especializado (PaddleOCR v4) sobre los recortes de productos que carezcan de código de barras visible para extraer texto frontal de etiquetas y segmentar campos clave.

#### Scenario: Extracción de texto y concentración
- **WHEN** el crop corresponde a la vista frontal de un frasco de suplemento
- **THEN** el motor OCR extrae los bloques alfanuméricos y extrae tokens normalizados correspondientes a nombre de producto, concentración (mg, IU, mcg) y presentación (tabs, caps).
