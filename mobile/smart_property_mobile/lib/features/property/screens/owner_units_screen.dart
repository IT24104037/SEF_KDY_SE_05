import 'package:flutter/material.dart';

import '../../../core/network/mobile_api.dart';
import '../../../core/widgets/managed_records_screen.dart';
import '../../../core/widgets/mobile_forms.dart';
import '../../tenancy/screens/owner_add_tenant_screen.dart';
import 'owner_dashboard_screen.dart';

class OwnerUnitsScreen extends StatelessWidget {
  const OwnerUnitsScreen({super.key, required this.propertyId});

  final int propertyId;

  String get _path => '/api/properties/$propertyId/units';

  Future<void> _edit(BuildContext c, [Json? unit]) async {
    await mobileForm(
      c,
      unit == null ? 'Add Unit' : 'Edit Unit',
      [
        MobileField(
          'unitLabel',
          'Unit label',
          isRequired: true,
          value: unit?['unitLabel'],
        ),
        MobileField(
          'description',
          'Description',
          lines: 3,
          value: unit?['description'],
        ),
      ],
      (body) async {
        await MobileApi.request(
          unit == null ? _path : '$_path/${unit['id']}',
          method: unit == null ? 'POST' : 'PUT',
          body: body,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) => ManagedRecordsScreen(
    title: 'Units',
    path: _path,
    archivedPath: '$_path/archived',
    currentRoute: '/owner/properties/$propertyId/units',
    menuItems: OwnerDashboardScreen.menuItems,
    statuses: const {'Occupied': 'Occupied', 'Vacant': 'Vacant'},
    sorts: const {
      'label': 'Label',
      'status': 'Occupancy',
      'createdAt': 'Created',
    },
    toolbar: (c, busy, run) => [
      FilledButton(
        onPressed: busy ? null : () => run(() => _edit(c)),
        child: const Text('Add Unit'),
      ),
      TextButton(
        onPressed: busy
            ? null
            : () => run(() async {
                await mobileForm(
                  c,
                  'Create Multiple Units',
                  const [
                    MobileField(
                      'count',
                      'Number of units',
                      isRequired: true,
                      kind: 'integer',
                    ),
                    MobileField('prefix', 'Label prefix', isRequired: true),
                  ],
                  (data) async {
                    final count = data['count'] as int;
                    if (count < 1) {
                      throw Exception('Enter at least one unit.');
                    }

                    await MobileApi.request(
                      '$_path/bulk',
                      method: 'POST',
                      body: {
                        'units': [
                          for (var i = 1; i <= count; i++)
                            {
                              'unitLabel': '${data['prefix']}$i',
                              'description': null,
                            },
                        ],
                      },
                    );
                  },
                );
              }),
        child: const Text('Bulk Create'),
      ),
    ],
    card: (c, unit, archived, busy, run) => MobileInfoCard(
      'Unit ${unit['unitLabel']}',
      {
        'Description': unit['description'],
        'Occupancy': unit['occupancyStatus'],
        'Tenant': unit['currentTenantName'],
        'Archived': archived ? 'Yes' : 'No',
      },
      actions: [
        TextButton(
          onPressed: busy
              ? null
              : () => run(() async {
                  final saved = await MobileApi.saveUnitHistory(
                    propertyId,
                    int.parse('${unit['id']}'),
                    '${unit['unitLabel']}',
                  );

                  if (saved && c.mounted) {
                    ScaffoldMessenger.of(c).showSnackBar(
                      const SnackBar(content: Text('Tenancy history saved.')),
                    );
                  }
                }),
          child: const Text('Download History'),
        ),

        if (unit['currentTenantId'] != null)
          TextButton(
            onPressed: busy
                ? null
                : () => run(() async {
                    await Navigator.pushNamed(
                      c,
                      '/owner/tenants/${unit['currentTenantId']}',
                    );
                  }),
            child: const Text('View Tenant'),
          ),

        if (!archived) ...[
          TextButton(
            onPressed: busy ? null : () => run(() => _edit(c, unit)),
            child: const Text('Edit'),
          ),

          if (unit['activeTenancyId'] != null)
            TextButton(
              onPressed: busy
                  ? null
                  : () => run(() async {
                      if (await mobileConfirm(
                        c,
                        'End this tenancy and make the unit vacant?',
                      )) {
                        await MobileApi.request(
                          '/api/tenancies/'
                          '${unit['activeTenancyId']}/end',
                          method: 'PUT',
                        );
                      }
                    }),
              child: const Text('End Tenancy'),
            ),

          if (unit['occupancyStatus'] == 'Vacant') ...[
            TextButton(
              onPressed: busy
                  ? null
                  : () => run(() async {
                      await Navigator.push(
                        c,
                        MaterialPageRoute(
                          builder: (_) => OwnerAddTenantScreen(
                            initialPropertyId: propertyId,
                            initialUnitId: int.parse('${unit['id']}'),
                          ),
                        ),
                      );
                    }),
              child: const Text('Add Tenant'),
            ),
            TextButton(
              onPressed: busy
                  ? null
                  : () => run(() async {
                      if (await mobileConfirm(c, 'Archive this unit?')) {
                        await MobileApi.request(
                          '$_path/${unit['id']}',
                          method: 'DELETE',
                        );
                      }
                    }),
              child: const Text('Archive'),
            ),
          ],
        ] else ...[
          TextButton(
            onPressed: busy
                ? null
                : () => run(() async {
                    await MobileApi.request(
                      '$_path/${unit['id']}/restore',
                      method: 'PUT',
                    );
                  }),
            child: const Text('Restore'),
          ),
          TextButton(
            onPressed: busy
                ? null
                : () => run(() async {
                    if (await mobileConfirm(
                      c,
                      'Remove this archived unit from the lists? '
                      'Historical records will be preserved.',
                    )) {
                      await MobileApi.request(
                        '$_path/${unit['id']}/soft-delete',
                        method: 'DELETE',
                      );
                    }
                  }),
            child: const Text('Delete'),
          ),
        ],
      ],
    ),
  );
}
