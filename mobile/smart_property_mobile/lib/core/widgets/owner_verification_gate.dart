import 'package:flutter/material.dart';

import '../network/mobile_api.dart';
import '../storage/secure_storage_service.dart';
import '../../features/auth/screens/account_verification_screen.dart';

class OwnerVerificationGate extends StatefulWidget {
  const OwnerVerificationGate({super.key, required this.child});

  final Widget child;

  @override
  State<OwnerVerificationGate> createState() => _OwnerVerificationGateState();
}

class _OwnerVerificationGateState extends State<OwnerVerificationGate> {
  bool _loading = true;
  bool _verified = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final session = await SecureStorageService.instance.readSession();

      if (session == null || session.role != 'PropertyOwner') {
        if (mounted) {
          Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
        }
        return;
      }

      final data = MobileApi.map(
        await MobileApi.request('/api/owners/me/verification'),
      );

      if (mounted) {
        setState(() => _verified = data['status'] == 'Verified');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = '$e'.replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error!),
              TextButton(onPressed: _check, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    return _verified
        ? widget.child
        : const AccountVerificationScreen(owner: true);
  }
}
