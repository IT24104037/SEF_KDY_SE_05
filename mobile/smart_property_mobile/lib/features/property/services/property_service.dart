import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage_service.dart';

import 'dart:convert';

import 'package:http/http.dart' as owner_api_http;

class PropertyService {
  PropertyService._();

  static final PropertyService instance = PropertyService._();

  final ApiClient _api = ApiClient.instance;

  final SecureStorageService _storage = SecureStorageService.instance;

  Future<String> _ownerToken() async {
    final session = await _storage.readSession();

    if (session == null) {
      throw const ApiException(
        'Your session has expired. Please log in again.',
      );
    }

    if (session.role != 'PropertyOwner') {
      throw const ApiException(
        'This feature is only available to property owners.',
      );
    }

    return session.token;
  }

  // =========================================================
  // OWNER DASHBOARD
  // =========================================================

  Future<Map<String, dynamic>> getDashboard() async {
    final token = await _ownerToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/properties/dashboard',
      token: token,
    );

    return Map<String, dynamic>.from(data as Map);
  }

  // =========================================================
  // PROPERTIES
  // =========================================================

  Future<List<Map<String, dynamic>>> getProperties({
    String search = '',
    String city = '',
    String status = '',
  }) async {
    final token = await _ownerToken();

    final uri = Uri.parse('${ApiConstants.baseUrl}/api/properties').replace(
      queryParameters: {
        if (search.trim().isNotEmpty) 'search': search.trim(),
        if (city.trim().isNotEmpty) 'city': city.trim(),
        if (status.trim().isNotEmpty) 'status': status.trim(),
        'sortBy': 'name',
        'sortDirection': 'asc',
        'page': '1',
        'pageSize': '100',
      },
    );

    final data = await _api.getJson(uri.toString(), token: token);

    if (data is! Map) {
      return [];
    }

    final items = data['items'];

    if (items is! List) {
      return [];
    }

    return items
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Future<Map<String, dynamic>> getProperty(int propertyId) async {
    final token = await _ownerToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/properties/$propertyId',
      token: token,
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> createProperty({
    required String name,
    required String address,
    String? city,
    String? description,
    double? latitude,
    double? longitude,
    required String documentType,
    required String documentUrl,
  }) async {
    final token = await _ownerToken();

    final data = await _api.postJson(
      '${ApiConstants.baseUrl}/api/properties',
      token: token,
      body: {
        'name': name.trim(),
        'address': address.trim(),
        'city': city?.trim().isEmpty == true ? null : city?.trim(),
        'description': description?.trim().isEmpty == true
            ? null
            : description?.trim(),
        'latitude': latitude,
        'longitude': longitude,
        'documentType': documentType.trim(),
        'documentUrl': documentUrl.trim(),
      },
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> archiveProperty(int propertyId) async {
    final token = await _ownerToken();

    await _api.deleteJson(
      '${ApiConstants.baseUrl}/api/properties/$propertyId',
      token: token,
    );
  }

  // =========================================================
  // UNITS
  // =========================================================

  Future<List<Map<String, dynamic>>> getUnits(int propertyId) async {
    final token = await _ownerToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/properties/$propertyId/units'
      '?page=1&pageSize=100',
      token: token,
    );

    if (data is! Map) {
      return [];
    }

    final items = data['items'];

    if (items is! List) {
      return [];
    }

    return items
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Future<Map<String, dynamic>> createUnit({
    required int propertyId,
    required String unitLabel,
    String? description,
  }) async {
    final token = await _ownerToken();

    final data = await _api.postJson(
      '${ApiConstants.baseUrl}/api/properties/$propertyId/units',
      token: token,
      body: {
        'unitLabel': unitLabel.trim(),
        'description': description?.trim().isEmpty == true
            ? null
            : description?.trim(),
      },
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> archiveUnit({
    required int propertyId,
    required int unitId,
  }) async {
    final token = await _ownerToken();

    await _api.deleteJson(
      '${ApiConstants.baseUrl}/api/properties/$propertyId/units/$unitId',
      token: token,
    );
  }

  // =========================================================
  // OWNER TENANTS
  // =========================================================

  Future<List<Map<String, dynamic>>> getTenantOptions() async {
    final token = await _ownerToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/tenants/options',
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

  Future<List<Map<String, dynamic>>> getTenants({String search = ''}) async {
    final token = await _ownerToken();

    final uri = Uri.parse('${ApiConstants.baseUrl}/api/tenants').replace(
      queryParameters: {
        if (search.trim().isNotEmpty) 'search': search.trim(),
        'sortBy': 'FullName',
        'descending': 'false',
        'page': '1',
        'pageSize': '100',
      },
    );

    final data = await _api.getJson(uri.toString(), token: token);

    if (data is! Map) {
      return [];
    }

    final items = data['items'];

    if (items is! List) {
      return [];
    }

    return items
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Future<Map<String, dynamic>> getTenant(int tenantId) async {
    final token = await _ownerToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/tenants/$tenantId',
      token: token,
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> createTenant({
    required String fullName,
    required String mobileNumber,
    String? email,
    required int propertyId,
    required int unitId,
  }) async {
    final token = await _ownerToken();

    final data = await _api.postJson(
      '${ApiConstants.baseUrl}/api/tenants',
      token: token,
      body: {
        'fullName': fullName.trim(),
        'mobileNumber': mobileNumber.trim(),
        'email': email?.trim().isEmpty == true ? null : email?.trim(),
        'propertyId': propertyId,
        'unitId': unitId,
      },
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> updateTenant({
    required int id,
    String? fullName,
    String? email,
  }) async {
    final token = await _ownerToken();

    final data = await _api.putJson(
      '${ApiConstants.baseUrl}/api/tenants/$id',
      token: token,
      body: {
        'fullName': fullName?.trim().isEmpty == true ? null : fullName?.trim(),
        'email': email?.trim().isEmpty == true ? null : email?.trim(),
      },
    );

    return Map<String, dynamic>.from(data as Map);
  }

  // =========================================================
  // TENANCIES
  // =========================================================

  Future<List<Map<String, dynamic>>> getTenantTenancies(int tenantId) async {
    final token = await _ownerToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/tenancies/tenant/$tenantId',
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

  Future<void> endTenancy(int tenancyId) async {
    final token = await _ownerToken();

    await _api.putJson(
      '${ApiConstants.baseUrl}/api/tenancies/$tenancyId/end',
      token: token,
      body: {'endDate': null},
    );
  }

  // =========================================================
  // OWNER MAINTENANCE
  // =========================================================

  Future<List<Map<String, dynamic>>> getOwnerMaintenanceRequests({
    String search = '',
    String? status,
    required String requestType,
  }) async {
    final token = await _ownerToken();

    final uri = Uri.parse('${ApiConstants.baseUrl}/api/maintenance-requests')
        .replace(
          queryParameters: {
            if (search.trim().isNotEmpty) 'search': search.trim(),
            if (status != null && status.trim().isNotEmpty)
              'status': status.trim(),
            'requestType': requestType,
            'sortBy': 'updatedAt',
            'sortDirection': 'desc',
            'page': '1',
            'pageSize': '100',
          },
        );

    final data = await _api.getJson(uri.toString(), token: token);

    return _ownerMapList(data, preferredKey: 'requests');
  }

  Future<Map<String, dynamic>> getOwnerMaintenanceRequest(int requestId) async {
    final token = await _ownerToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/maintenance-requests/$requestId',
      token: token,
    );

    return Map<String, dynamic>.from(data as Map);
  }

  Future<List<Map<String, dynamic>>> getMaintenanceRequestHistory(
    int requestId,
  ) async {
    final token = await _ownerToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/maintenance-requests/'
      '$requestId/history',
      token: token,
    );

    return _ownerMapList(data);
  }

  Future<List<Map<String, dynamic>>> getOwnerMaintenanceHistory({
    String search = '',
    String? status,
    String? requestType,
  }) async {
    final token = await _ownerToken();

    final uri =
        Uri.parse(
          '${ApiConstants.baseUrl}/api/maintenance-requests/history-list',
        ).replace(
          queryParameters: {
            if (search.trim().isNotEmpty) 'search': search.trim(),
            if (status != null && status.trim().isNotEmpty)
              'status': status.trim(),
            if (requestType != null && requestType.trim().isNotEmpty)
              'requestType': requestType.trim(),
            'page': '1',
            'pageSize': '100',
          },
        );

    final data = await _api.getJson(uri.toString(), token: token);

    return _ownerMapList(data, preferredKey: 'requests');
  }

  // =========================================================
  // OWNER WORK ORDERS
  // =========================================================

  Future<List<Map<String, dynamic>>> getOwnerWorkOrders({
    String? status,
  }) async {
    final token = await _ownerToken();

    final uri = Uri.parse('${ApiConstants.baseUrl}/api/work-orders').replace(
      queryParameters: {
        if (status != null && status.trim().isNotEmpty) 'status': status.trim(),
        'page': '1',
        'pageSize': '100',
      },
    );

    final data = await _api.getJson(uri.toString(), token: token);

    return _ownerMapList(data);
  }

  Future<Map<String, dynamic>> getOwnerWorkOrder(int workOrderId) async {
    final token = await _ownerToken();

    final data = await _api.getJson(
      '${ApiConstants.baseUrl}/api/work-orders/$workOrderId',
      token: token,
    );

    return Map<String, dynamic>.from(data as Map);
  }

  // =========================================================
  // RESPONSE LIST HELPER
  // =========================================================

  List<Map<String, dynamic>> _ownerMapList(
    dynamic data, {
    String? preferredKey,
  }) {
    dynamic raw = data;

    if (data is Map) {
      raw = preferredKey == null ? null : data[preferredKey];

      raw ??= data['requests'];
      raw ??= data['items'];
      raw ??= data['workOrders'];
    }

    if (raw is! List) {
      return [];
    }

    return raw
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }
  // =========================================================
  // OWNER APPROVALS AND AI WORKFLOW
  // =========================================================

  Future<dynamic> _ownerApiRequest(
    String path, {
    Map<String, dynamic>? body,
    bool allowNotFound = false,
  }) async {
    final token = await _ownerToken();

    final uri = Uri.parse('${ApiConstants.baseUrl}$path');

    final headers = <String, String>{
      'Authorization': 'Bearer $token',
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
    };

    final response =
        await (body == null
                ? owner_api_http.get(uri, headers: headers)
                : owner_api_http.post(
                    uri,
                    headers: headers,
                    body: jsonEncode(body),
                  ))
            .timeout(const Duration(seconds: 30));

    if (response.statusCode == 404 && allowNotFound) {
      return null;
    }

    dynamic data;

    try {
      if (response.body.trim().isNotEmpty) {
        data = jsonDecode(response.body);
      }
    } on FormatException {
      throw Exception(
        'The server returned an unexpected response '
        '(HTTP ${response.statusCode}).',
      );
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = data is Map ? data['message'] : null;

      throw Exception(
        message ??
            'Request failed '
                '(HTTP ${response.statusCode}).',
      );
    }

    return data;
  }

  Map<String, dynamic> _ownerResponseMap(dynamic data) {
    if (data is! Map) {
      throw Exception('Unexpected server response.');
    }

    return Map<String, dynamic>.from(data);
  }

  Future<List<Map<String, dynamic>>> getOwnerPendingApprovals() async {
    final data = await _ownerApiRequest(
      '/api/maintenance-requests/pending-approvals',
    );

    if (data is! List) {
      throw Exception('Unexpected approval list response.');
    }

    return data
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Future<Map<String, dynamic>> getOwnerRecommendation(int requestId) async {
    final data = await _ownerApiRequest(
      '/api/maintenance-requests/'
      '$requestId/recommendation',
    );

    return _ownerResponseMap(data);
  }

  Future<Map<String, dynamic>?> getOwnerWorkflow(int requestId) async {
    final data = await _ownerApiRequest(
      '/api/agent-workflows/request/$requestId',
      allowNotFound: true,
    );

    return data == null ? null : _ownerResponseMap(data);
  }

  Future<Map<String, dynamic>> getOwnerAiRequestPage({
    int page = 1,
    String search = '',
  }) async {
    final query = Uri(
      queryParameters: {
        'page': '$page',
        'pageSize': '20',
        'sortBy': 'createdAt',
        'sortDirection': 'desc',
        if (search.trim().isNotEmpty) 'search': search.trim(),
      },
    ).query;

    final data = await _ownerApiRequest('/api/maintenance-requests?$query');

    return _ownerResponseMap(data);
  }

  Future<Map<String, dynamic>> submitOwnerApproval({
    required int requestId,
    required String decision,
    int? workerId,
    DateTime? scheduledDate,
    String notes = '',
  }) async {
    if (!const ['Approve', 'Reject', 'RevisionRequested'].contains(decision)) {
      throw ArgumentError('Invalid owner decision.');
    }

    if (decision == 'Approve' &&
        (workerId == null ||
            workerId <= 0 ||
            scheduledDate == null ||
            !scheduledDate.isAfter(DateTime.now()))) {
      throw ArgumentError(
        'Select a valid recommended worker '
        'and a future schedule.',
      );
    }

    final data = _ownerResponseMap(
      await _ownerApiRequest(
        '/api/maintenance-requests/'
        '$requestId/approval',
        body: {
          'decision': decision,
          if (decision == 'Approve') 'workerId': workerId,
          if (decision == 'Approve')
            'scheduledDate': scheduledDate!.toUtc().toIso8601String(),
          'notes': notes.trim(),
        },
      ),
    );

    if (data['success'] != true) {
      throw Exception(data['message'] ?? 'The decision could not be recorded.');
    }

    return data;
  }

  Future<Map<String, dynamic>> submitOwnerManualDecision({
    required int requestId,
    required String decision,
    required String message,
  }) async {
    final tenantMessage = message.trim();

    if (!const ['Approve', 'Reject'].contains(decision)) {
      throw ArgumentError('Invalid manual decision.');
    }

    if (tenantMessage.isEmpty) {
      throw ArgumentError('A message to the tenant is required.');
    }

    if (tenantMessage.length > 1000) {
      throw ArgumentError('The message cannot exceed 1000 characters.');
    }

    final result = _ownerResponseMap(
      await _ownerApiRequest(
        '/api/maintenance-requests/'
        '$requestId/manual-decision',
        body: {'decision': decision, 'message': tenantMessage},
      ),
    );

    if (result['success'] != true) {
      throw Exception(
        result['message'] ?? 'The manual decision could not be recorded.',
      );
    }

    return result;
  }
  // =========================================================
  // OWNER PROFILE
  // =========================================================

  Future<Map<String, dynamic>> getOwnerProfile() async {
    final data = await _ownerApiRequest('/api/owners/me/verification');

    return _ownerResponseMap(data);
  }

  Future<Map<String, dynamic>?> getOwnerProfileChangeRequest() async {
    final data = await _ownerApiRequest(
      '/api/owners/me/profile-change-request',
      allowNotFound: true,
    );

    return data == null ? null : _ownerResponseMap(data);
  }

  Future<Map<String, dynamic>> submitOwnerProfileChange({
    required String fullName,
    required String email,
    required String mobile,
  }) async {
    final data = await _ownerApiRequest(
      '/api/owners/me/profile-change-request',
      body: {
        'fullName': fullName.trim(),
        'email': email.trim(),
        'mobile': mobile.trim(),
      },
    );

    return _ownerResponseMap(data);
  }
}
