import 'package:flutter/material.dart';

import '../../../core/network/mobile_api.dart';
import '../../../core/widgets/mobile_forms.dart';

class PropertyEditorScreen extends StatelessWidget {
  const PropertyEditorScreen({super.key, required this.property});

  final Json property;

  @override
  Widget build(BuildContext context) {
    final rejected = property['verificationStatus'] == 'Rejected';
    final documents = MobileApi.list(property['documents']);
    final removed = <int>{};
    final added = <Json>[];

    return MobileFormScreen(
      title: rejected ? 'Edit and Resubmit Property' : 'Edit Property',
      fields: [
        MobileField(
          'name',
          'Property name',
          isRequired: true,
          value: property['name'],
        ),
        MobileField(
          'address',
          'Address',
          isRequired: true,
          value: property['address'],
        ),
        MobileField('city', 'City', value: property['city']),
        MobileField(
          'description',
          'Description',
          value: property['description'],
          lines: 3,
        ),
        MobileField(
          'latitude',
          'Latitude',
          kind: 'number',
          value: property['latitude'],
        ),
        MobileField(
          'longitude',
          'Longitude',
          kind: 'number',
          value: property['longitude'],
        ),
      ],
      extra: (update) => [
        const Text('Verification documents'),

        for (final doc in documents)
          MobileInfoCard(
            mobileText(doc['documentType']),
            {
              'Link': doc['documentUrl'],
              'Selected for removal': removed.contains(doc['id']),
            },
            actions: [
              TextButton(
                onPressed: () async {
                  try {
                    await MobileApi.openDocument('${doc['documentUrl']}');
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(
                        context,
                      ).showSnackBar(SnackBar(content: Text(mobileError(e))));
                    }
                  }
                },
                child: const Text('Open'),
              ),
              if (rejected)
                TextButton(
                  onPressed: () => update(() {
                    final id = int.parse('${doc['id']}');
                    if (!removed.add(id)) removed.remove(id);
                  }),
                  child: Text(
                    removed.contains(doc['id']) ? 'Undo Removal' : 'Remove',
                  ),
                ),
            ],
          ),

        if (rejected) ...[
          for (var i = 0; i < added.length; i++)
            MobileInfoCard(
              'New document',
              {
                'Type': added[i]['documentType'],
                'Link': added[i]['documentUrl'],
              },
              actions: [
                TextButton(
                  onPressed: () => update(() {
                    added.removeAt(i);
                  }),
                  child: const Text('Remove'),
                ),
              ],
            ),
          TextButton(
            onPressed: () async {
              await mobileForm(
                context,
                'Add Verification Document',
                const [
                  MobileField(
                    'documentType',
                    'Document type',
                    isRequired: true,
                  ),
                  MobileField(
                    'documentUrl',
                    'Document link',
                    isRequired: true,
                    kind: 'url',
                  ),
                ],
                (data) async {
                  update(() => added.add(data));
                },
              );
            },
            child: const Text('Add Document'),
          ),
        ],
      ],
      validate: (data) {
        if (rejected &&
            documents.where((d) => !removed.contains(d['id'])).isEmpty &&
            added.isEmpty) {
          return 'Keep or add at least one verification document.';
        }

        final lat = data['latitude'];
        final lon = data['longitude'];

        if (lat is num && (lat < -90 || lat > 90)) {
          return 'Latitude must be between -90 and 90.';
        }
        if (lon is num && (lon < -180 || lon > 180)) {
          return 'Longitude must be between -180 and 180.';
        }

        return null;
      },
      submit: (data) async {
        if (rejected) {
          data['removedDocumentIds'] = removed.toList();
          data['newDocuments'] = added;
        }

        await MobileApi.request(
          '/api/properties/${property['id']}'
          '${rejected ? '/resubmit' : ''}',
          method: 'PUT',
          body: data,
        );
      },
    );
  }
}
