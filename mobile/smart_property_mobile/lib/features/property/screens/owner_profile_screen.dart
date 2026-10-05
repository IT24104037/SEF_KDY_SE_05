import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/property_service.dart';
import '../widgets/owner_ai_widgets.dart';
import 'owner_dashboard_screen.dart';

class OwnerProfileScreen extends StatefulWidget {
  const OwnerProfileScreen({super.key});

  @override
  State<OwnerProfileScreen> createState() => _OwnerProfileScreenState();
}

class _OwnerProfileScreenState extends State<OwnerProfileScreen> {
  final PropertyService _service = PropertyService.instance;

  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  final TextEditingController _nameController = TextEditingController();

  final TextEditingController _emailController = TextEditingController();

  final TextEditingController _mobileController = TextEditingController();

  Map<String, dynamic>? _profile;
  Map<String, dynamic>? _changeRequest;

  bool _loading = true;
  bool _fetching = false;
  bool _saving = false;

  String? _error;
  String? _message;

  bool get _hasPendingRequest => _changeRequest?['status'] == 'Pending';

  bool get _isVerified => _profile?['status'] == 'Verified';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _mobileController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!mounted || _saving || _fetching) {
      return;
    }

    _fetching = true;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Load both independently requested resources
      // at the same time.
      final results = await Future.wait<dynamic>([
        _service.getOwnerProfile(),
        _service.getOwnerProfileChangeRequest(),
      ]);

      final profile = Map<String, dynamic>.from(results[0] as Map);

      final changeRequest = results[1] == null
          ? null
          : Map<String, dynamic>.from(results[1] as Map);

      if (!mounted) return;

      setState(() {
        _profile = profile;
        _changeRequest = changeRequest;

        _nameController.text = ownerAiText(profile['fullName'], '');

        _emailController.text = ownerAiText(profile['email'], '');

        _mobileController.text = ownerAiText(profile['mobile'], '');
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString();
      });
    } finally {
      _fetching = false;

      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _submitChanges() async {
    if (_saving ||
        _loading ||
        _error != null ||
        _hasPendingRequest ||
        !_isVerified) {
      return;
    }

    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    final fullName = _nameController.text.trim();
    final email = _emailController.text.trim();
    final mobile = _mobileController.text.trim();

    final currentName = ownerAiText(_profile?['fullName'], '');

    final currentEmail = ownerAiText(_profile?['email'], '');

    final currentMobile = ownerAiText(_profile?['mobile'], '');

    if (fullName == currentName &&
        email == currentEmail &&
        mobile == currentMobile) {
      setState(() {
        _message = 'Please change at least one profile field.';
      });
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Submit Profile Changes?'),
        content: Text(
          'Name: $fullName\n'
          'Email: $email\n'
          'Mobile: $mobile\n\n'
          'Your current profile stays active until '
          'an admin approves these changes.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Submit Request'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) {
      return;
    }

    setState(() {
      _saving = true;
      _message = null;
    });

    try {
      final changeRequest = await _service.submitOwnerProfileChange(
        fullName: fullName,
        email: email,
        mobile: mobile,
      );

      if (!mounted) return;

      setState(() {
        _changeRequest = changeRequest;
        _message =
            'Profile change request submitted. '
            'Your details will change after admin approval.';
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _message = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }
  }

  Widget _currentProfileCard() {
    return OwnerAiCard(
      title: 'Current Profile',
      children: [
        OwnerAiLine('Full Name', _profile?['fullName']),
        OwnerAiLine('Email', _profile?['email']),
        OwnerAiLine('Mobile', _profile?['mobile']),
        OwnerAiLine('Verification Status', _profile?['status']),
        if (_profile?['verifiedAt'] != null)
          OwnerAiLine('Verified At', ownerAiDate(_profile?['verifiedAt'])),
        if (_profile?['rejectionReason'] != null)
          OwnerAiLine(
            'Verification Rejection Reason',
            _profile?['rejectionReason'],
          ),
      ],
    );
  }

  Widget _changeRequestCard() {
    final request = _changeRequest;

    if (request == null) {
      return const SizedBox.shrink();
    }

    return OwnerAiCard(
      title: 'Latest Profile Change Request',
      children: [
        OwnerAiLine('Status', request['status']),
        OwnerAiLine('Requested Name', request['requestedFullName']),
        OwnerAiLine('Requested Email', request['requestedEmail']),
        OwnerAiLine('Requested Mobile', request['requestedMobile']),
        OwnerAiLine('Submitted', ownerAiDate(request['createdAt'])),
        if (request['reviewedAt'] != null)
          OwnerAiLine('Reviewed', ownerAiDate(request['reviewedAt'])),
        if (request['rejectionReason'] != null)
          OwnerAiLine('Rejection Reason', request['rejectionReason']),
      ],
    );
  }

  Widget _editProfileCard() {
    if (_hasPendingRequest) {
      return const OwnerAiCard(
        title: 'Awaiting Admin Review',
        children: [
          Text(
            'You already have a pending profile change '
            'request. Refresh this page after the admin '
            'reviews it.',
          ),
        ],
      );
    }

    if (!_isVerified) {
      return const OwnerAiCard(
        title: 'Profile Changes',
        children: [
          Text(
            'Only verified owners can submit '
            'profile change requests.',
          ),
        ],
      );
    }

    return OwnerAiCard(
      title: 'Request Profile Changes',
      children: [
        const Text(
          'Changes require admin approval.',
          style: TextStyle(color: AppColors.secondaryText),
        ),
        const SizedBox(height: 16),
        Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _nameController,
                enabled: !_saving,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Enter your full name.';
                  }

                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                enabled: !_saving,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                validator: (value) {
                  final email = value?.trim() ?? '';

                  final valid = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
                      .hasMatch(email);

                  if (!valid) {
                    return 'Enter a valid email address.';
                  }

                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _mobileController,
                enabled: !_saving,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Mobile',
                  helperText: 'Exactly 10 digits',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
                validator: (value) {
                  final mobile = value?.trim() ?? '';

                  if (!RegExp(r'^\d{10}$').hasMatch(mobile)) {
                    return 'Enter exactly 10 digits.';
                  }

                  return null;
                },
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _saving ? null : _submitChanges,
                  icon: const Icon(Icons.send_outlined),
                  label: Text(
                    _saving ? 'Submitting...' : 'Submit Change Request',
                  ),
                ),
              ),
              if (_saving)
                const Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: LinearProgressIndicator(),
                ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_saving,
      child: RoleScaffold(
        title: 'Owner Profile',
        roleLabel: 'Owner',
        expectedRole: 'PropertyOwner',
        accentColor: AppColors.ownerAccent,
        menuItems: OwnerDashboardScreen.menuItems,
        currentRoute: AppRoutes.ownerProfile,
        showBackButton: true,
        child: RefreshIndicator(
          color: AppColors.ownerAccent,
          onRefresh: _load,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Owner Profile',
                      style: TextStyle(
                        color: AppColors.heading,
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Refresh Profile',
                    onPressed: _loading || _saving ? null : _load,
                    icon: const Icon(
                      Icons.refresh,
                      color: AppColors.ownerAccent,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              if (_message != null)
                OwnerAiCard(
                  title: 'Profile Update',
                  children: [Text(_message!)],
                ),

              if (_loading)
                const Padding(
                  padding: EdgeInsets.all(35),
                  child: Center(
                    child: CircularProgressIndicator(
                      color: AppColors.ownerAccent,
                    ),
                  ),
                )
              else if (_error != null)
                OwnerAiError(message: _error!, onRetry: _load)
              else ...[
                _currentProfileCard(),
                _changeRequestCard(),
                _editProfileCard(),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
