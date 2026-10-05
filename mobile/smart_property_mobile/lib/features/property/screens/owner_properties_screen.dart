import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/network/mobile_api.dart';
import '../../../core/widgets/managed_records_screen.dart';
import '../../../core/widgets/mobile_forms.dart';
import 'owner_dashboard_screen.dart';
import 'property_editor_screen.dart';

class OwnerPropertiesScreen extends StatelessWidget {
  const OwnerPropertiesScreen({super.key});

  @override
  Widget build(BuildContext context) => ManagedRecordsScreen(
    title: 'My Properties',
    path: '/api/properties',
    archivedPath: '/api/properties/archived',
    currentRoute: AppRoutes.ownerProperties,
    menuItems: OwnerDashboardScreen.menuItems,
    showCity: true,
    statuses: const {
      'Approved': 'Approved',
      'UnderReview': 'Under Review',
      'Rejected': 'Rejected',
    },
    sorts: const {
      'name': 'Name',
      'city': 'City',
      'status': 'Status',
      'createdAt': 'Created',
    },
    toolbar: (c, busy, run) => [
      FilledButton(
        onPressed: busy
            ? null
            : () => run(() async {
                await Navigator.pushNamed(c, AppRoutes.ownerPropertiesAdd);
              }),
        child: const Text('Add Property'),
      ),
    ],
    card: (c, p, archived, busy, run) => MobileInfoCard(
      mobileText(p['name']),
      {
        'Address': p['address'],
        'City': p['city'],
        'Description': p['description'],
        'Status': archived ? 'Archived' : p['verificationStatus'],
        'Review note': p['rejectionReason'],
        'Latitude': p['latitude'],
        'Longitude': p['longitude'],
      },
      actions: [
        if (!archived && p['verificationStatus'] == 'Approved') ...[
          TextButton(
            onPressed: busy
                ? null
                : () => run(() async {
                    await Navigator.pushNamed(
                      c,
                      '/owner/properties/${p['id']}/units',
                    );
                  }),
            child: const Text('Manage Units'),
          ),
          TextButton(
            onPressed: busy
                ? null
                : () => run(() async {
                    if (await mobileConfirm(c, 'Archive this property?')) {
                      await MobileApi.request(
                        '/api/properties/${p['id']}',
                        method: 'DELETE',
                      );
                    }
                  }),
            child: const Text('Archive'),
          ),
        ],

        if (!archived &&
            ['Approved', 'Rejected'].contains(p['verificationStatus']))
          TextButton(
            onPressed: busy
                ? null
                : () => run(() async {
                    final full = MobileApi.map(
                      await MobileApi.request('/api/properties/${p['id']}'),
                    );

                    if (c.mounted) {
                      await Navigator.push(
                        c,
                        MaterialPageRoute(
                          builder: (_) => PropertyEditorScreen(property: full),
                        ),
                      );
                    }
                  }),
            child: Text(
              p['verificationStatus'] == 'Rejected'
                  ? 'Edit / Resubmit'
                  : 'Edit',
            ),
          ),

        if (archived)
          FilledButton(
            onPressed: busy
                ? null
                : () => run(() async {
                    await MobileApi.request(
                      '/api/properties/${p['id']}/restore',
                      method: 'PUT',
                    );
                  }),
            child: const Text('Restore'),
          ),
      ],
    ),
  );
}
