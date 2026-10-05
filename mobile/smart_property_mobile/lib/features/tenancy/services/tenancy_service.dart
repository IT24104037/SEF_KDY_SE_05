import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage_service.dart';

class TenancyService {
  TenancyService._();

  static final TenancyService instance = TenancyService._();

  final ApiClient _api = ApiClient.instance;
  final SecureStorageService _storage = SecureStorageService.instance;

  Future<String> _tenantToken() async {
    final session = await _storage.readSession();

    if (session == null) {
      throw const ApiException(
        'Your session has expired. Please log in again.',
      );
    }

    if (session.role != 'Tenant') {
      throw const ApiException('This feature is only available to tenants.');
    }

    return session.token;
  }

  Future<Map<String, dynamic>?> getCurrentTenancy() async {
    final token = await _tenantToken();

    try {
      final data = await _api.getJson(
        '${ApiConstants.baseUrl}/api/tenancies/current',
        token: token,
      );

      return Map<String, dynamic>.from(data as Map);
    } on ApiException catch (error) {
      if (error.statusCode == 404) {
        return null;
      }

      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getTenancyHistory() async {
    final token = await _tenantToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/tenancies/history',
      token: token,
    );

    if (data is! List) {
      return [];
    }

    return data
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Future<Map<String, dynamic>> getMyProfile() async {
    final token = await _tenantToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/tenants/me',
      token: token,
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> updateMyProfile({
    required String mobileNumber,
    String? email,
  }) async {
    final token = await _tenantToken();

    final data = await _api.putJson(
      '${ApiConstants.baseUrl}/api/tenants/me',
      token: token,
      body: {
        'mobileNumber': mobileNumber.trim(),
        'email': email?.trim().isEmpty == true ? null : email?.trim(),
      },
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<List<Map<String, dynamic>>> getNotifications() async {
    final token = await _tenantToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/tenant/notifications',
      token: token,
    );

    if (data is! List) {
      return [];
    }

    return data
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Future<Map<String, dynamic>> activateTenant({
    required String mobileNumber,
    required String pin,
    required String password,
    required String confirmPassword,
  }) async {
    final data = await _api.postJson(
      '${ApiConstants.baseUrl}/api/tenant-activation/activate',
      body: {
        'mobileNumber': mobileNumber.trim(),
        'pin': pin.trim(),
        'password': password,
        'confirmPassword': confirmPassword,
      },
    );

    return Map<String, dynamic>.from(data as Map);
  }
}
