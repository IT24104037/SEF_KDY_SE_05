import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/widgets/managed_records_screen.dart';
import '../../../core/widgets/mobile_forms.dart';
import '../../property/screens/owner_dashboard_screen.dart';

class OwnerTenantsScreen extends StatelessWidget {
  const OwnerTenantsScreen({super.key});

  @override
  Widget build(BuildContext context) => ManagedRecordsScreen(
    title: 'Tenants',
    path: '/api/tenants',
    currentRoute: AppRoutes.ownerTenants,
    menuItems: OwnerDashboardScreen.menuItems,
    statusKey: 'isActive',
    descendingBoolean: true,
    statuses: const {'true': 'Active', 'false': 'Pending Activation'},
    sorts: const {'FullName': 'Name', 'CreatedAt': 'Created'},
    toolbar: (c, busy, run) => [
      FilledButton(
        onPressed: busy
            ? null
            : () => run(() async {
                await Navigator.pushNamed(c, AppRoutes.ownerTenantsAdd);
              }),
        child: const Text('Add Tenant'),
      ),
    ],
    card: (c, t, archived, busy, run) => MobileInfoCard(
      mobileText(t['fullName']),
      {
        'Mobile': t['mobileNumber'],
        'Email': t['email'],
        'Property': t['propertyName'],
        'Unit': t['unitName'],
        'Account': t['isActive'] == true ? 'Active' : 'Pending Activation',
      },
      actions: [
        TextButton(
          onPressed: busy
              ? null
              : () => run(() async {
                  await Navigator.pushNamed(c, '/owner/tenants/${t['id']}');
                }),
          child: const Text('View Details'),
        ),
      ],
    ),
  );
}
