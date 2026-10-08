import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_property_mobile/features/tenancy/screens/activate_account_screen.dart';

void main() {
  group('TC-MOB-04: Tenancy Account Activation Boundary & Form Validation', () {
    testWidgets('Empty submission triggers required validation errors',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: ActivateAccountScreen(),
        ),
      );

      // Verify screen title (appears in AppBar and Body header)
      expect(find.text('Activate Tenant Account'), findsNWidgets(2));

      // Scroll and find the activation button
      final activateButton =
          find.widgetWithText(ElevatedButton, 'Activate Account');
      expect(activateButton, findsOneWidget);

      await tester.ensureVisible(activateButton);
      await tester.tap(activateButton);
      await tester.pumpAndSettle();

      // Verify validation triggers
      expect(find.text('Enter exactly 10 digits.'), findsOneWidget);
      expect(find.text('Activation PIN is required.'), findsOneWidget);
      expect(
        find.text('Password must be at least 8 characters.'),
        findsOneWidget,
      );
    });

    testWidgets(
        'Boundary test: Mobile number with less than 10 digits is rejected',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: ActivateAccountScreen(),
        ),
      );

      final mobileField = find.byType(TextFormField).at(0);
      final activateButton =
          find.widgetWithText(ElevatedButton, 'Activate Account');

      // Enter 9 digits (boundary case: below 10 digits)
      await tester.enterText(mobileField, '071234567');
      await tester.ensureVisible(activateButton);
      await tester.tap(activateButton);
      await tester.pumpAndSettle();

      expect(find.text('Enter exactly 10 digits.'), findsOneWidget);

      // Enter exactly 10 digits (boundary case: valid 10 digits)
      await tester.enterText(mobileField, '0712345678');
      await tester.ensureVisible(activateButton);
      await tester.tap(activateButton);
      await tester.pumpAndSettle();

      // Mobile error should now disappear
      expect(find.text('Enter exactly 10 digits.'), findsNothing);
    });

    testWidgets(
        'Password mismatch: Entering differing confirm password displays error',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: ActivateAccountScreen(),
        ),
      );

      final passwordField = find.byType(TextFormField).at(2);
      final confirmField = find.byType(TextFormField).at(3);
      final activateButton =
          find.widgetWithText(ElevatedButton, 'Activate Account');

      await tester.enterText(passwordField, 'SecurePassword123');
      await tester.enterText(confirmField, 'DifferentPassword456');

      await tester.ensureVisible(activateButton);
      await tester.tap(activateButton);
      await tester.pumpAndSettle();

      expect(find.text('Passwords do not match.'), findsOneWidget);
    });
  });
}

