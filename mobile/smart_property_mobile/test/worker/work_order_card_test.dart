import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_property_mobile/features/worker/widgets/work_order_card.dart';

void main() {
  group('TC-MOB-03: WorkOrderCard Widget & State Rendering', () {
    testWidgets('Normal case: Renders maintenance work order details accurately',
        (WidgetTester tester) async {
      bool tapped = false;
      final mockWorkOrder = <String, dynamic>{
        'id': 101,
        'requestTitle': 'Fix Leaking Kitchen Pipe',
        'status': 'Assigned',
        'propertyName': 'Colombo Heights',
        'unitLabel': 'A-402',
        'isEmergency': false,
        'scheduledDate': '2026-10-15T10:30:00Z',
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: WorkOrderCard(
              workOrder: mockWorkOrder,
              onTap: () {
                tapped = true;
              },
            ),
          ),
        ),
      );

      // Verify Title, Property/Unit combination, and Status
      expect(find.text('Fix Leaking Kitchen Pipe'), findsOneWidget);
      expect(find.text('Colombo Heights • Unit A-402'), findsOneWidget);
      expect(find.text('Assigned'), findsOneWidget);

      // Verify tap interaction
      await tester.tap(find.byType(WorkOrderCard));
      expect(tapped, isTrue);
    });

    testWidgets(
        'Emergency flag: Displays EMERGENCY badge when isEmergency is true',
        (WidgetTester tester) async {
      final mockEmergencyOrder = <String, dynamic>{
        'id': 102,
        'requestTitle': 'Electrical Short Circuit',
        'status': 'InProgress',
        'propertyName': 'Grand Residencies',
        'unitLabel': 'B-101',
        'isEmergency': true,
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: WorkOrderCard(
              workOrder: mockEmergencyOrder,
              onTap: () {},
            ),
          ),
        ),
      );

      // EMERGENCY badge in uppercase
      expect(find.text('EMERGENCY'), findsOneWidget);
      expect(find.text('InProgress'), findsOneWidget);
    });

    testWidgets('Fallback handling: Handles null scheduled date gracefully',
        (WidgetTester tester) async {
      final mockUnscheduledOrder = <String, dynamic>{
        'id': 103,
        'requestTitle': 'Garden Maintenance',
        'status': 'Completed',
        'propertyName': 'Seaside Villa',
        'unitLabel': '-',
        'scheduledDate': null,
      };

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: WorkOrderCard(
              workOrder: mockUnscheduledOrder,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('Not scheduled'), findsOneWidget);
      expect(find.text('Completed'), findsOneWidget);
    });
  });
}

