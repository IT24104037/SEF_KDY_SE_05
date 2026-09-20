class ApiConstants {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5144',
  );

  static const String maintenanceRequests =
      '$baseUrl/api/maintenance-requests';

  static const String maintenanceImageUpload =
      '$baseUrl/api/maintenance-images/upload';
}