import 'dart:typed_data';
import 'package:image/image.dart' as img;

class QualityInspectionResult {
  final bool isAcceptable;
  final double blurScore;
  final double luminance;
  final String? rejectionReason;

  const QualityInspectionResult({
    required this.isAcceptable,
    required this.blurScore,
    required this.luminance,
    this.rejectionReason,
  });
}

class ImageQualityChecker {
  static const double minBlurThreshold = 95.0;
  static const double minLuminance = 35.0;
  static const double maxLuminance = 225.0;

  /// Analiza los bytes de la imagen directamente en el dispositivo móvil antes del envío
  static Future<QualityInspectionResult> inspectImage(Uint8List imageBytes) async {
    final image = img.decodeImage(imageBytes);
    if (image == null) {
      return const QualityInspectionResult(
        isAcceptable: false,
        blurScore: 0.0,
        luminance: 0.0,
        rejectionReason: "No fue posible decodificar la imagen.",
      );
    }

    // Convertir a escala de grises para análisis rápido
    final grayscale = img.grayscale(image);

    // 1. Cálculo de luminancia promedio
    double totalLum = 0.0;
    int pixelCount = grayscale.width * grayscale.height;

    for (int y = 0; y < grayscale.height; y++) {
      for (int x = 0; x < grayscale.width; x++) {
        final pixel = grayscale.getPixel(x, y);
        totalLum += pixel.r;
      }
    }
    final avgLuminance = totalLum / pixelCount;

    // 2. Cálculo de Varianza del Laplaciano (Detección de Desenfoque)
    final blurScore = _calculateLaplacianVariance(grayscale);

    if (blurScore < minBlurThreshold) {
      return QualityInspectionResult(
        isAcceptable: false,
        blurScore: blurScore,
        luminance: avgLuminance,
        rejectionReason: "La imagen presenta desenfoque. Mantén el teléfono firme y reintenta.",
      );
    }

    if (avgLuminance > maxLuminance) {
      return QualityInspectionResult(
        isAcceptable: false,
        blurScore: blurScore,
        luminance: avgLuminance,
        rejectionReason: "Reflejo excesivo en tapas doradas/frascos. Ajusta el ángulo de luz.",
      );
    }

    if (avgLuminance < minLuminance) {
      return QualityInspectionResult(
        isAcceptable: false,
        blurScore: blurScore,
        luminance: avgLuminance,
        rejectionReason: "Iluminación insuficiente. Acerca el dispositivo o enciende luz externa.",
      );
    }

    return QualityInspectionResult(
      isAcceptable: true,
      blurScore: blurScore,
      luminance: avgLuminance,
    );
  }

  static double _calculateLaplacianVariance(img.Image gray) {
    // Kernel Laplaciano 3x3
    //  0  1  0
    //  1 -4  1
    //  0  1  0
    final laplacianValues = <double>[];
    double sum = 0.0;

    for (int y = 1; y < gray.height - 1; y += 2) { // Muestreo cada 2 px para velocidad en móvil
      for (int x = 1; x < gray.width - 1; x += 2) {
        final center = gray.getPixel(x, y).r;
        final top = gray.getPixel(x, y - 1).r;
        final bottom = gray.getPixel(x, y + 1).r;
        final left = gray.getPixel(x - 1, y).r;
        final right = gray.getPixel(x + 1, y).r;

        final val = (top + bottom + left + right - (4 * center)).toDouble();
        laplacianValues.add(val);
        sum += val;
      }
    }

    if (laplacianValues.isEmpty) return 0.0;

    final mean = sum / laplacianValues.length;
    double varianceSum = 0.0;
    for (final v in laplacianValues) {
      varianceSum += (v - mean) * (v - mean);
    }

    return varianceSum / laplacianValues.length;
  }
}
