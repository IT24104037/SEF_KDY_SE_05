import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../../core/constants/api_constants.dart';
import '../../../core/storage/secure_storage_service.dart';

enum AdminReviewType { owners, workers, properties, ownerProfileRequests }

class AdminService {
  AdminService._();

  static final AdminService instance = AdminService._();

  Future<String> _getToken() async {
    final session = await SecureStorageService.instance.readSession();

    if (session == null ||
        session.role != 'Admin' ||
        session.token.trim().isEmpty) {
      throw Exception('Please log in with an admin account.');
    }

    return session.token;
  }

  Future<dynamic> _request(
    String path, {
    bool update = false,
    bool create = false,
    bool allowNotFound = false,
    Map<String, dynamic>? body,
  }) async {
    final token = await _getToken();

    final base = ApiConstants.baseUrl.replaceFirst(RegExp(r'/+$'), '');

    final uri = Uri.parse('$base$path');

    final headers = <String, String>{
      'Authorization': 'Bearer $token',
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
    };

    final encodedBody = body == null ? null : jsonEncode(body);

    final Future<http.Response> pendingResponse;

    if (create) {
      pendingResponse = http.post(uri, headers: headers, body: encodedBody);
    } else if (update) {
      pendingResponse = http.put(uri, headers: headers, body: encodedBody);
    } else {
      pendingResponse = http.get(uri, headers: headers);
    }

    final response = await pendingResponse.timeout(const Duration(seconds: 30));

    if (allowNotFound && response.statusCode == 404) {
      return null;
    }

    dynamic data;

    if (response.body.trim().isNotEmpty) {
      try {
        data = jsonDecode(response.body);
      } on FormatException {
        throw Exception(
          'Unexpected server response '
          '(HTTP ${response.statusCode}).',
        );
      }
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      String? message;

      if (data is Map) {
        message = data['message']?.toString();

        if (message == null || message.trim().isEmpty) {
          final errors = data['errors'];

          if (errors is Map) {
            final messages = <String>[];

            for (final value in errors.values) {
              if (value is List) {
                messages.addAll(value.map((item) => item.toString()));
              } else if (value != null) {
                messages.add(value.toString());
              }
            }

            if (messages.isNotEmpty) {
              message = messages.join('\n');
            }
          }
        }

        message ??= data['title']?.toString();
      }

      throw Exception(
        message == null || message.trim().isEmpty
            ? 'Request failed (HTTP ${response.statusCode}).'
            : message,
      );
    }

    return data;
  }

  Map<String, dynamic> _responseMap(dynamic data) {
    if (data is! Map) {
      throw Exception('The server returned an invalid response.');
    }

    return Map<String, dynamic>.from(data);
  }

  List<Map<String, dynamic>> _responseList(dynamic data) {
    if (data is! List) {
      throw Exception('The server returned an invalid list.');
    }

    return data.map((item) {
      if (item is! Map) {
        throw Exception('The server returned an invalid record.');
      }

      return Map<String, dynamic>.from(item);
    }).toList();
  }

  Future<Map<String, dynamic>> getDashboardSummary() async {
    return _responseMap(await _request('/api/admin/dashboard/summary'));
  }

  Future<Map<String, dynamic>> getUsers({
    String search = '',
    String? role,
    bool? isActive,
    int page = 1,
  }) async {
    final query = Uri(
      queryParameters: {
        'page': '$page',
        'pageSize': '20',
        if (search.trim().isNotEmpty) 'search': search.trim(),
        if (role != null && role.trim().isNotEmpty) 'role': role,
        if (isActive != null) 'isActive': isActive.toString(),
      },
    ).query;

    return _responseMap(await _request('/api/admin/users?$query'));
  }

  Future<Map<String, dynamic>> suspendUser(int id) async {
    return _responseMap(
      await _request('/api/admin/users/$id/suspend', update: true),
    );
  }

  Future<Map<String, dynamic>> reactivateUser(int id) async {
    return _responseMap(
      await _request('/api/admin/users/$id/reactivate', update: true),
    );
  }

