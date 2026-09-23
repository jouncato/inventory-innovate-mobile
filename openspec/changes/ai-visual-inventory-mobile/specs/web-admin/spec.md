## ADDED Requirements

### Requirement: Real-time Session Monitoring Dashboard
La consola web administrativa SHALL permitir a los supervisores visualizar en tiempo real el progreso de las sesiones de inventario activas en bodega, incluyendo fotografías capturadas, porcentaje de avance y tasa de resolución automática.

#### Scenario: Visualización de sesión en progreso
- **WHEN** un supervisor accede a la vista de una sesión de inventario activa
- **THEN** la consola web recibe actualizaciones vía WebSockets y muestra las miniaturas de capturas, conteo neto y tasa de excepciones.

### Requirement: Discrepancy Reconciliation Interface
La consola web SHALL proporcionar una interfaz especializada para la resolución ágil de discrepancias y excepciones entre el inventario físico detectado y el inventario teórico del sistema ERP/WMS.

#### Scenario: Aprobación de ajuste de inventario
- **WHEN** un supervisor revisa una discrepancia en un SKU específico
- **THEN** la consola presenta la evidencia fotográfica ampliada, las señales de los modelos participantes y permite aprobar o ajustar el conteo final con justificación obligatoria.

### Requirement: Forensic Audit Trail Viewer
La consola web SHALL permitir auditar cualquier registro de conteo hasta su origen exacto, mostrando la fotografía de captura original, el recorte del frasco, el log de inferencia del modelo (nombre, versión, latencia, score) y el registro de intervención humana si existió.

#### Scenario: Inspección forense de un conteo
- **WHEN** un auditor selecciona un ítem inventariado en la tabla de resultados finales
- **THEN** la consola despliega el linaje completo de auditoría enlazado con la evidencia almacenada en MinIO/S3.
