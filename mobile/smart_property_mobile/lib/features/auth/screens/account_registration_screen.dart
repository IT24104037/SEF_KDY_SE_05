import 'package:flutter/material.dart';

import '../../../core/network/mobile_api.dart';
import '../../../core/widgets/mobile_forms.dart';

class AccountRegistrationScreen extends StatelessWidget {
  const AccountRegistrationScreen({
    super.key,
    required this.owner,
    this.reapplication,
  });

  final bool owner;
  final Json? reapplication;

  static const skills = [
    'Plumbing',
    'Electrical',
    'Structural / Building',
    'Doors / Windows / Locks',
    'Drainage / Water Damage',
    'Other',
  ];

  @override
  Widget build(BuildContext context) {
    final data = reapplication ?? {};
    final property = MobileApi.map(data['property']);
    final document = MobileApi.map(data['document']);
    final selected = <String>{};

    final fields = <MobileField>[
      MobileField(
        'fullName',
        'Full name',
        isRequired: true,
        value: data['fullName'],
      ),
      MobileField(
        'email',
        'Email',
        isRequired: true,
        kind: 'email',
        value: data['email'],
      ),
      MobileField(
        'mobile',
        'Mobile number',
        isRequired: true,
        kind: 'mobile',
        value: data['mobile'],
      ),
      if (reapplication == null) ...[
        const MobileField(
          'password',
          'Password',
          isRequired: true,
          kind: 'password',
        ),
        const MobileField(
          'confirmPassword',
          'Confirm password',
          isRequired: true,
          kind: 'password',
        ),
      ],
      if (owner) ...[
        MobileField(
          'propertyName',
          'Property name',
          isRequired: true,
          value: property['name'],
        ),
        MobileField(
          'propertyAddress',
          'Property address',
          isRequired: true,
          value: property['address'],
        ),
        MobileField('city', 'City', value: property['city']),
        MobileField(
          'propertyDescription',
          'Property description',
          lines: 3,
          value: property['description'],
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
        MobileField(
          'documentType',
          'Document type',
          isRequired: true,
          value: document['documentType'],
        ),
        MobileField(
          'documentUrl',
          'Document link',
          isRequired: true,
          kind: 'url',
          value: document['documentUrl'],
        ),
      ] else ...[
        const MobileField('serviceArea', 'Service area', isRequired: true),
        const MobileField('proofDocumentName', 'Certificate / document title'),
        const MobileField(
          'proofDocumentUrl',
          'Proof document link',
          isRequired: true,
          kind: 'url',
        ),
      ],
    ];

    return MobileFormScreen(
      title: reapplication != null
          ? 'Resubmit Owner Verification'
          : owner
          ? 'Owner Registration'
          : 'Worker Registration',
      fields: fields,
      closeOnSuccess: reapplication != null,
      extra: owner
          ? null
          : (update) => [
              const Text('Select your trades and skills'),
              for (final skill in skills)
                CheckboxListTile(
                  title: Text(skill),
                  value: selected.contains(skill),
                  onChanged: (v) => update(() {
                    if (v == true) {
                      selected.add(skill);
                    } else {
                      selected.remove(skill);
                    }
                  }),
                ),
            ],
      validate: (payload) {
        if (reapplication == null &&
            payload['password'] != payload['confirmPassword']) {
          return 'Passwords do not match.';
        }

        if (!owner && selected.isEmpty) {
          return 'Select at least one trade or skill.';
        }

        final lat = payload['latitude'];
        final lon = payload['longitude'];

        if (lat is num && (lat < -90 || lat > 90)) {
          return 'Latitude must be between -90 and 90.';
        }

        if (lon is num && (lon < -180 || lon > 180)) {
          return 'Longitude must be between -180 and 180.';
        }

        return null;
      },
      submit: (payload) async {
        payload.remove('confirmPassword');

        if (!owner) {
          payload['skills'] = selected.toList();
          payload['proofDocumentName'] ??= 'Trade Proof Document';
        }

        await MobileApi.request(
          owner
              ? reapplication == null
                    ? '/api/owners/register'
                    : '/api/owners/me/reapply'
              : '/api/workers/register',
          method: reapplication == null ? 'POST' : 'PUT',
          body: payload,
          anonymous: reapplication == null,
        );

        if (reapplication != null || !context.mounted) return;

        await showDialog<void>(
          context: context,
          barrierDismissible: false,
          builder: (c) => AlertDialog(
            title: const Text('Application submitted'),
            content: const Text(
              'Your account is waiting for Admin verification.',
            ),
            actions: [
              FilledButton(
                onPressed: () => Navigator.pop(c),
                child: const Text('Go to Login'),
              ),
            ],
          ),
        );

        if (context.mounted) {
          Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
        }
      },
    );
  }
}
