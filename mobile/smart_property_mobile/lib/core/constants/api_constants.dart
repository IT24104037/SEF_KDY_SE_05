class ApiConstants {
  ApiConstants._();

  // Android emulator -> host computer.
  // For a physical phone, pass your computer's LAN address with --dart-define.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5144',
  );

  static const String login = '$baseUrl/api/auth/login';
  static const String currentUser = '$baseUrl/api/auth/me';

  static const String maintenanceRequests = '$baseUrl/api/maintenance-requests';

  static const String maintenanceImageUpload =
      '$baseUrl/api/maintenance-images/upload';
}
