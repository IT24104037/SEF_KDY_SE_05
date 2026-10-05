import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

import '../constants/api_constants.dart';
import '../storage/secure_storage_service.dart';

typedef Json = Map<String, dynamic>;

class MobileApi {
  static Uri uri(String path, [Map<String, String>? query]) {
    final base = ApiConstants.baseUrl.replaceAll(RegExp(r'/+$'), '');
    final result = Uri.parse('$base/').resolve(path);
    return query == null ? result : result.replace(queryParameters: query);
  }

  static Future<Map<String, String>> headers(bool anonymous) async {
    if (anonymous) {
      return {'Content-Type': 'application/json'};
    }

    final session = await SecureStorageService.instance.readSession();
    if (session == null) {
      throw Exception('Please log in again.');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${session.token}',
    };
  }

  static String errorMessage(dynamic data, int code) {
    if (data is Map) {
      if (data['errors'] is Map) {
        final values = (data['errors'] as Map).values
            .expand((v) => v is List ? v : [v])
            .join('\n');

        if (values.isNotEmpty) return values;
      }

      for (final key in ['message', 'detail', 'title']) {
        if (data[key] != null) return '${data[key]}';
      }
    }

    return code == 401
        ? 'Please log in again.'
        : code == 403
        ? 'This action is not allowed for your account.'
        : 'Request failed ($code). Please try again.';
  }

  static Future<dynamic> request(
    String path, {
    String method = 'GET',
    Json? body,
    Map<String, String>? query,
    bool anonymous = false,
    bool allowNotFound = false,
  }) async {
    final h = await headers(anonymous);
    final u = uri(path, query);

    try {
      final Future<http.Response> pending;

      switch (method) {
        case 'POST':
          pending = http.post(u, headers: h, body: jsonEncode(body ?? {}));
          break;
        case 'PUT':
          pending = http.put(u, headers: h, body: jsonEncode(body ?? {}));
          break;
        case 'DELETE':
          pending = http.delete(u, headers: h);
          break;
        default:
          pending = http.get(u, headers: h);
      }

      final response = await pending.timeout(const Duration(seconds: 30));

      if (allowNotFound && response.statusCode == 404) {
        return null;
      }

      dynamic data;
      if (response.body.trim().isNotEmpty) {
        try {
          data = jsonDecode(response.body);
        } catch (_) {
          data = null;
        }
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(errorMessage(data, response.statusCode));
      }

      return data;
    } on TimeoutException {
      throw Exception('The server took too long. Please retry.');
    } on SocketException {
      throw Exception('Cannot connect to the server.');
    } on http.ClientException {
      throw Exception('A network error occurred. Please retry.');
    }
  }

  static Json map(dynamic value) => value is Map ? Json.from(value) : {};

  static List<Json> list(dynamic value) => value is List
      ? value.whereType<Map>().map((v) => Json.from(v)).toList()
      : [];

  static Future<void> openDocument(String value) async {
    final link = uri(value.trim());

    if (!['http', 'https'].contains(link.scheme)) {
      throw Exception('This document link is invalid.');
    }

    final opened = await launchUrl(link, mode: LaunchMode.externalApplication);

    if (!opened) {
      throw Exception('Unable to open this document.');
    }
  }

  static Future<bool> saveUnitHistory(
    int propertyId,
    int unitId,
    String label,
  ) async {
    final response = await http
        .get(
          uri(
            '/api/properties/$propertyId/units/'
            '$unitId/tenancy-history/export',
          ),
          headers: await headers(false),
        )
        .timeout(const Duration(seconds: 45));

    if (response.statusCode != 200) {
      dynamic data;
      try {
        data = jsonDecode(response.body);
      } catch (_) {}

      throw Exception(errorMessage(data, response.statusCode));
    }

    final safeLabel = label.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');

    final path = await FilePicker.platform.saveFile(
      dialogTitle: 'Save tenancy history',
      fileName: '${safeLabel}_Tenancy_History.xlsx',
      type: FileType.custom,
      allowedExtensions: ['xlsx'],
      bytes: response.bodyBytes,
    );

    if (path == null) return false;

    if (!Platform.isAndroid && !Platform.isIOS) {
      await File(path).writeAsBytes(response.bodyBytes);
    }

    return true;
  }
}
