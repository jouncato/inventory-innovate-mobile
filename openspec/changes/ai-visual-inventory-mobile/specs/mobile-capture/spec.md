## ADDED Requirements

### Requirement: Pre-flight Image Quality Validation
La aplicación móvil Flutter SHALL analizar cada fotografía en el dispositivo móvil antes de encolarla para procesamiento remoto, evaluando desenfoque por varianza Laplaciana y niveles de saturación/exposición.

#### Scenario: Imagen con desenfoque excesivo
- **WHEN** el operador captura una fotografía cuyo cálculo de varianza Laplaciana es inferior a 100.0
- **THEN** la aplicación móvil MUST rechazar la captura inmediatamente en menos de 150 ms y mostrar una notificación visual indicando: "La imagen presenta desenfoque. Mantén el teléfono firme y vuelve a tomarla."

#### Scenario: Imagen con iluminación deficiente o reflejo especular
- **WHEN** el histograma de luminancia en escala de grises presenta más del 40% de píxeles en valores extremos (< 30 o > 230)
- **THEN** la aplicación móvil MUST alertar sobre sobreexposición/reflejos dorados e impedir el envío al backend.

### Requirement: Local Location Barcode Scanning
La aplicación móvil SHALL permitir escanear códigos de barras o QR de ubicación (bodega, estante o bandeja) en tiempo real mediante la cámara antes de iniciar la captura de productos.

#### Scenario: Escaneo de código de bandeja
- **WHEN** la cámara enfoca el código QR o de barras de una bandeja de almacenamiento
- **THEN** la aplicación decodifica localmente el identificador de ubicación y lo asocia automáticamente a la sesión de inventario activa.

### Requirement: Offline Storage and Idempotent Sync
La aplicación móvil SHALL almacenar localmente las capturas y metadatos en una base de datos SQLite (Drift) cuando no haya conectividad a la red local, y sincronizarlas de forma idempotente al restablecerse la conexión.

#### Scenario: Captura sin conexión a red
- **WHEN** el dispositivo móvil se encuentra sin conexión Wi-Fi/red al momento de disparar la fotografía válida
- **THEN** la aplicación almacena la imagen comprimida y sus metadatos con estado PENDING_UPLOAD y un capture_uuid único (UUIDv7).

#### Scenario: Sincronización idempotente con reconexión
- **WHEN** el dispositivo recupera la conexión a la red local del backend
- **THEN** el gestor de sincronización envía las capturas pendientes enviando el header X-Idempotency-Key con el capture_uuid, garantizando que reintentos de red no dupliquen procesamiento.

### Requirement: Real-time Visual Detection Feedback
La aplicación móvil SHALL proyectar sobre la fotografía capturada los bounding boxes y clasificaciones recibidas desde el backend a través de WebSockets.

#### Scenario: Visualización de resultados procesados
- **WHEN** el backend emite el evento de procesamiento completado para una captura
- **THEN** la interfaz móvil dibuja recuadros verdes sobre los productos resueltos con alta confianza y recuadros ámbar sobre las excepciones pendientes de confirmación.
