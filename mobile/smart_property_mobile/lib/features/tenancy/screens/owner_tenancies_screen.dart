import 'package:flutter/material.dart';

import '../../../core/network/mobile_api.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/mobile_forms.dart';

class OwnerTenanciesScreen extends StatefulWidget {
  const OwnerTenanciesScreen({
    super.key,
    required this.tenantId,
    this.historyOnly = false,
  });

  final int tenantId;
  final bool historyOnly;

  @override
  State<OwnerTenanciesScreen> createState() => _OwnerTenanciesScreenState();
}

class _OwnerTenanciesScreenState extends State<OwnerTenanciesScreen> {
  Json _tenant = {};
  List<Json> _tenancies = [];

  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        MobileApi.request('/api/tenants/${widget.tenantId}'),
        MobileApi.request('/api/tenancies/tenant/${widget.tenantId}'),
      ]);

      if (mounted) {
        setState(() {
          _tenant = MobileApi.map(results[0]);
          _tenancies = MobileApi.list(results[1]);
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = mobileError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _create() async {
    final created = await mobileForm(
      context,
      'Create Tenancy',
      [
        MobileField(
          'startDate',
          'Start date',
          isRequired: true,
          kind: 'date',
          value: DateTime.now().toIso8601String().substring(0, 10),
        ),
        const MobileField('endDate', 'End date (optional)', kind: 'date'),
      ],
      (data) async {
        await MobileApi.request(
          '/api/tenancies',
          method: 'POST',
          body: {
            'tenantId': widget.tenantId,
            'unitId': _tenant['unitId'],
            ...data,
          },
        );
      },
      validate: (data) {
        if (data['endDate'] != null &&
            DateTime.parse(data['endDate'])
                .isBefore(DateTime.parse(data['startDate']))) {
          return 'End date cannot be before start date.';
        }
        return null;
      },
    );

    if (created && mounted) await _load();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(
      title: Text(
        widget.historyOnly ? 'Tenant Tenancy History' : 'Current Tenancies',
      ),
    ),
    body: RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        children: [
          if (_error != null)
            Text(_error!, style: const TextStyle(color: AppColors.error)),

          if (_loading)
            const Center(child: CircularProgressIndicator())
          else ...[
            MobileInfoCard(mobileText(_tenant['fullName']), {
              'Property': _tenant['propertyName'],
              'Unit': _tenant['unitName'],
            }),

            if (!widget.historyOnly && _tenant['unitId'] != null)
              FilledButton(
                onPressed: _create,
                child: const Text('Create Tenancy'),
              ),

            if (_tenancies.isEmpty) const Text('No tenancies to show.'),

            for (final t in _tenancies)
              MobileInfoCard('Unit ${t['unitName']}', {
                'Start': mobileDate(t['startDate']),
                'End': t['endDate'] == null
                    ? 'Present'
                    : mobileDate(t['endDate']),
                'Status': t['status'],
              }),
          ],
        ],
      ),
    ),
  );
}
