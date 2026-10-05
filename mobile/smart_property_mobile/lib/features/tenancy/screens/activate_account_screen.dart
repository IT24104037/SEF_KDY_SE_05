import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../services/tenancy_service.dart';

class ActivateAccountScreen extends StatefulWidget {
  const ActivateAccountScreen({super.key});

  @override
  State<ActivateAccountScreen> createState() => _ActivateAccountScreenState();
}

class _ActivateAccountScreenState extends State<ActivateAccountScreen> {
  final TenancyService _service = TenancyService.instance;

  final _formKey = GlobalKey<FormState>();

  final _mobileController = TextEditingController();

  final _pinController = TextEditingController();

  final _passwordController = TextEditingController();

  final _confirmController = TextEditingController();

  bool _loading = false;
  bool _hidePassword = true;
  bool _hideConfirm = true;

  String? _error;
  String? _success;

  @override
  void dispose() {
    _mobileController.dispose();
    _pinController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _activate() async {
    FocusScope.of(context).unfocus();

    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });

    try {
      final result = await _service.activateTenant(
        mobileNumber: _mobileController.text,
        pin: _pinController.text,
        password: _passwordController.text,
        confirmPassword: _confirmController.text,
      );

      if (!mounted) return;

      setState(() {
        _success =
            result['message']?.toString() ??
            'Tenant account activated successfully.';

        _mobileController.clear();
        _pinController.clear();
        _passwordController.clear();
        _confirmController.clear();
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: AppColors.surface,
        title: const Text('Activate Tenant Account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 430),
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Activate Tenant Account',
                      style: TextStyle(
                        color: AppColors.heading,
                        fontSize: 23,
                        fontWeight: FontWeight.w700,
                      ),
                    ),

                    const SizedBox(height: 8),

                    const Text(
                      'Enter the one-time PIN provided by your property owner.',
                      style: TextStyle(
                        color: AppColors.secondaryText,
                        height: 1.5,
                      ),
                    ),

                    const SizedBox(height: 22),

                    TextFormField(
                      controller: _mobileController,
                      keyboardType: TextInputType.phone,
                      maxLength: 10,
                      decoration: const InputDecoration(
                        labelText: 'Mobile Number',
                      ),
                      validator: (value) {
                        if (!RegExp(r'^\d{10}$')
                            .hasMatch(value?.trim() ?? '')) {
                          return 'Enter exactly 10 digits.';
                        }

                        return null;
                      },
                    ),

                    const SizedBox(height: 12),

                    TextFormField(
                      controller: _pinController,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      decoration: const InputDecoration(
                        labelText: 'Activation PIN',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Activation PIN is required.';
                        }

                        return null;
                      },
                    ),

                    const SizedBox(height: 12),

                    TextFormField(
                      controller: _passwordController,
                      obscureText: _hidePassword,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        suffixIcon: IconButton(
                          onPressed: () {
                            setState(() {
                              _hidePassword = !_hidePassword;
                            });
                          },
                          icon: Icon(
                            _hidePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.length < 8) {
                          return 'Password must be at least 8 characters.';
                        }

                        return null;
                      },
                    ),

                    const SizedBox(height: 12),

                    TextFormField(
                      controller: _confirmController,
                      obscureText: _hideConfirm,
                      decoration: InputDecoration(
                        labelText: 'Confirm Password',
                        suffixIcon: IconButton(
                          onPressed: () {
                            setState(() {
                              _hideConfirm = !_hideConfirm;
                            });
                          },
                          icon: Icon(
                            _hideConfirm
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                        ),
                      ),
                      validator: (value) {
                        if (value != _passwordController.text) {
                          return 'Passwords do not match.';
                        }

                        return null;
                      },
                    ),

                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      _message(_error!, true),
                    ],

                    if (_success != null) ...[
                      const SizedBox(height: 14),
                      _message(_success!, false),
                    ],

                    const SizedBox(height: 18),

                    ElevatedButton(
                      onPressed: _loading ? null : _activate,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.tenantAccent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: Text(
                        _loading ? 'Activating...' : 'Activate Account',
                      ),
                    ),

                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pushNamedAndRemoveUntil(
                          AppRoutes.login,
                          (_) => false,
                        );
                      },
                      child: const Text('Back to Login'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _message(String text, bool error) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: error ? AppColors.errorBackground : AppColors.successBackground,
        border: Border.all(
          color: error ? AppColors.errorBorder : AppColors.successBorder,
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(color: error ? AppColors.error : AppColors.success),
      ),
    );
  }
}
