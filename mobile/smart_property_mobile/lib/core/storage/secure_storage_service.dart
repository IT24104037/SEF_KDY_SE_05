import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StoredSession {
  const StoredSession({
    required this.token,
    required this.userId,
    required this.fullName,
    required this.role,
  });

  final String token;
  final int userId;
  final String fullName;
  final String role;
}

class SecureStorageService {
  SecureStorageService._();

  static final SecureStorageService instance = SecureStorageService._();

  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static const String _tokenKey = 'auth_token';
  static const String _userIdKey = 'auth_user_id';
  static const String _fullNameKey = 'auth_full_name';
  static const String _roleKey = 'auth_role';

  Future<void> saveSession({
    required String token,
    required int userId,
    required String fullName,
    required String role,
  }) async {
    await Future.wait(<Future<void>>[
      _storage.write(key: _tokenKey, value: token),
      _storage.write(key: _userIdKey, value: userId.toString()),
      _storage.write(key: _fullNameKey, value: fullName),
      _storage.write(key: _roleKey, value: role),
    ]);
  }

  Future<StoredSession?> readSession() async {
    final values = await Future.wait<String?>(<Future<String?>>[
      _storage.read(key: _tokenKey),
      _storage.read(key: _userIdKey),
      _storage.read(key: _fullNameKey),
      _storage.read(key: _roleKey),
    ]);

    final token = values[0];
    final userId = int.tryParse(values[1] ?? '');
    final fullName = values[2];
    final role = values[3];

    if (token == null ||
        token.isEmpty ||
        userId == null ||
        fullName == null ||
        fullName.isEmpty ||
        role == null ||
        role.isEmpty) {
      return null;
    }

    return StoredSession(
      token: token,
      userId: userId,
      fullName: fullName,
      role: role,
    );
  }

  Future<void> clearSession() async {
    await Future.wait(<Future<void>>[
      _storage.delete(key: _tokenKey),
      _storage.delete(key: _userIdKey),
      _storage.delete(key: _fullNameKey),
      _storage.delete(key: _roleKey),
    ]);
  }
}
