import 'package:flutter/material.dart';
import 'package:inventory_mobile/core/theme/app_theme.dart';
import 'package:inventory_mobile/features/inventory_capture/presentation/camera_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const InnovateInventoryApp());
}

class InnovateInventoryApp extends StatelessWidget {
  const InnovateInventoryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Innovate Nutrition Inventory',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const CameraScreen(locationCode: "LOC-A01-E01-B01"),
    );
  }
}
