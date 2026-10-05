import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/widgets/managed_records_screen.dart';
import '../../../core/widgets/mobile_forms.dart';
import 'owner_dashboard_screen.dart';

class OwnerWorkOrdersScreen extends StatelessWidget {
  const OwnerWorkOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) => ManagedRecordsScreen(
    title: 'Work Orders',
    path: '/api/work-orders',
    itemsKey: 'workOrders',
    currentRoute: AppRoutes.ownerWorkOrders,
    menuItems: OwnerDashboardScreen.menuItems,
    showSearch: false,
    showSort: false,
    statuses: const {
      'Assigned': 'Assigned',
      'InProgress': 'In Progress',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled',
    },
    sorts: const {'createdAt': 'Created'},
    card: (c, o, archived, busy, run) => MobileInfoCard(
      'Work Order #${o['id']}',
      {
        'Request': o['maintenanceRequestId'],
        'Description': o['description'],
        'Status': o['status'],
        'Worker': o['workerName'],
        'Property': o['propertyName'],
        'Unit': o['unitLabel'],
        'Scheduled': mobileDate(o['scheduledDate'], schedule: true),
      },
      actions: [
        TextButton(
          onPressed: busy
              ? null
              : () => run(() async {
                  await Navigator.pushNamed(c, '/owner/work-orders/${o['id']}');
                }),
          child: const Text('View Details'),
        ),
      ],
    ),
  );
}
