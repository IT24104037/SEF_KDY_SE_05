import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  final http.Client _client = http.Client();

  static const Duration _timeout = Duration(seconds: 15);

  Future<dynamic> getJson(String url, {String? token}) async {
    return _request(
      () => _client.get(Uri.parse(url), headers: _headers(token: token)),
    );
  }

  Future<dynamic> postJson(
    String url, {
    required Map<String, dynamic> body,
    String? token,
  }) async {
    return _request(
      () => _client.post(
        Uri.parse(url),
        headers: _headers(token: token),
        body: jsonEncode(body),
      ),
    );
  }

  Future<dynamic> putJson(
    String url, {
    required Map<String, dynamic> body,
    String? token,
  }) async {
    return _request(
      () => _client.put(
        Uri.parse(url),
        headers: _headers(token: token),
        body: jsonEncode(body),
      ),
    );
  }

  Future<dynamic> deleteJson(String url, {String? token}) async {
    return _request(
      () => _client.delete(Uri.parse(url), headers: _headers(token: token)),
    );
  }

  Map<String, String> _headers({String? token}) {
    return <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',

      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> _request(Future<http.Response> Function() operation) async {
    try {
      final response = await operation().timeout(_timeout);

      final data = _decodeBody(response.body);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException(
          _extractMessage(data, fallback: 'Request failed. Please try again.'),
          statusCode: response.statusCode,
        );
      }

      return data;
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw const ApiException(
        'The server took too long to respond. Please try again.',
      );
    } on SocketException {
      throw const ApiException(
        'Cannot connect to the server. Check your connection and try again.',
      );
    } on http.ClientException {
      throw const ApiException('A network error occurred. Please try again.');
    } on FormatException {
      throw const ApiException('The server returned an unexpected response.');
    }
  }

  dynamic _decodeBody(String body) {
    final trimmed = body.trim();

    if (trimmed.isEmpty) {
      return <String, dynamic>{};
    }

    return jsonDecode(trimmed);
  }

  String _extractMessage(dynamic data, {required String fallback}) {
    if (data is Map<String, dynamic>) {
      final message = data['message'];

      if (message is String && message.trim().isNotEmpty) {
        return message.trim();
      }
    }

    return fallback;
  }
}
