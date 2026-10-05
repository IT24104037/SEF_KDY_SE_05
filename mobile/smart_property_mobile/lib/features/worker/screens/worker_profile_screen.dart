import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/worker_service.dart';
import 'worker_dashboard_screen.dart';

class WorkerProfileScreen extends StatefulWidget {
  const WorkerProfileScreen({super.key});

  @override
  State<WorkerProfileScreen> createState() => _WorkerProfileScreenState();
}

class _WorkerProfileScreenState extends State<WorkerProfileScreen> {
  final WorkerService _service = WorkerService.instance;

  final TextEditingController _bioController = TextEditingController();

  final TextEditingController _rateController = TextEditingController();

  final TextEditingController _areaController = TextEditingController();

  Map<String, dynamic>? _profile;

  bool _available = true;
  bool _loading = true;
  bool _saving = false;

  String? _error;
  String? _message;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _bioController.dispose();
    _rateController.dispose();
    _areaController.dispose();
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

      _bioController.text = profile['bio']?.toString() ?? '';

      _rateController.text = profile['hourlyRate']?.toString() ?? '';

      _areaController.text = profile['serviceArea']?.toString() ?? '';

      setState(() {
        _profile = profile;
        _available = profile['isAvailable'] == true;
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
    final rateText = _rateController.text.trim();

    final rate = rateText.isEmpty ? null : double.tryParse(rateText);

    if (rateText.isNotEmpty && rate == null) {
      setState(() {
        _error = 'Please enter a valid hourly rate.';
      });
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
      _message = null;
    });

    try {
      final skillsRaw = _profile?['skills'];

      final skills = skillsRaw is List
          ? skillsRaw.map((item) => item.toString()).toList()
          : <String>[];

      final updated = await _service.updateMyProfile(
        bio: _bioController.text.trim(),
        hourlyRate: rate,
        serviceArea: _areaController.text.trim(),
        isAvailable: _available,
        skills: skills,
      );

      if (!mounted) return;

      setState(() {
        _profile = updated;
        _message = 'Profile updated successfully.';
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
      roleLabel: 'Maintenance Worker',
      expectedRole: 'MaintenanceWorker',
      accentColor: AppColors.workerAccent,
      menuItems: WorkerDashboardScreen.menuItems,
      currentRoute: AppRoutes.workerProfile,
      showBackButton: true,

      child: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.workerAccent),
            )
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Text(
                  'My Profile',
                  style: TextStyle(
                    color: AppColors.heading,
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                  ),
                ),

                const SizedBox(height: 18),

                if (_profile != null)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      border: Border.all(color: AppColors.border),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _profile!['fullName']?.toString() ?? '',
                          style: const TextStyle(
                            color: AppColors.heading,
                            fontSize: 19,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _profile!['email']?.toString() ?? '',
                          style: const TextStyle(
                            color: AppColors.secondaryText,
                          ),
                        ),
                        Text(
                          _profile!['mobile']?.toString() ?? '',
                          style: const TextStyle(
                            color: AppColors.secondaryText,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Verification: ${_profile!['verificationStatus'] ?? '-'}',
                          style: const TextStyle(
                            color: AppColors.workerAccent,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 18),

                TextField(
                  controller: _areaController,
                  decoration: const InputDecoration(
                    labelText: 'Service Area',
                    prefixIcon: Icon(Icons.location_on_outlined),
                  ),
                ),

                const SizedBox(height: 14),

                TextField(
                  controller: _rateController,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: const InputDecoration(
                    labelText: 'Hourly Rate',
                    prefixIcon: Icon(Icons.payments_outlined),
                  ),
                ),

                const SizedBox(height: 14),

                TextField(
                  controller: _bioController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'Bio',
                    alignLabelWithHint: true,
                  ),
                ),

                const SizedBox(height: 14),

                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text(
                    'Available for work',
                    style: TextStyle(
                      color: AppColors.heading,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: Text(
                    _available
                        ? 'You can be considered for new assignments.'
                        : 'You are currently marked unavailable.',
                  ),
                  value: _available,
                  activeThumbColor: AppColors.workerAccent,
                  onChanged: (value) {
                    setState(() {
                      _available = value;
                    });
                  },
                ),

                if (_error != null) ...[
                  const SizedBox(height: 10),
                  Text(_error!, style: const TextStyle(color: AppColors.error)),
                ],

                if (_message != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    _message!,
                    style: const TextStyle(color: AppColors.success),
                  ),
                ],

                const SizedBox(height: 18),

                ElevatedButton.icon(
                  onPressed: _saving ? null : _save,
                  icon: const Icon(Icons.save_outlined),
                  label: Text(_saving ? 'Saving...' : 'Save Profile'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.workerAccent,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                  ),
                ),
              ],
            ),
    );
  }
}
