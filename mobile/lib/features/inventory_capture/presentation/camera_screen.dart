import 'package:flutter/material.dart';
import 'package:inventory_mobile/core/theme/app_theme.dart';
import 'package:inventory_mobile/features/inventory_capture/presentation/widgets/bounding_box_overlay.dart';
import 'package:inventory_mobile/features/exception_review/presentation/exception_review_screen.dart';

class CameraScreen extends StatefulWidget {
  final String locationCode;

  const CameraScreen({super.key, this.locationCode = "LOC-A01-E01-B01"});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  bool _isProcessing = false;
  String? _qualityWarning;
  int _totalCount = 0;
  int _verifiedCount = 0;
  int _pendingReviewCount = 0;

  final List<VisualDetection> _currentDetections = [];

  void _onCapturePressed() async {
    setState(() {
      _isProcessing = true;
      _qualityWarning = null;
    });

    // Simular captura de frame de cámara para demostración
    await Future.delayed(const Duration(milliseconds: 600));

    // Detecciones simuladas de frascos Solgar
    setState(() {
      _isProcessing = false;
      _currentDetections.clear();
      _currentDetections.addAll([
        VisualDetection(
          rect: const Rect.fromLTWH(40, 150, 110, 180),
          label: "Ester-C 500mg",
          confidence: 0.98,
          status: "MATCHED",
        ),
        VisualDetection(
          rect: const Rect.fromLTWH(170, 145, 115, 185),
          label: "Vit D3 400 IU",
          confidence: 0.96,
          status: "MATCHED",
        ),
        VisualDetection(
          rect: const Rect.fromLTWH(300, 150, 110, 180),
          label: "¿B-Complex?",
          confidence: 0.68,
          status: "AMBIGUOUS",
        ),
      ]);

      _totalCount = 3;
      _verifiedCount = 2;
      _pendingReviewCount = 1;
    });
  }

  void _openExceptionsReview() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const ExceptionReviewScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "INNOVATE NUTRITION",
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: InnovateColors.solgarGold),
            ),
            Text(
              "Bandeja: ${widget.locationCode}",
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_off, color: Colors.white70),
            onPressed: () {},
            tooltip: "Flash desactivado por reflejo en tapas",
          ),
          IconButton(
            icon: const Icon(Icons.info_outline, color: Colors.white70),
            onPressed: () {},
          ),
        ],
      ),
      body: Stack(
        children: [
          // 1. Visor de Cámara y Detecciones
          Positioned.fill(
            child: Container(
              color: const Color(0xFF1E293B),
              child: Stack(
                children: [
                  // Imagen de fondo / Preview
                  Center(
                    child: Icon(
                      Icons.camera_alt_outlined,
                      size: 80,
                      color: Colors.white.withOpacity(0.15),
                    ),
                  ),

                  // Overlay de Bounding Boxes de IA
                  Positioned.fill(
                    child: BoundingBoxOverlay(
                      detections: _currentDetections,
                      previewSize: const Size(450, 600),
                    ),
                  ),

                  // Retícula Guía de Repisa
                  Positioned(
                    top: 130,
                    left: 20,
                    right: 20,
                    bottom: 220,
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: InnovateColors.cameraReticle.withOpacity(0.4), width: 1.5),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black54,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              "Alinea los frascos dentro de esta guía",
                              style: TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                          ),
                          Container(),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 2. Banner de Calidad / Advertencia si aplica
          if (_qualityWarning != null)
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: InnovateColors.aiUnknown.withOpacity(0.95),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Colors.white),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _qualityWarning!,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // 3. Panel Superior de Conteo en Vivo
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: InnovateColors.darkNavy.withOpacity(0.90),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _MetricCounter(label: "Detectados", value: "$_totalCount", color: Colors.white),
                  Container(height: 24, width: 1, color: Colors.white24),
                  _MetricCounter(label: "Confirmados", value: "$_verifiedCount", color: InnovateColors.aiMatched),
                  Container(height: 24, width: 1, color: Colors.white24),
                  _MetricCounter(label: "Por Revisar", value: "$_pendingReviewCount", color: InnovateColors.aiReview),
                ],
              ),
            ),
          ),

          // 4. Barra Inferior de Controles y Captura
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              decoration: const BoxDecoration(
                color: Color(0xFF0F172A),
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SafeArea(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Botón para revisar excepciones
                    Stack(
                      children: [
                        IconButton(
                          iconSize: 32,
                          icon: const Icon(Icons.fact_check_outlined, color: Colors.white),
                          onPressed: _pendingReviewCount > 0 ? _openExceptionsReview : null,
                          tooltip: "Revisar Excepciones",
                        ),
                        if (_pendingReviewCount > 0)
                          Positioned(
                            right: 4,
                            top: 4,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: InnovateColors.aiReview,
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                "$_pendingReviewCount",
                                style: const TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                      ],
                    ),

                    // Botón de Disparo Principal
                    GestureDetector(
                      onTap: _isProcessing ? null : _onCapturePressed,
                      child: Container(
                        height: 76,
                        width: 76,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 4),
                          color: _isProcessing ? Colors.grey : InnovateColors.primaryBlue,
                        ),
                        child: Center(
                          child: _isProcessing
                              ? const CircularProgressIndicator(color: Colors.white)
                              : const Icon(Icons.camera_alt, color: Colors.white, size: 36),
                        ),
                      ),
                    ),

                    // Botón Finalizar Bandeja
                    IconButton(
                      iconSize: 32,
                      icon: const Icon(Icons.check_circle_outline, color: InnovateColors.aiMatched),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text("Bandeja guardada con éxito en PostgreSQL 18")),
                        );
                      },
                      tooltip: "Finalizar Bandeja",
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricCounter extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MetricCounter({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.bold),
        ),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 11),
        ),
      ],
    );
  }
}
