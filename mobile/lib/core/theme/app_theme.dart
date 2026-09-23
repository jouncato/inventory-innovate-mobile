import 'package:flutter/material.dart';

class InnovateColors {
  // Paleta Oficial Innovate Nutrition (Extraída de la landing institucional)
  static const Color primaryBlue = Color(0xFF33499C);      // Azul Corporativo
  static const Color primaryBlueLight = Color(0xFF374EA2); // Títulos y acentos
  static const Color darkNavy = Color(0xFF1B2559);         // Azul Marino Profundo (AppBar/Splash)
  static const Color solgarGold = Color(0xFF86754D);       // Oro Solgar (Badges/Acentos)
  static const Color earthBrown = Color(0xFF58311F);       // Marrón Tierra Cálido

  // Superficies y Neutros
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE2E8F0);
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);

  // Estados de IA para Inventario
  static const Color aiMatched = Color(0xFF10B981);        // Verde esmeralda (Confirmado)
  static const Color aiReview = Color(0xFFF59E0B);         // Ámbar cálido (Requiere revisión)
  static const Color aiUnknown = Color(0xFFEF4444);        // Rojo coral (Desconocido/Alerta)
  static const Color cameraReticle = Color(0xFF38BDF8);    // Azul cielo (Guía de encuadre)
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: InnovateColors.primaryBlue,
        primary: InnovateColors.primaryBlue,
        secondary: InnovateColors.solgarGold,
        surface: InnovateColors.surface,
      ),
      scaffoldBackgroundColor: InnovateColors.background,
      appBarTheme: const AppBarTheme(
        backgroundColor: InnovateColors.darkNavy,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
          color: Colors.white,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: InnovateColors.primaryBlue,
          foregroundColor: Colors.white,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }
}
