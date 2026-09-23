import 'package:flutter/material.dart';
import 'package:inventory_mobile/core/theme/app_theme.dart';

class VisualDetection {
  final Rect rect;
  final String label;
  final double confidence;
  final String status; // 'MATCHED', 'PROBABLE_MATCH', 'AMBIGUOUS', 'UNKNOWN'

  const VisualDetection({
    required this.rect,
    required this.label,
    required this.confidence,
    required this.status,
  });
}

class BoundingBoxOverlay extends StatelessWidget {
  final List<VisualDetection> detections;
  final Size previewSize;

  const BoundingBoxOverlay({
    super.key,
    required this.detections,
    required this.previewSize,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size.infinite,
      painter: _BoundingBoxPainter(detections: detections, previewSize: previewSize),
    );
  }
}

class _BoundingBoxPainter extends CustomPainter {
  final List<VisualDetection> detections;
  final Size previewSize;

  _BoundingBoxPainter({required this.detections, required this.previewSize});

  @override
  void paint(Canvas canvas, Size size) {
    if (previewSize.width == 0 || previewSize.height == 0) return;

    final scaleX = size.width / previewSize.width;
    final scaleY = size.height / previewSize.height;

    for (final det in detections) {
      final scaledRect = Rect.fromLTRB(
        det.rect.left * scaleX,
        det.rect.top * scaleY,
        det.rect.right * scaleX,
        det.rect.bottom * scaleY,
      );

      final color = _getColorForStatus(det.status);

      // Dibujar caja delimitadora con esquinas redondeadas
      final paint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5;

      canvas.drawRRect(
        RRect.fromRectAndRadius(scaledRect, const Radius.circular(8)),
        paint,
      );

      // Dibujar etiqueta con fondo
      final textSpan = TextSpan(
        text: "${det.label} (${(det.confidence * 100).toInt()}%)",
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      );
      final textPainter = TextPainter(
        text: textSpan,
        textDirection: TextDirection.ltr,
      )..layout();

      final labelBackground = Paint()..color = color.withOpacity(0.9);
      final labelRect = Rect.fromLTWH(
        scaledRect.left,
        scaledRect.top - 20 >= 0 ? scaledRect.top - 20 : scaledRect.top,
        textPainter.width + 10,
        18,
      );

      canvas.drawRRect(
        RRect.fromRectAndRadius(labelRect, const Radius.circular(4)),
        labelBackground,
      );
      textPainter.paint(canvas, Offset(labelRect.left + 5, labelRect.top + 2));
    }
  }

  Color _getColorForStatus(String status) {
    switch (status) {
      case "MATCHED":
        return InnovateColors.aiMatched;
      case "PROBABLE_MATCH":
      case "AMBIGUOUS":
        return InnovateColors.aiReview;
      case "UNKNOWN":
      default:
        return InnovateColors.aiUnknown;
    }
  }

  @override
  bool shouldRepaint(covariant _BoundingBoxPainter oldDelegate) => true;
}
