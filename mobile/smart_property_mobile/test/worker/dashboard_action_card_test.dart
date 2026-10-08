import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_property_mobile/core/theme/app_colors.dart';
import 'package:smart_property_mobile/core/widgets/dashboard_action_card.dart';

void main() {
  group('TC-MOB-05: DashboardActionCard Navigation Component', () {
    testWidgets('Normal case: Renders title, subtitle and iconography',
        (WidgetTester tester) async {
      bool actionTriggered = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: DashboardActionCard(
              title: 'My Jobs',
              subtitle: 'View your assigned maintenance work orders.',
              icon: Icons.work_outline,
              accentColor: AppColors.workerAccent,
              onTap: () {
                actionTriggered = true;
              },
            ),
          ),
        ),
      );

      // Verify text elements
      expect(find.text('My Jobs'), findsOneWidget);
      expect(
        find.text('View your assigned maintenance work orders.'),
        findsOneWidget,
      );

      // Verify icon
      expect(find.byIcon(Icons.work_outline), findsOneWidget);

      // Tap card
      await tester.tap(find.byType(DashboardActionCard));
      expect(actionTriggered, isTrue);
    });

    testWidgets('Interactive state: Tap initiates callback without exception',
        (WidgetTester tester) async {
      int tapCount = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: DashboardActionCard(
              title: 'Availability',
              subtitle: 'Manage your current availability and work schedule.',
              icon: Icons.calendar_month_outlined,
              accentColor: AppColors.workerAccent,
              onTap: () {
                tapCount++;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.text('Availability'));
      await tester.tap(find.text('Availability'));
      expect(tapCount, equals(2));
    });
  });
}

