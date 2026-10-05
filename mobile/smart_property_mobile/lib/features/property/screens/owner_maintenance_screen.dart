import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/widgets/managed_records_screen.dart';
import '../widgets/owner_maintenance_request_card.dart';
import 'owner_dashboard_screen.dart';

class OwnerMaintenanceScreen extends StatelessWidget {
  const OwnerMaintenanceScreen({super.key, this.emergencyOnly = false});

  final bool emergencyOnly;

  @override
  Widget build(BuildContext context) => ManagedRecordsScreen(
    title: emergencyOnly ? 'Emergency Requests' : 'Maintenance Requests',
    path: '/api/maintenance-requests',
    itemsKey: 'requests',
    currentRoute: emergencyOnly
        ? AppRoutes.ownerEmergency
        : AppRoutes.ownerMaintenance,
    menuItems: OwnerDashboardScreen.menuItems,
    query: {'requestType': emergencyOnly ? 'EMERGENCY' : 'NORMAL'},
    sorts: const {
      'createdAt': 'Created',
      'updatedAt': 'Updated',
      'status': 'Status',
    },
    initialDirection: 'desc',
    statuses: const {
      'Submitted': 'Submitted',
      'Analysing': 'Analysing',
      'NeedsMoreInfo': 'Needs More Information',
      'Emergency': 'Emergency',
      'Assigned': 'Assigned',
      'InProgress': 'In Progress',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled',
    },
    extraFilters: const {
      'priority': {
        'Low': 'Low',
        'Medium': 'Medium',
        'High': 'High',
        'Critical': 'Critical',
      },
    },
    card: (c, request, archived, busy, run) => AbsorbPointer(
      absorbing: busy,
      child: OwnerMaintenanceRequestCard(
        request: request,
        emergency: emergencyOnly,
        onTap: () => run(() async {
          await Navigator.pushNamed(
            c,
            '${AppRoutes.ownerMaintenance}/${request['id']}',
          );
        }),
      ),
    ),
  );
}
