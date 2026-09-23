import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inventory_mobile/main.dart';
import 'package:inventory_mobile/features/inventory_capture/presentation/widgets/bounding_box_overlay.dart';
import 'package:inventory_mobile/features/exception_review/presentation/exception_review_screen.dart';

void main() {
  testWidgets('Innovate Inventory Mobile - Flujo Completo de Captura Mock y Revisión HITL',
      (WidgetTester tester) async {
    // 1. Iniciar la aplicación
    await tester.pumpWidget(const InnovateInventoryApp());
    await tester.pumpAndSettle();

    // 2. Verificar estado inicial
    expect(find.text('INNOVATE NUTRITION'), findsOneWidget);
    expect(find.text('Bandeja: LOC-A01-E01-B01'), findsOneWidget);
    expect(find.text('0'), findsNWidgets(3)); // 0 Detectados, 0 Confirmados, 0 Por Revisar
    expect(find.text('Alinea los frascos dentro de esta guía'), findsOneWidget);

    // 3. Simular disparo de cámara (botón de captura)
    final captureButtonFinder = find.byIcon(Icons.camera_alt);
    expect(captureButtonFinder, findsOneWidget);
    await tester.tap(captureButtonFinder);

    // 4. Procesar el delay simulado de 600ms
    await tester.pump(const Duration(milliseconds: 300));
    // Durante procesamiento aparece el spinner
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 400));
    await tester.pumpAndSettle();

    // 5. Verificar métricas actualizadas tras detección de IA
    expect(find.text('3'), findsOneWidget); // Total detectados: 3
    expect(find.text('2'), findsOneWidget); // Confirmados: 2
    expect(find.text('1'), findsNWidgets(2)); // Por revisar: 1 (en contador y en badge flotante)

    // 6. Verificar el overlay de bounding boxes pintado en pantalla
    final overlayFinder = find.byType(BoundingBoxOverlay);
    expect(overlayFinder, findsOneWidget);
    final overlayWidget = tester.widget<BoundingBoxOverlay>(overlayFinder);
    expect(overlayWidget.detections.length, 3);
    expect(overlayWidget.detections[0].label, 'Ester-C 500mg');
    expect(overlayWidget.detections[0].status, 'MATCHED');
    expect(overlayWidget.detections[1].label, 'Vit D3 400 IU');
    expect(overlayWidget.detections[1].status, 'MATCHED');
    expect(overlayWidget.detections[2].label, '¿B-Complex?');
    expect(overlayWidget.detections[2].status, 'AMBIGUOUS');

    // 7. Navegar a la pantalla de revisión de excepciones
    final reviewExceptionsFinder = find.byTooltip('Revisar Excepciones');
    expect(reviewExceptionsFinder, findsOneWidget);
    await tester.tap(reviewExceptionsFinder);
    await tester.pumpAndSettle();

    // 8. Verificar pantalla de revisión de excepciones
    expect(find.byType(ExceptionReviewScreen), findsOneWidget);
    expect(find.text('Revisión de Excepciones'), findsOneWidget);
    expect(find.text('B-Complex with Vitamin C'), findsOneWidget);
    expect(find.text('OCR detectó: "B-COMPL... VIT C 100"'), findsOneWidget);
    expect(find.text('Confirmar SKU'), findsOneWidget);
    expect(find.text('Descartar'), findsOneWidget);

    // 9. Confirmar la excepción como operador humano (HITL)
    await tester.tap(find.text('Confirmar SKU'));
    await tester.pumpAndSettle();

    // 10. Verificar retorno automático al visor de cámara tras resolver todas las excepciones
    expect(find.byType(ExceptionReviewScreen), findsNothing);
    expect(find.text('Bandeja: LOC-A01-E01-B01'), findsOneWidget);
  });
}
