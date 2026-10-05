import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage_service.dart';

class WorkerService {
  WorkerService._();

  static final WorkerService instance = WorkerService._();

  final ApiClient _api = ApiClient.instance;

  final SecureStorageService _storage = SecureStorageService.instance;

  Future<String> _getToken() async {
    final session = await _storage.readSession();

    if (session == null) {
      throw const ApiException(
        'Your session has expired. Please log in again.',
      );
    }

    if (session.role != 'MaintenanceWorker') {
      throw const ApiException(
        'This feature is only available to maintenance workers.',
      );
    }

    return session.token;
  }

  Future<Map<String, dynamic>> getMyProfile() async {
    final token = await _getToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/workers/me',
      token: token,
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> updateMyProfile({
    String? bio,
    double? hourlyRate,
    required bool isAvailable,
    String? serviceArea,
    List<String>? skills,
  }) async {
    final token = await _getToken();

    final data = await _api.putJson(
      '${ApiConstants.baseUrl}/api/workers/me',
      token: token,
      body: {
        'bio': bio,
        'hourlyRate': hourlyRate,
        'isAvailable': isAvailable,
        'serviceArea': serviceArea,
        'skills': ?skills,
      },
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> getAvailability() async {
    final token = await _getToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/workers/me/availability',
      token: token,
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> updateAvailability(
    List<Map<String, dynamic>> slots,
  ) async {
    final token = await _getToken();

    final data = await _api.putJson(
      '${ApiConstants.baseUrl}/api/workers/me/availability',
      token: token,
      body: {'slots': slots},
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<List<Map<String, dynamic>>> getWorkOrders({String? status}) async {
    final token = await _getToken();

    final uri = Uri.parse('${ApiConstants.baseUrl}/api/work-orders').replace(
      queryParameters: {
        if (status != null && status.isNotEmpty) 'status': status,
        'page': '1',
        'pageSize': '50',
      },
    );

    final data = await _api.getJson(uri.toString(), token: token);

    if (data is! Map) {
      return [];
    }

    final raw = data['workOrders'];

    if (raw is! List) {
      return [];
    }

    return raw
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Future<Map<String, dynamic>> getWorkOrder(int id) async {
    final token = await _getToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/work-orders/$id',
      token: token,
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> updateWorkOrderStatus({
    required int id,
    required String status,
    String notes = '',
    String completionNotes = '',
    String completionEvidenceUrl = '',
  }) async {
    final token = await _getToken();

    final data = await _api.putJson(
      '${ApiConstants.baseUrl}/api/work-orders/$id/status',
      token: token,
      body: {
        'status': status,
        'notes': notes.trim().isEmpty ? null : notes.trim(),
        'completionNotes': completionNotes.trim().isEmpty
            ? null
            : completionNotes.trim(),
        'completionEvidenceUrl': completionEvidenceUrl.trim().isEmpty
            ? null
            : completionEvidenceUrl.trim(),
      },
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> updateWorkOrderSchedule({
    required int id,
    required String visitTime,
  }) async {
    final token = await _getToken();

    final data = await _api.putJson(
      '${ApiConstants.baseUrl}/api/work-orders/$id/schedule',
      token: token,
      body: {'visitTime': visitTime},
    );

    return Map<String, dynamic>.from(data as Map);
  }
}
