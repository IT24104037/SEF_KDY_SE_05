import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../property/services/property_service.dart';

class OwnerTenantDetailsScreen extends StatefulWidget {
  const OwnerTenantDetailsScreen({super.key, required this.tenantId});

  final int tenantId;

  @override
  State<OwnerTenantDetailsScreen> createState() =>
      _OwnerTenantDetailsScreenState();
}

class _OwnerTenantDetailsScreenState extends State<OwnerTenantDetailsScreen> {
  final PropertyService _service = PropertyService.instance;

  Map<String, dynamic>? _tenant;
  List<Map<String, dynamic>> _tenancies = [];

  bool _loading = true;
  bool _editing = false;

  String? _error;

  final _name = TextEditingController();
  final _email = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _service.getTenant(widget.tenantId),
        _service.getTenantTenancies(widget.tenantId),
      ]);

      if (!mounted) return;

      final tenant = results[0] as Map<String, dynamic>;

      final tenancies = results[1] as List<Map<String, dynamic>>;

      _name.text = tenant['fullName']?.toString() ?? '';

      _email.text = tenant['email']?.toString() ?? '';

      setState(() {
        _tenant = tenant;
        _tenancies = tenancies;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _save() async {
    final name = _name.text.trim();
    final email = _email.text.trim();

    if (name.isEmpty ||
        (email.isNotEmpty &&
            !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email))) {
      setState(() => _error = 'Enter a full name and a valid email.');
      return;
    }
    try {
      final updated = await _service.updateTenant(
        id: widget.tenantId,
        fullName: _name.text,
        email: _email.text,
      );

      if (!mounted) return;

      setState(() {
        _tenant = updated;
        _editing = false;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString();
      });
    }
  }

  Future<void> _endTenancy(int id) async {
    final confirmed =
        await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('End Tenancy'),
            content: const Text(
              'Are you sure you want to end this active tenancy?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('End Tenancy'),
              ),
            ],
          ),
        ) ??
        false;

    if (!confirmed) return;

    try {
      await _service.endTenancy(id);

      await _load();
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString();
      });
    }
  }

  String _date(dynamic value) {
    if (value == null) return 'Present';

    final date = DateTime.tryParse(value.toString());

    if (date == null) {
      return value.toString();
    }

    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: const Text('Tenant Details'),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.ownerAccent),
            )
          : _tenant == null
          ? Center(child: Text(_error ?? 'Tenant not found.'))
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      _error!,
                      style: const TextStyle(color: AppColors.error),
                    ),
                  ),

                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_editing) ...[
                        TextField(
                          controller: _name,
                          decoration: const InputDecoration(
                            labelText: 'Full Name',
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _email,
                          decoration: const InputDecoration(labelText: 'Email'),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _save,
                          child: const Text('Save Changes'),
                        ),
                      ] else ...[
                        _row(
                          'Full Name',
                          _tenant!['fullName']?.toString() ?? '-',
                        ),
                        _row(
                          'Mobile',
                          _tenant!['mobileNumber']?.toString() ?? '-',
                        ),
                        _row('Email', _tenant!['email']?.toString() ?? '-'),
                        _row(
                          'Property',
                          _tenant!['propertyName']?.toString() ?? '-',
                        ),
                        _row('Unit', _tenant!['unitName']?.toString() ?? '-'),
                        _row(
                          'Account Status',
                          _tenant!['isActive'] == true
                              ? 'Active'
                              : 'Pending Activation',
                        ),
                        const SizedBox(height: 10),
                        OutlinedButton.icon(
                          onPressed: () {
                            setState(() {
                              _editing = true;
                            });
                          },
                          icon: const Icon(Icons.edit_outlined),
                          label: const Text('Edit Tenant'),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 22),

                Wrap(
                  spacing: 8,
                  children: [
                    TextButton(
                      onPressed: () async {
                        await Navigator.pushNamed(
                          context,
                          '/owner/tenants/${widget.tenantId}/tenancies',
                        );
                        if (mounted) await _load();
                      },
                      child: const Text('Current Tenancies / Create Tenancy'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pushNamed(
                        context,
                        '/owner/tenants/${widget.tenantId}/tenancy-history',
                      ),
                      child: const Text('View Tenancy History'),
                    ),
                  ],
                ),

                const Text(
                  'Tenancy History',
                  style: TextStyle(
                    color: AppColors.heading,
                    fontSize: 19,
                    fontWeight: FontWeight.w700,
                  ),
                ),

                const SizedBox(height: 12),

                if (_tenancies.isEmpty)
                  const Text(
                    'No tenancies to show.',
                    style: TextStyle(color: AppColors.secondaryText),
                  )
                else
                  ..._tenancies.map((tenancy) {
                    final status = tenancy['status']?.toString();

                    final active = status == 'Active';

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(15),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        border: Border.all(color: AppColors.border),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Unit '
                                  '${tenancy['unitName'] ?? '-'}',
                                  style: const TextStyle(
                                    color: AppColors.heading,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                Text(
                                  '${_date(tenancy['startDate'])} — '
                                  '${_date(tenancy['endDate'])}',
                                  style: const TextStyle(
                                    color: AppColors.secondaryText,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (active)
                            TextButton(
                              onPressed: () =>
                                  _endTenancy(tenancy['id'] as int),
                              child: const Text(
                                'End',
                                style: TextStyle(color: AppColors.error),
                              ),
                            ),
                        ],
                      ),
                    );
                  }),
              ],
            ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.secondaryText,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.heading,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
