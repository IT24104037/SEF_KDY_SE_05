import 'package:flutter/material.dart';

abstract final class AppColors {
  // Shared web/mobile palette.
  static const Color background = Color(0xFFF3F5F6);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color darkNavigation = Color(0xFF202B33);

  static const Color heading = Color(0xFF172033);
  static const Color text = Color(0xFF1F2933);
  static const Color secondaryText = Color(0xFF64748B);
  static const Color border = Color(0xFFE2E7E9);
  static const Color inputBorder = Color(0xFFCBD5E1);

  static const Color adminAccent = Color(0xFF5145CD);
  static const Color ownerAccent = Color(0xFF0F766E);
  static const Color tenantAccent = Color(0xFF0369A1);
  static const Color workerAccent = Color(0xFFB45309);

  static const Color success = Color(0xFF166534);
  static const Color successBackground = Color(0xFFF0FDF4);
  static const Color successBorder = Color(0xFFBBF7D0);

  static const Color error = Color(0xFF991B1B);
  static const Color errorBackground = Color(0xFFFEF2F2);
  static const Color errorBorder = Color(0xFFFECACA);

  static Color accentForRole(String? role) {
    switch (role) {
      case 'Admin':
        return adminAccent;
      case 'PropertyOwner':
        return ownerAccent;
      case 'Tenant':
        return tenantAccent;
      case 'MaintenanceWorker':
        return workerAccent;
      default:
        return ownerAccent;
    }
  }
}
