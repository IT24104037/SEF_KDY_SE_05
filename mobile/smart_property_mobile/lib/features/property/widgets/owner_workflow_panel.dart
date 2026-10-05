import 'package:flutter/material.dart';

import '../../../core/network/mobile_api.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/mobile_forms.dart';

class OwnerWorkflowPanel extends StatefulWidget {
  const OwnerWorkflowPanel({super.key, required this.requestId});

  final int requestId;

  @override
  State<OwnerWorkflowPanel> createState() => _OwnerWorkflowPanelState();
}

class _OwnerWorkflowPanelState extends State<OwnerWorkflowPanel> {
  Json? _workflow;
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
      final data = await MobileApi.request(
        '/api/agent-workflows/request/${widget.requestId}',
        allowNotFound: true,
      );

      if (mounted) {
        setState(() {
          _workflow = data == null ? null : MobileApi.map(data);
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = mobileError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _start() async {
    if (_busy) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final data = await MobileApi.request(
        '/api/agent-workflows/start',
        method: 'POST',
        body: {'maintenanceRequestId': widget.requestId},
      );

      if (mounted) {
        setState(() => _workflow = MobileApi.map(data));
      }
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
      if (_busy) const CircularProgressIndicator(),
      MobileInfoCard(
        'AI Workflow',
        {
          'Workflow': _workflow?['id'],
          'Status': _workflow?['status'],
          'Current step': _workflow?['currentStep'],
        },
        actions: [
          if (!_busy && _error == null && _workflow == null)
            FilledButton(
              onPressed: _start,
              child: const Text('Start Agent 1 Planner'),
            ),

          if (_workflow != null)
            TextButton(
              onPressed: _busy
                  ? null
                  : () async {
                      await Navigator.pushNamed(
                        context,
                        '/owner/ai-workflow/${_workflow!['id']}',
                      );
                      if (mounted) await _load();
                    },
              child: const Text('View Workflow Details'),
            ),

          TextButton(
            onPressed: _busy ? null : _load,
            child: const Text('Refresh Workflow'),
          ),
        ],
      ),
    ],
  );
}
