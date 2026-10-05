import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/widgets/managed_records_screen.dart';
import '../../../core/widgets/mobile_forms.dart';
import 'owner_dashboard_screen.dart';

class OwnerMaintenanceHistoryScreen extends StatelessWidget {
  const OwnerMaintenanceHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) => ManagedRecordsScreen(
    title: 'Maintenance History',
    path: '/api/maintenance-requests/history-list',
    itemsKey: 'requests',
    currentRoute: AppRoutes.ownerMaintenanceHistory,
    menuItems: OwnerDashboardScreen.menuItems,
    showSort: false,
    sorts: const {'createdAt': 'Created', 'updatedAt': 'Updated'},
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
      'requestType': {'NORMAL': 'Normal', 'EMERGENCY': 'Emergency'},
    },
    card: (c, r, archived, busy, run) => MobileInfoCard('Request #${r['id']}', {
      'Description': r['description'],
      'Property': r['propertyName'],
      'Unit': r['unitName'],
      'Type': r['requestType'],
      'Category': r['categoryName'],
      'Priority': r['priority'],
      'Status': r['status'],
      'Archived': r['isArchived'] == true ? 'Yes' : 'No',
      'Created': mobileDate(r['createdAt']),
      'Updated': mobileDate(r['updatedAt']),
    }),
  );
}
