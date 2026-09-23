## ADDED Requirements

### Requirement: Homography Estimation and Inter-Photo Overlap Detection
El sistema SHALL calcular la matriz de homografía proyectiva entre pares de fotografías consecutivas de una misma sesión mediante extracción y emparejamiento de características visuales (ORB / LightGlue / SIFT).

#### Scenario: Detección de solape entre tomas contiguas
- **WHEN** un operador toma dos fotografías consecutivas con desplazamiento horizontal sobre una misma repisa
- **THEN** el sistema estima la transformación proyectiva H y determina el polígono de intersección espacial entre ambas fotos.

### Requirement: Spatial Box Projection and Hungarian Matching
El motor de deduplicación SHALL proyectar las cajas delimitadoras de la fotografía previa hacia el plano de la nueva fotografía y resolver el problema de asignación lineal (Algoritmo Húngaro / Kuhn-Munkres).

#### Scenario: Deduplicación de frascos solapados
- **WHEN** un frasco detectado en la foto t+1 coincide espacialmente (IoU proyectado ≥ 0.50) y en similitud visual con un frasco ya registrado en la foto t
- **THEN** el sistema asigna el mismo identificador de objeto físico global y NO incrementa el conteo de unidades físicas en el inventario.

#### Scenario: Identificación de nuevos frascos ingresados al campo visual
- **WHEN** un frasco detectado en la foto t+1 no tiene emparejamiento con el histórico de la sesión
- **THEN** el sistema genera un nuevo identificador físico global e incrementa el conteo neto de la sesión.
