import 'package:flutter/material.dart';

import '../../../core/network/mobile_api.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/mobile_forms.dart';
import 'account_registration_screen.dart';

class AccountVerificationScreen extends StatefulWidget {
  const AccountVerificationScreen({super.key, required this.owner});

  final bool owner;

  @override
  State<AccountVerificationScreen> createState() =>
      _AccountVerificationScreenState();
}

class _AccountVerificationScreenState extends State<AccountVerificationScreen> {
  Json? _data;
  bool _loading = true;
  String? _error;

  String get _status =>
      mobileText(_data?[widget.owner ? 'status' : 'verificationStatus']);

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
      final session = await SecureStorageService.instance.readSession();
      final role = widget.owner ? 'PropertyOwner' : 'MaintenanceWorker';

      if (session == null || session.role != role) {
        throw Exception('Please log in with your $role account.');
      }

      final data = MobileApi.map(
        await MobileApi.request(
          widget.owner
              ? '/api/owners/me/verification'
              : '/api/workers/me/status',
        ),
      );

      if (mounted) setState(() => _data = data);
    } catch (e) {
      if (mounted) setState(() => _error = mobileError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _open(String link) async {
    try {
      await MobileApi.openDocument(link);
    } catch (e) {
      if (mounted) setState(() => _error = mobileError(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final document = MobileApi.map(_data?['document']);
    final link = widget.owner
        ? document['documentUrl']
        : _data?['proofDocumentUrl'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          widget.owner ? 'Owner Verification' : 'Worker Verification',
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (_loading) const Center(child: CircularProgressIndicator()),

          if (_error != null)
            Text(_error!, style: const TextStyle(color: AppColors.error)),

          if (_data != null)
            MobileInfoCard(
              'Verification status',
              {
                'Name': _data!['fullName'],
                'Status': _status,
                'Review note': _data!['rejectionReason'],
              },
              actions: [
                if (link != null)
                  TextButton(
                    onPressed: () => _open('$link'),
                    child: const Text('Open proof document'),
                  ),

                if (widget.owner && _status == 'Rejected')
                  FilledButton(
                    onPressed: _loading
                        ? null
                        : () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => AccountRegistrationScreen(
                                  owner: true,
                                  reapplication: _data,
                                ),
                              ),
                            );
                            if (mounted) await _load();
                          },
                    child: const Text('Edit and Resubmit'),
                  ),

                if (!widget.owner || _status == 'Verified')
                  TextButton(
                    onPressed: () => Navigator.pushNamedAndRemoveUntil(
                      context,
                      widget.owner ? '/owner/dashboard' : '/worker',
                      (_) => false,
                    ),
                    child: const Text('Go to Dashboard'),
                  ),
              ],
            ),

          TextButton(
            onPressed: _loading ? null : _load,
            child: const Text('Refresh Status'),
          ),

          TextButton(
            onPressed: () async {
              await SecureStorageService.instance.clearSession();
              if (context.mounted) {
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/login',
                  (_) => false,
                );
              }
            },
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }
}
