import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/admin_service.dart';
import 'admin_home_screen.dart';

String _aiText(dynamic value, [String fallback = '—']) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? fallback : text;
}

String _aiLabel(String value) {
  return value.replaceAllMapped(
    RegExp(r'([a-z])([A-Z])'),
    (match) => '${match[1]} ${match[2]}',
  );
}

String _aiError(Object error) {
  return error.toString().replaceFirst(RegExp(r'^Exception:\s*'), '');
}

String _aiDate(dynamic value) {
  final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();

  if (date == null) return '—';

  String two(int number) => number.toString().padLeft(2, '0');

  return '${two(date.day)}/${two(date.month)}/${date.year} '
      '${two(date.hour)}:${two(date.minute)}';
}

Widget _aiLine(String label, dynamic value) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppColors.secondaryText, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Text(_aiText(value)),
      ],
    ),
  );
}

Widget _aiCard(String title, List<Widget> children) {
  return Container(
    margin: const EdgeInsets.only(bottom: 16),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: AppColors.border),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: AppColors.heading,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        ...children,
      ],
    ),
  );
}

class AdminAiMonitoringScreen extends StatefulWidget {
  const AdminAiMonitoringScreen({super.key});

  @override
  State<AdminAiMonitoringScreen> createState() =>
      _AdminAiMonitoringScreenState();
}

class _AdminAiMonitoringScreenState extends State<AdminAiMonitoringScreen> {
  final _service = AdminService.instance;
  final _formKey = GlobalKey<FormState>();
  final _idController = TextEditingController();

  String _searchType = 'request';
  String? _error;

  Map<String, dynamic>? _workflow;

  bool _loading = false;
  bool _opening = false;
  bool _notFound = false;

  bool get _busy => _loading || _opening;

  @override
  void dispose() {
    _idController.dispose();
    super.dispose();
  }

  Future<void> _lookup() async {
    if (_busy || !(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    final id = int.parse(_idController.text.trim());

    FocusScope.of(context).unfocus();

    setState(() {
      _loading = true;
      _error = null;
      _workflow = null;
      _notFound = false;
    });

    try {
      final workflow = _searchType == 'request'
          ? await _service.getMaintenanceWorkflow(id)
          : await _service.getWorkflowById(id);

      if (!mounted) return;

      setState(() {
        _workflow = workflow;
        _notFound = workflow == null;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() => _error = _aiError(error));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _openDetails() async {
    final workflow = _workflow;

    if (_busy || workflow == null) return;

    final id = int.tryParse('${workflow['id']}');

    if (id == null || id <= 0) return;

    setState(() => _opening = true);

    try {
      await Navigator.of(context).push<void>(
        MaterialPageRoute(
          builder: (_) =>
              AdminAiWorkflowDetailsScreen(initialWorkflow: workflow),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _opening = false);
      }
    }

    if (mounted) {
      await _lookup();
    }
  }

  @override
  Widget build(BuildContext context) {
    final workflow = _workflow;

    return RoleScaffold(
      title: 'AI Monitoring',
      roleLabel: 'Admin',
      expectedRole: 'Admin',
      accentColor: AppColors.adminAccent,
      menuItems: AdminHomeScreen.menuItems,
      currentRoute: AppRoutes.adminAiMonitoring,
      showBackButton: true,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Find an AI workflow using its Maintenance '
            'Request ID or Workflow ID.',
            style: TextStyle(color: AppColors.secondaryText),
          ),
          const SizedBox(height: 16),
          _aiCard('Workflow Search', [
            Form(
              key: _formKey,
              child: Column(
                children: [
                  InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Search by',
                      border: OutlineInputBorder(),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _searchType,
                        isExpanded: true,
                        isDense: true,
                        items: const [
                          DropdownMenuItem(
                            value: 'request',
                            child: Text('Maintenance Request ID'),
                          ),
                          DropdownMenuItem(
                            value: 'workflow',
                            child: Text('Workflow ID'),
                          ),
                        ],
                        onChanged: _busy
                            ? null
                            : (value) {
                                if (value == null) return;

                                setState(() {
                                  _searchType = value;
                                  _workflow = null;
                                  _notFound = false;
                                  _error = null;
                                });
                              },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _idController,
                    enabled: !_busy,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.search,
                    onFieldSubmitted: (_) => _lookup(),
                    decoration: InputDecoration(
                      labelText: _searchType == 'request'
                          ? 'Maintenance Request ID'
                          : 'Workflow ID',
                      border: const OutlineInputBorder(),
                    ),
                    validator: (value) {
                      final id = int.tryParse(value?.trim() ?? '');

                      if (id == null || id <= 0 || id > 2147483647) {
                        return 'Enter a valid positive ID.';
                      }

                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _busy ? null : _lookup,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.adminAccent,
                        foregroundColor: Colors.white,
                      ),
                      icon: const Icon(Icons.search),
                      label: Text(_loading ? 'Searching…' : 'Lookup Workflow'),
                    ),
                  ),
                ],
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: AppColors.error)),
            ],
          ]),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            ),
          if (_notFound && !_loading)
            _aiCard('No Workflow Found', [
              const Text('No AI workflow exists for the selected ID.'),
            ]),
          if (workflow != null)
            _aiCard('Workflow #${_aiText(workflow['id'])}', [
              _aiLine(
                'Maintenance request',
                '#${_aiText(workflow['maintenanceRequestId'])}',
              ),
              _aiLine('Status', _aiLabel(_aiText(workflow['status']))),
              _aiLine('Current step', workflow['currentStep']),
              _aiLine(
                'Approval status',
                _aiLabel(_aiText(workflow['approvalStatus'])),
              ),
              ElevatedButton.icon(
                onPressed: _busy ? null : _openDetails,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.adminAccent,
                  foregroundColor: Colors.white,
                ),
                icon: const Icon(Icons.visibility_outlined),
                label: const Text('View Workflow Details'),
              ),
            ]),
        ],
      ),
    );
  }
}