  Future<Map<String, dynamic>> getReviewPage({
    required AdminReviewType type,
    required String status,
    String search = '',
    int page = 1,
  }) async {
    if (type == AdminReviewType.workers) {
      final query = Uri(
        queryParameters: {
          'page': '$page',
          'pageSize': '20',
          if (status != 'All') 'status': status,
          if (search.trim().isNotEmpty) 'search': search.trim(),
        },
      ).query;

      final response = _responseMap(await _request('/api/workers?$query'));

      return {
        'items': _responseList(response['workers']),
        'total': response['total'],
        'page': response['page'],
        'pageSize': response['pageSize'],
      };
    }

    final String path;

    switch (type) {
      case AdminReviewType.owners:
        path = status == 'PendingVerification'
            ? '/api/admin/owners/pending'
            : '/api/admin/owners';

      case AdminReviewType.properties:
        path = status == 'UnderReview'
            ? '/api/admin/properties/pending'
            : '/api/admin/properties';

      case AdminReviewType.ownerProfileRequests:
        path = '/api/admin/owners/profile-change-requests/pending';

      case AdminReviewType.workers:
        throw StateError('Workers are handled separately.');
    }

    var items = _responseList(await _request(path));

    if (status != 'All') {
      items = items.where((item) {
        return item['status']?.toString() == status;
      }).toList();
    }

    final searchText = search.trim().toLowerCase();

    if (searchText.isNotEmpty) {
      const searchFields = [
        'fullName',
        'email',
        'mobile',
        'name',
        'address',
        'city',
        'ownerName',
        'ownerEmail',
        'currentFullName',
        'currentEmail',
        'currentMobile',
        'requestedFullName',
        'requestedEmail',
        'requestedMobile',
      ];

      items = items.where((item) {
        return searchFields.any((field) {
          return (item[field]?.toString() ?? '').toLowerCase().contains(
            searchText,
          );
        });
      }).toList();
    }

    return {
      'items': items,
      'total': items.length,
      'page': 1,
      'pageSize': items.length,
    };
  }

  Future<Map<String, dynamic>> submitReviewDecision({
    required AdminReviewType type,
    required int id,
    required bool approve,
    String rejectionReason = '',
  }) async {
    final reason = rejectionReason.trim();

    if (!approve && reason.isEmpty) {
      throw Exception('A rejection reason is required.');
    }

    final String path;
    Map<String, dynamic>? body;

    switch (type) {
      case AdminReviewType.owners:
        path = '/api/admin/owners/$id/verification';

        body = {
          'status': approve ? 'Verified' : 'Rejected',
          if (!approve) 'rejectionReason': reason,
        };

      case AdminReviewType.workers:
        path = '/api/admin/workers/$id/verification';

        body = {
          'decision': approve ? 'Verified' : 'Rejected',
          if (!approve) 'rejectionReason': reason,
        };

      case AdminReviewType.properties:
        path =
            '/api/admin/properties/$id/'
            '${approve ? 'approve' : 'reject'}';

        if (!approve) {
          body = {'rejectionReason': reason};
        }

      case AdminReviewType.ownerProfileRequests:
        path =
            '/api/admin/owners/profile-change-requests/$id/'
            '${approve ? 'approve' : 'reject'}';

        if (!approve) {
          body = {'rejectionReason': reason};
        }
    }

    return _responseMap(await _request(path, update: true, body: body));
  }

  static const maintenanceStatuses = <String>[
    'Submitted',
    'Emergency',
    'Analysing',
    'NeedsMoreInfo',
    'Approved',
    'Rejected',
    'Assigned',
    'InProgress',
    'OwnerArrangingExternalMaintenance',
    'OwnerArrangingExternalEmergencyService',
    'ExternalMaintenanceScheduled',
    'ExternalEmergencyServiceScheduled',
    'Completed',
    'Cancelled',
  ];

  // These options match the existing backend's transition rules.
  static const maintenanceTransitions = <String, List<String>>{
    'Submitted': ['Analysing', 'NeedsMoreInfo', 'Cancelled'],
    'Emergency': [
      'Approved',
      'Rejected',
      'Analysing',
      'OwnerArrangingExternalEmergencyService',
      'Cancelled',
    ],
    'Analysing': [
      'NeedsMoreInfo',
      'Assigned',
      'OwnerArrangingExternalMaintenance',
      'OwnerArrangingExternalEmergencyService',
      'Cancelled',
    ],
    'NeedsMoreInfo': ['Submitted', 'Analysing', 'Cancelled'],
    'Assigned': ['InProgress', 'Cancelled'],
    'InProgress': ['Completed'],
    'OwnerArrangingExternalMaintenance': [
      'ExternalMaintenanceScheduled',
      'Completed',
      'Cancelled',
    ],
    'OwnerArrangingExternalEmergencyService': [
      'ExternalEmergencyServiceScheduled',
      'Completed',
    ],
    'ExternalMaintenanceScheduled': ['InProgress', 'Completed', 'Cancelled'],
    'ExternalEmergencyServiceScheduled': ['InProgress', 'Completed'],
  };

