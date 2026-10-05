import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/network/mobile_api.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/mobile_forms.dart';
import '../../../core/widgets/role_scaffold.dart';
import 'owner_dashboard_screen.dart';
import 'owner_recommendation_screen.dart';

class OwnerAiWorkflowScreen extends StatefulWidget {
  const OwnerAiWorkflowScreen({super.key, this.initialWorkflowId});

  final int? initialWorkflowId;

  @override
  State<OwnerAiWorkflowScreen> createState() => _OwnerAiWorkflowScreenState();
}

class _OwnerAiWorkflowScreenState extends State<OwnerAiWorkflowScreen> {
  final _id = TextEditingController();

  String _type = 'request';
  Json? _workflow;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();

    if (widget.initialWorkflowId != null) {
      _type = 'workflow';
      _id.text = '${widget.initialWorkflowId}';
      _lookup();
    }
  }

  @override
  void dispose() {
    _id.dispose();
    super.dispose();
  }

  Future<void> _lookup() async {
    if (_busy) return;

    final id = int.tryParse(_id.text.trim());

    if (id == null || id < 1 || id > 2147483647) {
      setState(() => _error = 'Enter a valid positive ID.');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
      _workflow = null;
    });

    try {
      final data = MobileApi.map(
        await MobileApi.request(
          _type == 'request'
              ? '/api/agent-workflows/request/$id'
              : '/api/agent-workflows/$id',
        ),
      );

      if (mounted) setState(() => _workflow = data);
    } catch (e) {
      if (mounted) setState(() => _error = mobileError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => RoleScaffold(
    title: 'AI Workflow Search',
    roleLabel: 'Owner',
    expectedRole: 'PropertyOwner',
    accentColor: AppColors.ownerAccent,
    menuItems: OwnerDashboardScreen.menuItems,
    currentRoute: AppRoutes.ownerAiWorkflow,
    showBackButton: true,
    child: ListView(
      padding: const EdgeInsets.all(20),
      children: [
        DropdownButtonFormField<String>(
          initialValue: _type,
          decoration: const InputDecoration(labelText: 'Search by'),
          items: const [
            DropdownMenuItem(
              value: 'request',
              child: Text('Maintenance Request ID'),
            ),
            DropdownMenuItem(value: 'workflow', child: Text('Workflow ID')),
          ],
          onChanged: _busy
              ? null
              : (v) => setState(() {
                  _type = v!;
                  _workflow = null;
                  _error = null;
                }),
        ),
        TextField(
          controller: _id,
          enabled: !_busy,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'ID'),
          onSubmitted: (_) => _lookup(),
        ),
        FilledButton(
          onPressed: _busy ? null : _lookup,
          child: Text(_busy ? 'Searching...' : 'Lookup Workflow'),
        ),
        if (_error != null)
          Text(_error!, style: const TextStyle(color: AppColors.error)),

        if (_workflow != null)
          MobileInfoCard(
            'Workflow #${_workflow!['id']}',
            {
              'Request': _workflow!['maintenanceRequestId'],
              'Status': _workflow!['status'],
              'Current step': _workflow!['currentStep'],
              'Approval status': _workflow!['approvalStatus'],
            },
            actions: [
              TextButton(
                onPressed: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => OwnerRecommendationScreen(
                        requestId: int.parse(
                          '${_workflow!['maintenanceRequestId']}',
                        ),
                        workflowId: int.parse('${_workflow!['id']}'),
                      ),
                    ),
                  );

                  if (mounted) await _lookup();
                },
                child: const Text('View Workflow Details'),
              ),
            ],
          ),
      ],
    ),
  );
}
