import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_property_mobile/features/auth/screens/login_screen.dart';

void main() {
  group('TC-MOB-01: Login Form Validation & Input Handling', () {
    testWidgets('Submitting empty form triggers required field validations',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginScreen(),
        ),
      );

      // Verify initial UI is rendered
      expect(find.text('Login'), findsOneWidget);
      expect(find.text('Email or mobile is required.'), findsNothing);
      expect(find.text('Password is required.'), findsNothing);

      // Tap Login button without entering any input
      await tester.tap(find.text('Login'));
      await tester.pumpAndSettle();

      // Assert validation messages appear
      expect(find.text('Email or mobile is required.'), findsOneWidget);
      expect(find.text('Password is required.'), findsOneWidget);
    });

    testWidgets('Entering email only keeps password validation active',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginScreen(),
        ),
      );

      // Enter only email
      await tester.enterText(
        find.byType(TextFormField).first,
        'test@smartproperty.com',
      );

      // Tap Login
      await tester.tap(find.text('Login'));
      await tester.pumpAndSettle();

      // Email error is resolved, password error remains
      expect(find.text('Email or mobile is required.'), findsNothing);
      expect(find.text('Password is required.'), findsOneWidget);
    });

    testWidgets('Password visibility toggle updates obscureText property',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginScreen(),
        ),
      );

      // Password field should initially be obscured
      final passwordFieldInitial =
          tester.widget<EditableText>(find.byType(EditableText).last);
      expect(passwordFieldInitial.obscureText, isTrue);

      // Tap the show/hide password toggle button
      final toggleButton = find.byTooltip('Show password');
      expect(toggleButton, findsOneWidget);
      await tester.tap(toggleButton);
      await tester.pumpAndSettle();

      // Password field should now not be obscured
      final passwordFieldToggled =
          tester.widget<EditableText>(find.byType(EditableText).last);
      expect(passwordFieldToggled.obscureText, isFalse);
    });
  });
}