  Future<Map<String, dynamic>> getMaintenanceRequests({
    required bool emergency,
    String search = '',
    String status = 'All',
    String priority = 'All',
    int page = 1,
  }) async {
    final query = Uri(
      queryParameters: {
        'requestType': emergency ? 'EMERGENCY' : 'NORMAL',
        'page': '$page',
        'pageSize': '20',
        'sortBy': 'createdAt',
        'sortDirection': 'desc',
        if (search.trim().isNotEmpty) 'search': search.trim(),
        if (status != 'All') 'status': status,
        if (priority != 'All') 'priority': priority,
      },
    ).query;

    return _responseMap(await _request('/api/maintenance-requests?$query'));
  }

  Future<List<Map<String, dynamic>>> getMaintenanceHistory(int id) async {
    return _responseList(
      await _request('/api/maintenance-requests/$id/history'),
    );
  }

  Future<Map<String, dynamic>> updateMaintenanceStatus(
    int id, {
    required String status,
    String note = '',
  }) async {
    return _responseMap(
      await _request(
        '/api/maintenance-requests/$id/status',
        update: true,
        body: {
          'status': status,
          if (note.trim().isNotEmpty) 'note': note.trim(),
        },
      ),
    );
  }

  Future<Map<String, dynamic>> archiveMaintenanceRequest(int id) async {
    return _responseMap(
      await _request('/api/maintenance-requests/$id/archive', update: true),
    );
  }

  Future<List<Map<String, dynamic>>> getMaintenanceCategories() async {
    return _responseList(
      await _request('/api/maintenance-categories?includeInactive=true'),
    );
  }

  Future<Map<String, dynamic>> createMaintenanceCategory({
    required String name,
    String description = '',
  }) async {
    return _responseMap(
      await _request(
        '/api/maintenance-categories',
        create: true,
        body: {'name': name.trim(), 'description': description.trim()},
      ),
    );
  }

  Future<Map<String, dynamic>> updateMaintenanceCategory(
    int id, {
    required String name,
    String description = '',
    required bool isActive,
  }) async {
    return _responseMap(
      await _request(
        '/api/maintenance-categories/$id',
        update: true,
        body: {
          'name': name.trim(),
          'description': description.trim(),
          'isActive': isActive,
        },
      ),
    );
  }

  Future<Map<String, dynamic>> getMaintenanceRequest(int id) async {
    return _responseMap(await _request('/api/maintenance-requests/$id'));
  }

  Future<Map<String, dynamic>?> getMaintenanceWorkflow(int id) async {
    final response = await _request(
      '/api/agent-workflows/request/$id',
      allowNotFound: true,
    );

    return response == null ? null : _responseMap(response);
  }

  Future<Map<String, dynamic>> startMaintenanceWorkflow(int id) async {
    return _responseMap(
      await _request(
        '/api/agent-workflows/start',
        create: true,
        body: {'maintenanceRequestId': id},
      ),
    );
  }

  Future<Map<String, dynamic>> getMaintenanceHistoryRequests({
    String search = '',
    String requestType = 'All',
    String status = 'All',
    int page = 1,
  }) async {
    final query = Uri(
      queryParameters: {
        'page': '$page',
        'pageSize': '20',
        if (search.trim().isNotEmpty) 'search': search.trim(),
        if (requestType != 'All') 'requestType': requestType,
        if (status != 'All') 'status': status,
      },
    ).query;

    return _responseMap(
      await _request('/api/maintenance-requests/history-list?$query'),
    );
  }

  Future<Map<String, dynamic>?> getWorkflowById(int id) async {
    final response = await _request(
      '/api/agent-workflows/$id',
      allowNotFound: true,
    );

    return response == null ? null : _responseMap(response);
  }

  Future<Map<String, dynamic>?> getMaintenanceRecommendation(
    int requestId,
  ) async {
    final response = await _request(
      '/api/maintenance-requests/$requestId/recommendation',
      allowNotFound: true,
    );

    return response == null ? null : _responseMap(response);
  }
}
