import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/tenancy_service.dart';
import 'tenant_home_screen.dart';

class TenantProfileScreen extends StatefulWidget {
  const TenantProfileScreen({super.key});

  @override
  State<TenantProfileScreen> createState() => _TenantProfileScreenState();
}

class _TenantProfileScreenState extends State<TenantProfileScreen> {
  final TenancyService _service = TenancyService.instance;

  final TextEditingController _mobileController = TextEditingController();

  final TextEditingController _emailController = TextEditingController();

  Map<String, dynamic>? _profile;

  bool _loading = true;
  bool _saving = false;
  bool _editing = false;

  String? _error;
  String? _success;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _mobileController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final profile = await _service.getMyProfile();

      if (!mounted) return;

      _mobileController.text = profile['mobileNumber']?.toString() ?? '';

      _emailController.text = profile['email']?.toString() ?? '';

      setState(() {
        _profile = profile;
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

  bool _validMobile(String value) {
    return RegExp(r'^\d{10}$').hasMatch(value);
  }

  bool _validEmail(String value) {
    if (value.isEmpty) return true;

    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value);
  }

  Future<void> _save() async {
    final mobile = _mobileController.text.trim();

    final email = _emailController.text.trim();

    if (!_validMobile(mobile)) {
      setState(() {
        _error = 'Phone number must contain exactly 10 digits.';
      });
      return;
    }

    if (!_validEmail(email)) {
      setState(() {
        _error = 'Please enter a valid email address.';
      });
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
      _success = null;
    });

    try {
      final profile = await _service.updateMyProfile(
        mobileNumber: mobile,
        email: email,
      );

      if (!mounted) return;

      setState(() {
        _profile = profile;
        _editing = false;
        _success = 'Profile updated successfully.';
      });
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
    return RoleScaffold(
      title: 'Profile',
      roleLabel: 'Tenant',
      expectedRole: 'Tenant',
      accentColor: AppColors.tenantAccent,
      menuItems: TenantHomeScreen.menuItems,
      currentRoute: AppRoutes.tenantProfile,
      showBackButton: true,
      child: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.tenantAccent),
            )
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Tenant Profile',
                        style: TextStyle(
                          color: AppColors.heading,
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    if (!_editing)
                      TextButton.icon(
                        onPressed: () {
                          setState(() {
                            _editing = true;
                            _error = null;
                            _success = null;
                          });
                        },
                        icon: const Icon(Icons.edit_outlined),
                        label: const Text('Edit'),
                      ),
                  ],
                ),

                const SizedBox(height: 16),

                if (_error != null) _message(_error!, true),

                if (_success != null) _message(_success!, false),

                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _readOnlyField(
                        'Full Name',
                        _profile?['fullName']?.toString() ?? '-',
                      ),

                      const SizedBox(height: 16),

                      if (_editing)
                        TextField(
                          controller: _mobileController,
                          keyboardType: TextInputType.phone,
                          maxLength: 10,
                          decoration: const InputDecoration(
                            labelText: 'Phone Number',
                          ),
                        )
                      else
                        _readOnlyField(
                          'Phone Number',
                          _profile?['mobileNumber']?.toString() ?? '-',
                        ),

                      const SizedBox(height: 16),

                      if (_editing)
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Email Address',
                          ),
                        )
                      else
                        _readOnlyField(
                          'Email Address',
                          _profile?['email']?.toString() ?? '-',
                        ),

                      const SizedBox(height: 16),

                      _readOnlyField(
                        'Unit Name',
                        _profile?['unitName']?.toString() ?? '-',
                      ),

                      const SizedBox(height: 16),

                      _readOnlyField(
                        'Property',
                        _profile?['propertyName']?.toString() ?? '-',
                      ),

                      if (_editing) ...[
                        const SizedBox(height: 24),

                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _saving ? null : _save,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.tenantAccent,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: Text(_saving ? 'Updating...' : 'Update'),
                          ),
                        ),

                        const SizedBox(height: 8),

                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: _saving
                                ? null
                                : () {
                                    _mobileController.text =
                                        _profile?['mobileNumber']?.toString() ??
                                        '';

                                    _emailController.text =
                                        _profile?['email']?.toString() ?? '';

                                    setState(() {
                                      _editing = false;
                                      _error = null;
                                    });
                                  },
                            child: const Text('Cancel'),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _readOnlyField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: AppColors.secondaryText,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          value,
          style: const TextStyle(
            color: AppColors.heading,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _message(String message, bool error) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: error ? AppColors.errorBackground : AppColors.successBackground,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: error ? AppColors.errorBorder : AppColors.successBorder,
        ),
      ),
      child: Text(
        message,
        style: TextStyle(color: error ? AppColors.error : AppColors.success),
      ),
    );
  }
}
