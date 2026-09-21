import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

import '../../../core/constants/api_constants.dart';

class MaintenanceService {
  Future<String> uploadImage({
    required XFile file,
    required String token,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse(ApiConstants.maintenanceImageUpload),
    );

    request.headers['Authorization'] = 'Bearer $token';

    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        file.path,
      ),
    );

    final streamedResponse = await request.send();

    final response =
        await http.Response.fromStream(streamedResponse);

    final data = jsonDecode(response.body);

    if (response.statusCode < 200 ||
        response.statusCode >= 300) {
      throw Exception(
        data['message'] ?? 'Image upload failed.',
      );
    }

    return data['imageUrl'];
  }

  Future<Map<String, dynamic>> createMaintenanceRequest({
    required String token,
    required String description,
    required String requestType,
    String? emergencyType,
    String? imageUrl,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.maintenanceRequests),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'description': description,
        'requestType': requestType,
        'emergencyType': emergencyType,
        'imageUrl': imageUrl,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode < 200 ||
        response.statusCode >= 300) {
      throw Exception(
        data['message'] ??
            'Failed to create maintenance request.',
      );
    }

    return Map<String, dynamic>.from(data);
  }

  Future<Map<String, dynamic>> getRequests({
    required String token,
    int page = 1,
    int pageSize = 10,
    String? status,
    String? requestType,
  }) async {
    final params = <String, String>{
      'page': page.toString(),
      'pageSize': pageSize.toString(),
      'sortBy': 'createdAt',
      'sortDirection': 'desc',
    };

    if (status != null && status.isNotEmpty) {
      params['status'] = status;
    }

    if (requestType != null &&
        requestType.isNotEmpty) {
      params['requestType'] = requestType;
    }

    final uri = Uri.parse(
      ApiConstants.maintenanceRequests,
    ).replace(queryParameters: params);

    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    final data = jsonDecode(response.body);

    if (response.statusCode < 200 ||
        response.statusCode >= 300) {
      throw Exception(
        data['message'] ??
            'Failed to load maintenance requests.',
      );
    }

    return Map<String, dynamic>.from(data);
  }

  Future<Map<String, dynamic>> getRequestById({
    required String token,
    required int id,
  }) async {
    final response = await http.get(
      Uri.parse(
        '${ApiConstants.maintenanceRequests}/$id',
      ),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    final data = jsonDecode(response.body);

    if (response.statusCode < 200 ||
        response.statusCode >= 300) {
      throw Exception(
        data['message'] ??
            'Failed to load maintenance request.',
      );
    }

    return Map<String, dynamic>.from(data);
  }

  Future<List<dynamic>> getHistory({
    required String token,
    required int id,
  }) async {
    final response = await http.get(
      Uri.parse(
        '${ApiConstants.maintenanceRequests}/$id/history',
      ),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    final data = jsonDecode(response.body);

    if (response.statusCode < 200 ||
        response.statusCode >= 300) {
      throw Exception(
        data is Map
            ? data['message'] ??
                'Failed to load status history.'
            : 'Failed to load status history.',
      );
    }

    return List<dynamic>.from(data);
  }

  Future<void> cancelRequest({
    required String token,
    required int id,
  }) async {
    final response = await http.put(
      Uri.parse(
        '${ApiConstants.maintenanceRequests}/$id/status',
      ),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'status': 'Cancelled',
        'note': 'Cancelled by tenant.',
      }),
    );

    if (response.statusCode < 200 ||
        response.statusCode >= 300) {
      final data = jsonDecode(response.body);

      throw Exception(
        data['message'] ??
            'Failed to cancel maintenance request.',
      );
    }
  }

  Future<void> updateRequestStatus({
    required String token,
    required int requestId,
    required String status,
    String? note,
}) async {
  final response = await http.put(
    Uri.parse('${ApiConstants.maintenanceRequests}/$requestId/status'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'status': status,
      'note': note,
    }),
  );

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw Exception(
      'Failed to update request status: ${response.body}',
    );
  }
}
}