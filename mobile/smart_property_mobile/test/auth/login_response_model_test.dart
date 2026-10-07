import 'package:flutter_test/flutter_test.dart';
import 'package:smart_property_mobile/features/auth/models/login_response.dart';

void main() {
  group('TC-MOB-02: LoginResponse Data Parsing & Error Boundaries', () {
    test('Normal case: Valid API JSON payload parses into LoginResponse model',
        () {
      final validJson = <String, dynamic>{
        'token': 'mock-jwt-token-xyz-12345',
        'userId': 42,
        'fullName': 'Kasun Perera',
        'role': 'MaintenanceWorker',
      };

      final response = LoginResponse.fromJson(validJson);

      expect(response.token, equals('mock-jwt-token-xyz-12345'));
      expect(response.userId, equals(42));
      expect(response.fullName, equals('Kasun Perera'));
      expect(response.role, equals('MaintenanceWorker'));
    });

    test(
        'Invalid case: Missing token in response payload throws FormatException',
        () {
      final invalidJson = <String, dynamic>{
        'token': '', // empty token
        'userId': 42,
        'fullName': 'Kasun Perera',
        'role': 'MaintenanceWorker',
      };

      expect(
        () => LoginResponse.fromJson(invalidJson),
        throwsA(isA<FormatException>()),
      );
    });

    test(
        'Boundary / Failure case: Null userId or empty role throws FormatException',
        () {
      final invalidJsonNullId = <String, dynamic>{
        'token': 'valid-token',
        'userId': null,
        'fullName': 'Kasun Perera',
        'role': 'MaintenanceWorker',
      };

      final invalidJsonEmptyRole = <String, dynamic>{
        'token': 'valid-token',
        'userId': 42,
        'fullName': 'Kasun Perera',
        'role': '',
      };

      expect(
        () => LoginResponse.fromJson(invalidJsonNullId),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => LoginResponse.fromJson(invalidJsonEmptyRole),
        throwsA(isA<FormatException>()),
      );
    });
  });
}

