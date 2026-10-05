import 'package:flutter/material.dart';

import '../../../core/network/mobile_api.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/mobile_forms.dart';
import '../services/worker_service.dart';

class WorkerOverviewCard extends StatefulWidget {
  const WorkerOverviewCard({super.key});

  @override
  State<WorkerOverviewCard> createState() => _WorkerOverviewCardState();
}

class _WorkerOverviewCardState extends State<WorkerOverviewCard> {
  Json _profile = {};
  Json _availability = {};
  List<Json> _orders = [];

  bool _busy = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final results = await Future.wait<dynamic>([
        WorkerService.instance.getMyProfile(),
        WorkerService.instance.getAvailability(),
        WorkerService.instance.getWorkOrders(),
      ]);

      if (mounted) {
        setState(() {
          _profile = MobileApi.map(results[0]);
          _availability = MobileApi.map(results[1]);
          _orders = MobileApi.list(results[2]);
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = mobileError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _toggle() async {
    if (_busy || _profile.isEmpty) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final rate = _profile['hourlyRate'];

      await WorkerService.instance.updateMyProfile(
        bio: _profile['bio']?.toString(),
        hourlyRate: rate is num ? rate.toDouble() : null,
        serviceArea: _profile['serviceArea']?.toString(),
        isAvailable: _profile['isAvailable'] != true,
      );

      if (mounted) await _load();
    } catch (e) {
      if (mounted) setState(() => _error = mobileError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
      if (_error != null)
        Text(_error!, style: const TextStyle(color: AppColors.error)),

      if (_busy)
        const Padding(
          padding: EdgeInsets.all(12),
          child: CircularProgressIndicator(),
        ),

      MobileInfoCard(
        'Worker Overview',
        {
          'Name': _profile['fullName'],
          'Verification': _profile['verificationStatus'],
          'Active jobs': _orders
              .where((o) => ['Assigned', 'InProgress'].contains(o['status']))
              .length,
          'Completed jobs': _orders
              .where((o) => o['status'] == 'Completed')
              .length,
          'Accepting jobs': _profile['isAvailable'] == true ? 'Yes' : 'No',
          'Within an available shift': _availability['freeNow'] == true
              ? 'Yes'
              : 'No',
        },
        actions: [
          FilledButton(
            onPressed: _busy || _profile.isEmpty ? null : _toggle,
            child: Text(
              _profile['isAvailable'] == true ? 'Set Off Duty' : 'Accept Jobs',
            ),
          ),
          TextButton(
            onPressed: _busy ? null : _load,
            child: const Text('Refresh'),
          ),
          TextButton(
            onPressed: () =>
                Navigator.pushNamed(context, '/worker/verification'),
            child: const Text('Verification Status'),
          ),
        ],
      ),
    ],
  );
}
