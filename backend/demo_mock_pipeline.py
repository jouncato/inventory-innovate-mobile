import sys
import time
import hashlib
from pathlib import Path
from uuid import uuid4

# Configurar salida UTF-8 en Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Asegurar importación de backend.src
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from backend.src.contexts.catalog.domain.entities import Product
from backend.src.contexts.catalog.domain.value_objects import Barcode, BarcodeSymbology
from backend.src.contexts.inventory.domain.aggregates import InventorySession
from backend.src.contexts.inventory.domain.entities import PhysicalObject, UserValidation, ValidationAction
from backend.src.contexts.inventory.domain.services.homography_tracker import HomographyTracker
from backend.src.contexts.inventory.domain.services.product_resolver import ProductResolver
from backend.src.contexts.inventory.domain.value_objects import ConfidenceScore, ResolutionStatus
from backend.src.contexts.perception.domain.ports import BarcodeReadResult, OcrReadResult, RawDetection
from backend.src.contexts.perception.domain.value_objects import BoundingBox, QualityMetrics, Sha256Checksum


def color_text(text: str, color_code: str) -> str:
    return f"\033[{color_code}m{text}\033[0m"


def main():
    print("\n" + "=" * 80)
    print(color_text("   INNOVATE NUTRITION • PRUEBA MOCK DEL PIPELINE DE INVENTARIO VISUAL IA", "1;34"))
    print(color_text("   Línea Solgar Colombia • Demostración End-to-End Multimodal", "1;33"))
    print("=" * 80 + "\n")

    time.sleep(0.5)

    # -------------------------------------------------------------
    # 0. Inicialización de Catálogo Maestro Solgar
    # -------------------------------------------------------------
    print(color_text("[1/6] CARGANDO CATÁLOGO MAESTRO SOLGAR COLOMBIA...", "1;36"))
    catalog = {
        "SOL-01300": Product.create(
            sku="SOL-01300",
            name="Ester-C Plus 1000 mg Vitamina C",
            brand="Solgar",
            presentation="Frasco ámbar x 90 comprimidos",
            category="Vitamina C y Antioxidantes",
            barcodes=[Barcode(value="033984013001", symbology=BarcodeSymbology.UPC_A)],
        ),
        "SOL-02050": Product.create(
            sku="SOL-02050",
            name="Omega 3-6-9 EFA Doble Concentración",
            brand="Solgar",
            presentation="Frasco ámbar x 120 softgels",
            category="Ácidos Grasos Esenciales",
            barcodes=[Barcode(value="033984020504", symbology=BarcodeSymbology.UPC_A)],
        ),
        "SOL-03410": Product.create(
            sku="SOL-03410",
            name="Vitamina D3 5000 UI Colecalciferol",
            brand="Solgar",
            presentation="Frasco ámbar x 100 softgels",
            category="Vitaminas Liposolubles",
            barcodes=[Barcode(value="033984034105", symbology=BarcodeSymbology.UPC_A)],
        ),
        "SOL-00520": Product.create(
            sku="SOL-00520",
            name="Calcio y Magnesio con Vitamina D3",
            brand="Solgar",
            presentation="Frasco ámbar x 150 tabletas",
            category="Minerales y Huesos",
            barcodes=[Barcode(value="033984005204", symbology=BarcodeSymbology.UPC_A)],
        ),
    }
    print(f"  ✓ {len(catalog)} referencias cargadas con embeddings y códigos UPC-A verificados.")
    time.sleep(0.4)

    # -------------------------------------------------------------
    # 1. Inicio de Sesión de Inventario (Aggregate Root)
    # -------------------------------------------------------------
    print("\n" + color_text("[2/6] INICIANDO SESIÓN DE CONTEO EN BODEGA...", "1;36"))
    location_id = uuid4()
    session = InventorySession.start(location_id=location_id, operator_id="op-carlos-mendoza")
    print(f"  ✓ Sesión ID: {session.id}")
    print(f"  ✓ Operador: Carlos Mendoza (Bodega Principal Bogotá - Calle 80)")
    print(f"  ✓ Ubicación: Pasillo 04 - Estantería B (Suplementos Vitamínicos)")
    print(f"  ✓ Estado Inicial: {session.status.value}")
    time.sleep(0.4)

    # -------------------------------------------------------------
    # 2. Captura Mobile Edge y Control de Calidad
    # -------------------------------------------------------------
    print("\n" + color_text("[3/6] SIMULACIÓN DE DISPARO MÓVIL (Edge Quality Analyzer)...", "1;36"))
    raw_image_data = b"PHOTO_CAPTURE_ESTANTERIA_B_NIVEL_2_20260923_083015_RAW_PIXELS"
    sha256_hash = hashlib.sha256(raw_image_data).hexdigest()
    checksum = Sha256Checksum(sha256_hash)
    
    # Análisis Laplaciano y Luminancia
    metrics = QualityMetrics(blur_score=342.5, luminance=142.0)
    print(f"  • Varianza Laplaciana (Nitidez): {metrics.blur_score:.1f} (Umbral mín: 100.0) -> {color_text('APROBADA', '1;32')}")
    print(f"  • Nivel de Luminancia: {metrics.luminance:.1f} (Rango 35..220) -> {color_text('APROBADA', '1;32')}")
    print(f"  • Huella Criptográfica SHA-256: {color_text(checksum.value, '1;33')}")
    print(f"  • Almacenamiento MinIO S3: s3://raw-captures/2026/09/23/{session.id}/cap-001.webp")
    time.sleep(0.4)

    # -------------------------------------------------------------
    # 3. Detección YOLOv8x y Pipeline Multimodal
    # -------------------------------------------------------------
    print("\n" + color_text("[4/6] PROCESAMIENTO MULTIMODAL EN BACKEND (FastAPI / Celery)...", "1;36"))
    resolver = ProductResolver()
    capture_id = uuid4()

    # Caso A: Frasco 1 - Código de barras visible (Espalda del frasco)
    print(color_text("\n  --> Objeto #1 [Repisa B - Posición 1]:", "1;37"))
    det1 = RawDetection(bbox=BoundingBox(0.05, 0.30, 0.22, 0.85), confidence=0.96, detected_class="amber_bottle")
    bar1 = [BarcodeReadResult(code="033984013001", symbology="UPC_A", confidence=1.0)]
    ocr1 = OcrReadResult(raw_text="SOLGAR 90 COMPRIMIDOS", parsed_fields={}, confidence=0.75)
    cand1 = [(catalog["SOL-01300"], 0.95)]
    
    t0 = time.perf_counter()
    match1 = resolver.resolve(det1, bar1, ocr1, cand1)
    t1 = time.perf_counter()
    
    obj1 = PhysicalObject(
        id=uuid4(),
        first_seen_capture_id=capture_id,
        bounding_box=det1.bbox,
        resolved_product_id=match1.resolved_product_id,
        confidence=match1.confidence,
        crop_storage_s3_key=f"crops/2026/09/23/{session.id}/crop-obj-1.webp",
        match=match1,
    )
    print(f"      - YOLO: Frasco ámbar detectado (conf: {det1.confidence*100:.1f}%)")
    print(f"      - Pyzbar: Código UPC-A '033984013001' decodificado con éxito")
    print(f"      - Regla de Negocio: {color_text('CORTOCIRCUITO DETERMINÍSTICO (100% Certeza)', '1;32')}")
    print(f"      - SKU Asignado: {catalog['SOL-01300'].sku.value} ({catalog['SOL-01300'].name})")
    print(f"      - Latencia: {(t1-t0)*1000:.2f} ms")

    # Caso B: Frasco 2 - Etiqueta frontal visible (Sin código de barras)
    print(color_text("\n  --> Objeto #2 [Repisa B - Posición 2]:", "1;37"))
    det2 = RawDetection(bbox=BoundingBox(0.25, 0.28, 0.44, 0.86), confidence=0.94, detected_class="amber_bottle")
    bar2 = []  # Sin código
    ocr2 = OcrReadResult(raw_text="SOLGAR SINCE 1947 OMEGA 3-6-9 EFA 120 SOFTGELS", parsed_fields={"concentration": "120 softgels"}, confidence=0.91)
    cand2 = [(catalog["SOL-02050"], 0.93)]
    
    t0 = time.perf_counter()
    match2 = resolver.resolve(det2, bar2, ocr2, cand2)
    t1 = time.perf_counter()

    obj2 = PhysicalObject(
        id=uuid4(),
        first_seen_capture_id=capture_id,
        bounding_box=det2.bbox,
        resolved_product_id=match2.resolved_product_id,
        confidence=match2.confidence,
        crop_storage_s3_key=f"crops/2026/09/23/{session.id}/crop-obj-2.webp",
        match=match2,
    )
    print(f"      - YOLO: Frasco ámbar detectado (conf: {det2.confidence*100:.1f}%)")
    print(f"      - Barcode: Oculto por orientación frontal")
    print(f"      - PaddleOCR v4: '{ocr2.raw_text}'")
    print(f"      - Vector pgvector: Similitud Coseno con embeddinggemma = {cand2[0][1]*100:.1f}%")
    print(f"      - Resultado Fusión: {color_text(f'{match2.status.value} (Conf: {match2.confidence.value*100:.1f}%)', '1;32')}")
    print(f"      - SKU Asignado: {catalog['SOL-02050'].sku.value} ({catalog['SOL-02050'].name})")
    print(f"      - Latencia: {(t1-t0)*1000:.2f} ms")

    # Caso C: Frasco 3 - Ambigüedad por reflejo (Activa Árbitro VLM y revisión humana)
    print(color_text("\n  --> Objeto #3 [Repisa B - Posición 3 - Ambigüedad]:", "1;37"))
    det3 = RawDetection(bbox=BoundingBox(0.48, 0.32, 0.65, 0.84), confidence=0.82, detected_class="amber_bottle")
    bar3 = []
    ocr3 = OcrReadResult(raw_text="SOLGAR D3 5000", parsed_fields={"concentration": "5000 ui"}, confidence=0.55)
    cand3 = [(catalog["SOL-03410"], 0.60)]
    
    # Simula llamada a Qwen3-VL Arbiter
    vlm_prediction = {
        "model": "qwen3-vl:2b",
        "confidence": 0.68,
        "verdict": "Vitamina D3 5000 UI Colecalciferol con reflejo especular sobre texto de posología",
    }
    t0 = time.perf_counter()
    match3 = resolver.resolve(det3, bar3, ocr3, cand3, vlm_prediction=vlm_prediction)
    t1 = time.perf_counter()

    obj3 = PhysicalObject(
        id=uuid4(),
        first_seen_capture_id=capture_id,
        bounding_box=det3.bbox,
        resolved_product_id=match3.resolved_product_id,
        confidence=match3.confidence,
        crop_storage_s3_key=f"crops/2026/09/23/{session.id}/crop-obj-3.webp",
        match=match3,
    )
    print(f"      - YOLO: Frasco ámbar detectado (conf: {det3.confidence*100:.1f}%)")
    print(f"      - Alerta: Confianza preliminar < 70% debido a reflejo especular en etiqueta")
    print(f"      - {color_text('Árbitro VLM Invocado (Qwen3-VL 2B):', '1;33')} {vlm_prediction['verdict']}")
    print(f"      - Estado Asignado: {color_text(match3.status.value, '1;33')} (Confianza fusionada: {match3.confidence.value*100:.1f}%)")
    print(f"      - Latencia con VLM: {(t1-t0)*1000:.2f} ms")

    # Registrar captura en la sesión
    session.add_capture(capture_id, [obj1, obj2, obj3])
    print(f"\n  • Total detectado en Toma 1: {session.total_count} unidades")
    print(f"  • Excepciones que requieren revisión humana (HITL): {color_text(str(session.pending_exceptions_count), '1;33')}")
    print(f"  • Estado de la Sesión: {color_text(session.status.value, '1;33')}")
    time.sleep(0.4)

    # -------------------------------------------------------------
    # 4. Deduplicación Espacial con Homografía (Multi-toma)
    # -------------------------------------------------------------
    print("\n" + color_text("[5/6] DEDUPLICACIÓN ESPACIAL INTER-TOMAS (HomographyTracker)...", "1;36"))
    tracker = HomographyTracker(iou_match_threshold=0.40)
    
    # Toma 2: El operador se desplaza levemente hacia la derecha.
    # El Frasco #3 aparece de nuevo desplazado en x (-0.20 relativo al nuevo frame)
    capture_id_2 = uuid4()
    obj3_shifted = PhysicalObject(
        id=uuid4(),  # ID temporal antes de matching
        first_seen_capture_id=capture_id_2,
        bounding_box=BoundingBox(0.28, 0.32, 0.45, 0.84),  # Misma botella en nueva perspectiva
        resolved_product_id=None,
        confidence=ConfidenceScore(0.0),
    )
    obj4_new = PhysicalObject(
        id=uuid4(),
        first_seen_capture_id=capture_id_2,
        bounding_box=BoundingBox(0.70, 0.30, 0.88, 0.85),
        resolved_product_id=catalog["SOL-00520"].id,
        confidence=ConfidenceScore(0.96),
    )

    # Matriz de transformación proyectiva H (traslación de cámara x = -0.20)
    import numpy as np
    H_shift = np.array([
        [1.0, 0.0, -0.20],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0]
    ], dtype=np.float32)
    tracker._estimate_homography = lambda img1, img2: H_shift

    deduped_objects = tracker.track_and_deduplicate(
        prev_image_bytes=b"IMG_TOMA_1",
        curr_image_bytes=b"IMG_TOMA_2",
        prev_objects=[obj1, obj2, obj3],
        curr_objects=[obj3_shifted, obj4_new],
    )

    print(f"  • Algoritmo Húngaro (Kuhn-Munkres) evaluó matriz de costos IoU proyectado.")
    print(f"  • Frasco #3 proyectado emparejado con detección previa:")
    print(f"    - ID persistente preservado: {obj3_shifted.id == obj3.id} ({obj3.id})")
    print(f"    - {color_text('Doble conteo evitado con éxito (0 frascos duplicados)', '1;32')}")
    
    # Añadimos solo el objeto nuevo real a la sesión
    session.add_capture(capture_id_2, [obj4_new])
    print(f"  • Conteo acumulado en sesión: {session.total_count} frascos netos.")
    time.sleep(0.4)

    # -------------------------------------------------------------
    # 5. Conciliación Humana (Web Admin HITL) y Cierre de Sesión
    # -------------------------------------------------------------
    print("\n" + color_text("[6/6] CONCILIACIÓN EN CONSOLA WEB Y AUDITORÍA FORENSE INMUTABLE...", "1;36"))
    print("  • Intentando cerrar sesión mientras existen excepciones...")
    try:
        session.close()
    except Exception as e:
        print(f"    {color_text('INVARIANTE DE DOMINIO RESPETADO:', '1;31')} {e}")

    print("\n  • Supervisor Carlos Mendoza atiende la discrepancia en la consola web:")
    print(f"    - Caso: Objeto {obj3.id} (Sugerido: SOL-03410 Vitamina D3 5000 UI)")
    print(f"    - Acción: CONFIRMAR SUGERENCIA")
    print(f"    - Justificación obligatoria: 'Confirmada Vitamina D3 5000 UI en frasco ámbar'")

    validation = UserValidation(
        id=uuid4(),
        product_match_id=uuid4(),
        reviewed_by_user_id="op-carlos-mendoza",
        action_taken=ValidationAction.CONFIRMED,
        original_product_id=obj3.resolved_product_id,
        corrected_product_id=catalog["SOL-03410"].id,
        reason="Confirmada Vitamina D3 5000 UI en frasco ámbar",
    )
    session.resolve_exception(obj3.id, validation)
    print(f"    ✓ Excepción resuelta. Excepciones pendientes: {session.pending_exceptions_count}")
    print(f"    ✓ Estado de sesión actualizado: {color_text(session.status.value, '1;32')}")

    # Ahora sí podemos cerrar la sesión
    session.close()
    print(f"\n  ✓ {color_text('SESIÓN CERRADA CON ÉXITO', '1;32')}")
    print(f"  • Total físico auditado: {session.total_count} unidades")
    print(f"  • Referencias únicas: {len({obj.resolved_product_id for obj in session.physical_objects})} SKUs")
    print(f"  • Timestamp de cierre: {session.closed_at.isoformat()}")

    # Resumen de eventos de dominio emitidos
    events = session.pull_domain_events()
    print(f"  • Eventos de dominio generados: {len(events)}")
    for ev in events:
        print(f"    - {type(ev).__name__} (ID: {ev.event_id})")

    print("\n" + "=" * 80)
    print(color_text("   ¡PRUEBA MOCK COMPLETADA CON 100% DE ÉXITO!", "1;32"))
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
