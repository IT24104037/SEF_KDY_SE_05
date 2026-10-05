import 'dart:convert';

import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../models/login_response.dart';

class AuthService {
  AuthService({ApiClient? apiClient, SecureStorageService? storage})
    : _apiClient = apiClient ?? ApiClient.instance,
      _storage = storage ?? SecureStorageService.instance;

  final ApiClient _apiClient;
  final SecureStorageService _storage;

  static const Set<String> supportedRoles = <String>{
    'Admin',
    'PropertyOwner',
    'Tenant',
    'MaintenanceWorker',
  };

  Future<LoginResponse> login({
    required String identifier,
    required String password,
  }) async {
    final cleanIdentifier = identifier.trim();

    if (cleanIdentifier.isEmpty) {
      throw const ApiException('Email or mobile is required.');
    }

    if (password.isEmpty) {
      throw const ApiException('Password is required.');
    }

    final data = await _apiClient.postJson(
      ApiConstants.login,
      body: <String, dynamic>{
        'identifier': cleanIdentifier,
        'password': password,
      },
    );

    if (data is! Map<String, dynamic>) {
      throw const ApiException('Invalid login response from server.');
    }

    final response = LoginResponse.fromJson(data);

    if (!supportedRoles.contains(response.role)) {
      throw const ApiException(
        'This account role is not supported by the mobile application.',
      );
    }

    await _storage.saveSession(
      token: response.token,
      userId: response.userId,
      fullName: response.fullName,
      role: response.role,
    );

    return response;
  }

  Future<StoredSession?> restoreSession() async {
    final session = await _storage.readSession();

    if (session == null) return null;

    if (!supportedRoles.contains(session.role) ||
        _isTokenExpired(session.token)) {
      await _storage.clearSession();
      return null;
    }

    return session;
  }

  Future<void> logout() => _storage.clearSession();

  bool _isTokenExpired(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return true;

      final normalized = base64Url.normalize(parts[1]);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final payload = jsonDecode(decoded);

      if (payload is! Map<String, dynamic>) return true;

      final exp = payload['exp'];
      if (exp is! num) return true;

      final expiresAt = DateTime.fromMillisecondsSinceEpoch(
        exp.toInt() * 1000,
        isUtc: true,
      );

      return DateTime.now().toUtc().isAfter(expiresAt);
    } catch (_) {
      return true;
    }
  }
}
