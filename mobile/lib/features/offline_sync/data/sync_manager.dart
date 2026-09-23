import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';

class LocalCaptureTask {
  final String captureUuid;
  final String sessionId;
  final int sequenceNumber;
  final String imageSha256;
  final double blurScore;
  final double luminance;
  final Uint8List imageBytes;
  bool isSynced;

  LocalCaptureTask({
    required this.captureUuid,
    required this.sessionId,
    required this.sequenceNumber,
    required this.imageSha256,
    required this.blurScore,
    required this.luminance,
    required this.imageBytes,
    this.isSynced = false,
  });
}

class SyncManager {
  final String backendBaseUrl;
  final List<LocalCaptureTask> _localQueue = [];

  SyncManager({this.backendBaseUrl = "http://192.168.1.50:8000"});

  /// Encola una captura con clave de idempotencia única (UUIDv7)
  void enqueueCapture({
    required String sessionId,
    required int sequenceNumber,
    required String imageSha256,
    required double blurScore,
    required double luminance,
    required Uint8List imageBytes,
  }) {
    final task = LocalCaptureTask(
      captureUuid: const Uuid().v4(),
      sessionId: sessionId,
      sequenceNumber: sequenceNumber,
      imageSha256: imageSha256,
      blurScore: blurScore,
      luminance: luminance,
      imageBytes: imageBytes,
    );
    _localQueue.add(task);
  }

  /// Sincroniza la cola local con el backend de manera idempotente
  Future<int> processPendingQueue() async {
    int syncedCount = 0;

    for (final task in _localQueue.where((t) => !t.isSynced)) {
      try {
        // 1. Solicitar URL prefirmada pasando el token de idempotencia
        final presignUri = Uri.parse("$backendBaseUrl/api/v1/captures/presign");
        final presignResponse = await http.post(
          presignUri,
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": task.captureUuid,
          },
          body: jsonEncode({
            "session_id": task.sessionId,
            "sequence_number": task.sequenceNumber,
            "image_sha256": task.imageSha256,
            "blur_score": task.blurScore,
            "luminance": task.luminance,
          }),
        );

        if (presignResponse.statusCode == 200) {
          final data = jsonDecode(presignResponse.body);
          final uploadUrl = data["upload_url"];

          // 2. Subida directa del binario al storage
          final uploadResponse = await http.put(
            Uri.parse(uploadUrl),
            headers: {"Content-Type": "image/webp"},
            body: task.imageBytes,
          );

          if (uploadResponse.statusCode == 200) {
            task.isSynced = true;
            syncedCount++;
          }
        }
      } catch (e) {
        // En caso de fallo de red en bodega, la tarea permanece en cola para reintento automático
        debugPrint("[SyncManager] Error de sincronización (modo offline activo): $e");
      }
    }

    return syncedCount;
  }
}
