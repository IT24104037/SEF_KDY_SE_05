import 'package:flutter_test/flutter_test.dart';
import 'package:smart_property_mobile/main.dart';

void main() {
  testWidgets('Smart Property app starts successfully',
      (WidgetTester tester) async {
    await tester.pumpWidget(const SmartPropertyApp());

    expect(
      find.text('Smart Property Maintenance & Rental Operations System'),
      findsOneWidget,
    );
  });
}