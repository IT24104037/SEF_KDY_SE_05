import 'package:flutter_test/flutter_test.dart';
import 'package:smart_property_mobile/core/widgets/mobile_forms.dart';

void main() {
  group('TC-MOB-06: Mobile Forms Formatting & Utilities', () {
    test('mobileDate() formats valid ISO timestamp into DD/MM/YYYY HH:mm', () {
      final isoString = '2026-10-15T14:30:00.000Z';
      final formatted = mobileDate(isoString, schedule: true);

      expect(formatted, equals('15/10/2026 14:30'));
    });

    test('mobileDate() falls back to "-" when timestamp is null or empty', () {
      expect(mobileDate(null), equals('-'));
      expect(mobileDate(''), equals('-'));
    });

    test('mobileText() returns "-" fallback for null, empty or whitespace strings', () {
      expect(mobileText(null), equals('-'));
      expect(mobileText(''), equals('-'));
      expect(mobileText('   '), equals('-'));
      expect(mobileText('Colombo Heights'), equals('Colombo Heights'));
    });

    test('mobileError() strips "Exception: " prefix for clean UI presentation', () {
      final exception = Exception('Unable to reach server');
      final formatted = mobileError(exception);

      expect(formatted, equals('Unable to reach server'));
    });
  });
}