class AdminAiWorkflowDetailsScreen extends StatefulWidget {
  const AdminAiWorkflowDetailsScreen({
    super.key,
    required this.initialWorkflow,
  });

  final Map<String, dynamic> initialWorkflow;

  @override
  State<AdminAiWorkflowDetailsScreen> createState() =>
      _AdminAiWorkflowDetailsScreenState();
}

class _AdminAiWorkflowDetailsScreenState
    extends State<AdminAiWorkflowDetailsScreen> {
  final _service = AdminService.instance;

  late Map<String, dynamic> _workflow;
  late final int _workflowId;

  Map<String, dynamic>? _recommendation;

  bool _loading = false;
  bool _recommendationLoading = false;

  String? _workflowError;
  String? _recommendationError;

  static const _agentNames = <int, String>{
    1: 'Planner & Coordinator',
    2: 'Maintenance Analysis',
    3: 'Technician Matching & Scheduling',
    4: 'Safety & Compliance Validation',
  };

  bool get _emergencyServicesRequired =>
      _workflow['approvalStatus'] == 'EmergencyServicesRequired' ||
      _workflow['currentStep'] == 'Emergency Services Required';

  @override
  void initState() {
    super.initState();

    _workflow = Map<String, dynamic>.from(widget.initialWorkflow);

    _workflowId = int.parse('${_workflow['id']}');

    _load();
  }

  Future<void> _load() async {
    if (_loading) return;

    final requestId = int.tryParse('${_workflow['maintenanceRequestId']}');

    final skipRecommendation = _emergencyServicesRequired;

    setState(() {
      _loading = true;
      _recommendationLoading = true;

      _workflowError = null;
      _recommendationError = null;
      _recommendation = null;
    });

    try {
      await Future.wait<void>([
        _loadWorkflow(),
        _loadRecommendation(requestId, skip: skipRecommendation),
      ]);
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _loadWorkflow() async {
    try {
      final workflow = await _service.getWorkflowById(_workflowId);

      if (workflow == null) {
        throw Exception('This workflow was not found.');
      }

      if (!mounted) return;

      setState(() => _workflow = workflow);
    } catch (error) {
      if (!mounted) return;

      setState(() => _workflowError = _aiError(error));
    }
  }

  Future<void> _loadRecommendation(int? requestId, {required bool skip}) async {
    try {
      if (skip) return;

      if (requestId == null || requestId <= 0) {
        throw Exception('The workflow has no valid maintenance request ID.');
      }

      final recommendation = await _service.getMaintenanceRecommendation(
        requestId,
      );

      if (!mounted) return;

      setState(() => _recommendation = recommendation);
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _recommendationError = _aiError(error);
      });
    } finally {
      if (mounted) {
        setState(() => _recommendationLoading = false);
      }
    }
  }

  Widget _errorPanel(String error) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(error, style: const TextStyle(color: AppColors.error)),
        TextButton.icon(
          onPressed: _loading ? null : _load,
          icon: const Icon(Icons.refresh),
          label: const Text('Retry'),
        ),
      ],
    );
  }

  Widget _agentCard(int order, Map<String, dynamic>? step) {
    final status = step == null
        ? 'No status recorded'
        : _aiLabel(_aiText(step['status']));

    final error = step?['errorSummary']?.toString().trim() ?? '';

    return _aiCard('Agent $order · ${_agentNames[order]}', [
      _aiLine('Status', status),
      if (error.isNotEmpty)
        Text(error, style: const TextStyle(color: AppColors.error)),
    ]);
  }

  Widget _recommendationCard() {
    if (_recommendationLoading) {
      return _aiCard('Worker Recommendation', [
        const Center(child: CircularProgressIndicator()),
      ]);
    }

    if (_recommendationError != null) {
      return _aiCard('Worker Recommendation', [
        _errorPanel(_recommendationError!),
      ]);
    }

    final recommendation = _recommendation;

    if (recommendation == null) {
      return _aiCard('Worker Recommendation', [
        const Text('No worker recommendation is available.'),
      ]);
    }

    final workerId = int.tryParse('${recommendation['recommendedWorkerId']}');

    final hasWorker =
        recommendation['hasAvailableWorker'] == true &&
        workerId != null &&
        workerId > 0;

    return _aiCard('Worker Recommendation', [
      if (hasWorker) ...[
        _aiLine('Recommended worker', recommendation['recommendedWorker']),
        _aiLine('Skill', recommendation['workerSkill']),
        _aiLine('Service area', recommendation['serviceArea']),
        _aiLine('Hourly rate', recommendation['hourlyRate']),
        _aiLine('Email', recommendation['workerEmail']),
        _aiLine('Mobile', recommendation['workerMobile']),
        _aiLine(
          'Proposed appointment',
          _aiDate(recommendation['proposedTime']),
        ),
      ] else ...[
        Text(
          _aiText(
            recommendation['message'],
            'No worker recommendation is available.',
          ),
        ),
        const SizedBox(height: 12),
      ],
      _aiLine('Validation status', recommendation['validationStatus']),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final stepsByOrder = <int, Map<String, dynamic>>{};

    final rawSteps = _workflow['steps'];

    if (rawSteps is List) {
      for (final rawStep in rawSteps) {
        if (rawStep is! Map) continue;

        final step = Map<String, dynamic>.from(rawStep);
        final order = int.tryParse('${step['stepOrder']}');

        if (order != null && order >= 1 && order <= 4) {
          stepsByOrder[order] = step;
        }
      }
    }

    final outcome = _workflow['finalOutcome']?.toString().trim() ?? '';

    return RoleScaffold(
      title: 'AI Workflow #$_workflowId',
      roleLabel: 'Admin',
      expectedRole: 'Admin',
      accentColor: AppColors.adminAccent,
      menuItems: AdminHomeScreen.menuItems,
      currentRoute: AppRoutes.adminAiMonitoring,
      showBackButton: true,
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: _loading ? null : _load,
                icon: const Icon(Icons.refresh),
                label: const Text('Refresh'),
              ),
            ),
            if (_loading) ...[
              const LinearProgressIndicator(),
              const SizedBox(height: 16),
            ],
            if (_workflowError != null)
              _aiCard('Workflow could not be refreshed', [
                _errorPanel(_workflowError!),
              ]),
            _aiCard('Workflow Information', [
              _aiLine(
                'Maintenance request',
                '#${_aiText(_workflow['maintenanceRequestId'])}',
              ),
              _aiLine(
                'Workflow status',
                _aiLabel(_aiText(_workflow['status'])),
              ),
              _aiLine('Current step', _workflow['currentStep']),
              _aiLine(
                'Approval status',
                _aiLabel(_aiText(_workflow['approvalStatus'])),
              ),
              _aiLine('Created', _aiDate(_workflow['createdAt'])),
              _aiLine('Started', _aiDate(_workflow['startedAt'])),
              _aiLine('Completed', _aiDate(_workflow['completedAt'])),
              _aiLine('Last updated', _aiDate(_workflow['updatedAt'])),
              if (outcome.isNotEmpty) _aiLine('Outcome', outcome),
            ]),
            if (_emergencyServicesRequired)
              _aiCard('Emergency Services Required', [
                Text(
                  outcome.isEmpty
                      ? 'This workflow requires emergency services.'
                      : outcome,
                  style: const TextStyle(color: AppColors.error),
                ),
              ])
            else
              _recommendationCard(),
            for (var order = 1; order <= 4; order++)
              _agentCard(order, stepsByOrder[order]),
          ],
        ),
      ),
    );
  }
}
