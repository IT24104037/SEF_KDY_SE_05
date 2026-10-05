import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../property/services/property_service.dart';

class OwnerAddTenantScreen extends StatefulWidget {
  const OwnerAddTenantScreen({
    super.key,
    this.initialPropertyId,
    this.initialUnitId,
  });

  final int? initialPropertyId;
  final int? initialUnitId;
  @override
  State<OwnerAddTenantScreen> createState() => _OwnerAddTenantScreenState();
}

class _OwnerAddTenantScreenState extends State<OwnerAddTenantScreen> {
  final PropertyService _service = PropertyService.instance;

  final _formKey = GlobalKey<FormState>();

  final _name = TextEditingController();
  final _mobile = TextEditingController();
  final _email = TextEditingController();

  List<Map<String, dynamic>> _options = [];

  int? _propertyId;
  int? _unitId;

  bool _loading = true;
  bool _saving = false;

  String? _error;

  @override
  void initState() {
    super.initState();
    _propertyId = widget.initialPropertyId;
    _unitId = widget.initialUnitId;
    _loadOptions();
  }

  @override
  void dispose() {
    _name.dispose();
    _mobile.dispose();
    _email.dispose();
    super.dispose();
  }

  Future<void> _loadOptions() async {
    try {
      final options = await _service.getTenantOptions();

      if (!mounted) return;

      setState(() {
        _options = options;
        if (!_options.any((p) => p['id'] == _propertyId)) {
          _propertyId = null;
        }

        if (!_availableUnits.any((u) => u['id'] == _unitId)) {
          _unitId = null;
        }

        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _loading = false;
        _error = error.toString();
      });
    }
  }

  List<Map<String, dynamic>> get _availableUnits {
    if (_propertyId == null) {
      return [];
    }

    final property = _options.firstWhere(
      (item) => item['id'] == _propertyId,
      orElse: () => <String, dynamic>{},
    );

    final units = property['units'];

    if (units is! List) {
      return [];
    }

    return units
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    if (_propertyId == null || _unitId == null) {
      setState(() {
        _error = 'Please select a property and unit.';
      });
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      final result = await _service.createTenant(
        fullName: _name.text,
        mobileNumber: _mobile.text,
        email: _email.text,
        propertyId: _propertyId!,
        unitId: _unitId!,
      );

      if (!mounted) return;

      final pin = result['activationPin']?.toString() ?? '';

      final expires = result['pinExpiresAt']?.toString() ?? '';

      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) {
          return AlertDialog(
            title: const Text('Tenant Created'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Give this one-time activation PIN to the tenant:'),
                const SizedBox(height: 14),
                SelectableText(
                  pin,
                  style: const TextStyle(
                    color: AppColors.ownerAccent,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 4,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Expires: $expires',
                  style: const TextStyle(color: AppColors.secondaryText),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: pin));
                  },
                  icon: const Icon(Icons.copy),
                  label: const Text('Copy PIN'),
                ),
              ],
            ),
            actions: [
              FilledButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Done'),
              ),
            ],
          );
        },
      );

      if (!mounted) return;

      Navigator.pop(context);
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: const Text('Add Tenant'),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.ownerAccent),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _name,
                      decoration: const InputDecoration(labelText: 'Full Name'),
                      validator: (value) =>
                          value == null || value.trim().isEmpty
                          ? 'Full name is required.'
                          : null,
                    ),

                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _mobile,
                      maxLength: 10,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Mobile Number',
                      ),
                      validator: (value) =>
                          RegExp(r'^\d{10}$').hasMatch(value?.trim() ?? '')
                          ? null
                          : 'Enter exactly 10 digits.',
                    ),

                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Email'),
                    ),

                    const SizedBox(height: 14),

                    DropdownButtonFormField<int>(
                      initialValue: _propertyId,
                      decoration: const InputDecoration(labelText: 'Property'),
                      items: _options
                          .map(
                            (property) => DropdownMenuItem<int>(
                              value: property['id'] as int,
                              child: Text(property['name'].toString()),
                            ),
                          )
                          .toList(),
                      onChanged: widget.initialPropertyId != null
                          ? null
                          : (value) {
                              setState(() {
                                _propertyId = value;
                                _unitId = null;
                              });
                            },
                    ),

                    const SizedBox(height: 14),

                    DropdownButtonFormField<int>(
                      initialValue: _unitId,
                      decoration: const InputDecoration(labelText: 'Unit'),
                      items: _availableUnits
                          .map(
                            (unit) => DropdownMenuItem<int>(
                              value: unit['id'] as int,
                              child: Text(unit['unitLabel'].toString()),
                            ),
                          )
                          .toList(),
                      onChanged:
                          _propertyId == null || widget.initialUnitId != null
                          ? null
                          : (value) {
                              setState(() {
                                _unitId = value;
                              });
                            },
                    ),

                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      Text(
                        _error!,
                        style: const TextStyle(color: AppColors.error),
                      ),
                    ],

                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _save,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.ownerAccent,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 15),
                        ),
                        child: Text(_saving ? 'Creating...' : 'Create Tenant'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
