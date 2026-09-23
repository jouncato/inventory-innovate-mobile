import 'package:flutter/material.dart';
import 'package:inventory_mobile/core/theme/app_theme.dart';

class ExceptionReviewScreen extends StatefulWidget {
  const ExceptionReviewScreen({super.key});

  @override
  State<ExceptionReviewScreen> createState() => _ExceptionReviewScreenState();
}

class _ExceptionReviewScreenState extends State<ExceptionReviewScreen> {
  // Lista de excepciones pendientes de validación
  final List<Map<String, dynamic>> _pendingExceptions = [
    {
      "id": "obj-001",
      "detected_label": "B-Complex with Vitamin C",
      "confidence": 0.68,
      "reason": "Texto ruidoso en etiqueta frontal por curvatura",
      "ocr_extracted": "B-COMPL... VIT C 100",
      "suggested_sku": "SOL-BCOMP-100",
      "options": [
        "SOL-BCOMP-100: B-Complex with Vitamin C / 100 Tabs",
        "SOL-VITC-1000: Vitamin C 1000 mg with Rose Hips / 100 Tab",
        "SOL-VITB12-500: Vitamin B12 500 mcg / 100 Tabs",
      ],
    }
  ];

  void _resolveException(int index, String action, String sku) {
    setState(() {
      _pendingExceptions.removeAt(index);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Acción registrada: $action para SKU $sku"),
        backgroundColor: InnovateColors.aiMatched,
      ),
    );

    if (_pendingExceptions.isEmpty) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: InnovateColors.background,
      appBar: AppBar(
        title: const Text("Revisión de Excepciones"),
        backgroundColor: InnovateColors.darkNavy,
      ),
      body: _pendingExceptions.isEmpty
          ? const Center(
              child: Text(
                "¡No hay excepciones pendientes!\nTodos los productos están confirmados.",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: InnovateColors.textSecondary),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _pendingExceptions.length,
              itemBuilder: (context, index) {
                final item = _pendingExceptions[index];
                String selectedSku = item["suggested_sku"];

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: InnovateColors.border),
                  ),
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Encabezado de la tarjeta con badge de advertencia
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: InnovateColors.aiReview.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.help_outline, size: 16, color: InnovateColors.aiReview),
                                  const SizedBox(width: 4),
                                  Text(
                                    "Ambigüedad (${(item["confidence"] * 100).toInt()}%)",
                                    style: const TextStyle(
                                      color: InnovateColors.aiReview,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              "ID: ${item["id"]}",
                              style: const TextStyle(color: InnovateColors.textSecondary, fontSize: 12),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Área del recorte del frasco
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 80,
                              height: 100,
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E2564).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: InnovateColors.solgarGold),
                              ),
                              child: const Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.inventory_2_outlined, color: InnovateColors.solgarGold, size: 36),
                                  SizedBox(height: 4),
                                  Text("Crop Frasco", style: TextStyle(fontSize: 10, color: InnovateColors.solgarGold)),
                                ],
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item["detected_label"],
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: InnovateColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    "OCR detectó: \"${item["ocr_extracted"]}\"",
                                    style: const TextStyle(fontSize: 13, color: InnovateColors.textSecondary),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    "Motivo: ${item["reason"]}",
                                    style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: InnovateColors.earthBrown),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Selección / Corrección de SKU
                        const Text(
                          "Selecciona la referencia correcta:",
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: InnovateColors.textPrimary),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            border: Border.all(color: InnovateColors.border),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              isExpanded: true,
                              value: item["options"][0],
                              items: (item["options"] as List<String>).map((opt) {
                                return DropdownMenuItem<String>(
                                  value: opt,
                                  child: Text(opt, style: const TextStyle(fontSize: 13)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  selectedSku = val.split(":")[0];
                                }
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Botones de acción Human-in-the-loop
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: InnovateColors.aiUnknown,
                                  side: const BorderSide(color: InnovateColors.aiUnknown),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: () => _resolveException(index, "FALSO_POSITIVO", selectedSku),
                                child: const Text("Descartar"),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              flex: 2,
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: InnovateColors.primaryBlue,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: () => _resolveException(index, "CONFIRMADO", selectedSku),
                                child: const Text("Confirmar SKU"),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
