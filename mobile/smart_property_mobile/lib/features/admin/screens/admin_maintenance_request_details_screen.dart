import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/admin_service.dart';
import 'admin_home_screen.dart';

class AdminMaintenanceRequestDetailsScreen extends StatefulWidget {
  const AdminMaintenanceRequestDetailsScreen({
    super.key,
    required this.requestId,
    required this.emergency,
    this.initialRequest,
  });

  final int requestId;
  final bool emergency;
  final Map<String, dynamic>? initialRequest;

  @override
  State<AdminMaintenanceRequestDetailsScreen> createState() =>
      _AdminMaintenanceRequestDetailsScreenState();
}

class _AdminMaintenanceRequestDetailsScreenState
    extends State<AdminMaintenanceRequestDetailsScreen> {
  final _service = AdminService.instance;

  Map<String, dynamic>? _request;
  Map<String, dynamic>? _workflow;

  List<Map<String, dynamic>> _history = [];

  bool _fetching = false;
  bool _requestLoading = true;
  bool _workflowLoading = true;
  bool _historyLoading = true;
  bool _workflowLoaded = false;
  bool _starting = false;

  String? _requestError;
  String? _workflowError;
  String? _historyError;

  static const _agentNames = <int, String>{
    1: 'Planner & Coordinator',
    2: 'Maintenance Analysis',
    3: 'Technician Matching & Scheduling',
    4: 'Safety & Compliance Validation',
  };

  @override
  void initState() {
    super.initState();

    final initial = widget.initialRequest;

    if (initial != null) {
      _request = Map<String, dynamic>.from(initial);
    }

    _load();
  }

  String _text(dynamic value, [String fallback = '—']) {
    final text = value?.toString().trim() ?? '';
    return text.isEmpty ? fallback : text;
  }

  String _label(String value) {
    return value.replaceAllMapped(
      RegExp(r'([a-z])([A-Z])'),
      (match) => '${match[1]} ${match[2]}',
    );
  }

  String _errorText(Object error) {
    return error.toString().replaceFirst(RegExp(r'^Exception:\s*'), '');
  }

  String _date(dynamic value) {
    final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();

    if (date == null) return '—';

    String two(int value) => value.toString().padLeft(2, '0');

    return '${two(date.day)}/${two(date.month)}/${date.year} '
        '${two(date.hour)}:${two(date.minute)}';
  }

  Future<void> _load() async {
    if (_fetching || _starting) return;

    setState(() {
      _fetching = true;

      _requestLoading = true;
      _workflowLoading = true;
      _historyLoading = true;
      _workflowLoaded = false;

      _requestError = null;
      _workflowError = null;
      _historyError = null;
    });

    try {
      await Future.wait<void>([
        _loadRequest(),
        _loadWorkflow(),
        _loadHistory(),
      ]);
    } finally {
      if (mounted) {
        setState(() => _fetching = false);
      }
    }
  }

  Future<void> _loadRequest() async {
    try {
      final request = await _service.getMaintenanceRequest(widget.requestId);

      if (!mounted) return;

      setState(() => _request = request);
    } catch (error) {
      if (!mounted) return;

      setState(() => _requestError = _errorText(error));
    } finally {
      if (mounted) {
        setState(() => _requestLoading = false);
      }
    }
  }

  Future<void> _loadWorkflow() async {
    try {
      final workflow = await _service.getMaintenanceWorkflow(widget.requestId);

      if (!mounted) return;

      setState(() {
        _workflow = workflow;
        _workflowLoaded = true;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() => _workflowError = _errorText(error));
    } finally {
      if (mounted) {
        setState(() => _workflowLoading = false);
      }
    }
  }

  Future<void> _loadHistory() async {
    try {
      final history = await _service.getMaintenanceHistory(widget.requestId);

      if (!mounted) return;

      setState(() => _history = history);
    } catch (error) {
      if (!mounted) return;

      setState(() => _historyError = _errorText(error));
    } finally {
      if (mounted) {
        setState(() => _historyLoading = false);
      }
    }
  }

  Future<void> _startWorkflow() async {
    if (_fetching ||
        _starting ||
        !_workflowLoaded ||
        _workflow != null ||
        _request == null ||
        _requestError != null) {
      return;
    }

    setState(() {
      _starting = true;
      _workflowError = null;
    });

    bool succeeded = false;

    try {
      final workflow = await _service.startMaintenanceWorkflow(
        widget.requestId,
      );

      if (!mounted) return;

      setState(() {
        _workflow = workflow;
        _workflowLoaded = true;
      });

      succeeded = true;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Agent 1 workflow started.')),
      );
    } catch (error) {
      if (!mounted) return;

      setState(() => _workflowError = _errorText(error));
    } finally {
      if (mounted) {
        setState(() => _starting = false);
      }
    }

    if (mounted && succeeded) {
      await _load();
    }
  }

  Widget _line(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.secondaryText,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(_text(value)),
        ],
      ),
    );
  }

  Widget _card(String title, List<Widget> children) {
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

  Widget _errorPanel(String error) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(error, style: const TextStyle(color: AppColors.error)),
        TextButton.icon(
          onPressed: _fetching || _starting ? null : _load,
          icon: const Icon(Icons.refresh),
          label: const Text('Retry'),
        ),
      ],
    );
  }

  String? _imageUrl(dynamic value) {
    try {
      final raw = value?.toString().trim() ?? '';

      if (raw.isEmpty) return null;

      final base = ApiConstants.baseUrl.replaceFirst(RegExp(r'/+$'), '');

      final uri = Uri.parse('$base/').resolve(raw);

      if ((uri.scheme != 'http' && uri.scheme != 'https') || uri.host.isEmpty) {
        return null;
      }

      return uri.toString();
    } catch (_) {
      return null;
    }
  }

  void _openImage(String url) {
    Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => Scaffold(
          appBar: AppBar(title: const Text('Request Photo')),
          body: SafeArea(
            child: Center(
              child: InteractiveViewer(
                minScale: 0.5,
                maxScale: 5,
                child: Image.network(
                  url,
                  fit: BoxFit.contain,
                  errorBuilder: (_, _, _) => const Padding(
                    padding: EdgeInsets.all(24),
                    child: Text('Could not load this photo.'),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _photos(Map<String, dynamic> request) {
    final rawImages = request['imageUrls'];

    final images = rawImages is List
        ? rawImages.map(_imageUrl).whereType<String>().toList()
        : <String>[];

    return _card('Photos', [
      if (images.isEmpty) const Text('No photo available.'),
      for (final url in images)
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: InkWell(
            onTap: () => _openImage(url),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                url,
                width: double.infinity,
                height: 180,
                fit: BoxFit.cover,
                cacheWidth: 900,
                loadingBuilder: (context, child, progress) {
                  if (progress == null) return child;

                  return const SizedBox(
                    height: 180,
                    child: Center(child: CircularProgressIndicator()),
                  );
                },
                errorBuilder: (_, _, _) => const SizedBox(
                  height: 100,
                  child: Center(child: Text('Could not load this photo.')),
                ),
              ),
            ),
          ),
        ),
      if (images.isNotEmpty)
        const Text(
          'Tap a photo to open and zoom.',
          style: TextStyle(color: AppColors.secondaryText, fontSize: 12),
        ),
    ]);
  }

  Widget _workflowCard() {
    if (_workflowLoading) {
      return _card('AI Workflow', [
        const Center(child: CircularProgressIndicator()),
      ]);
    }

    if (_workflowError != null) {
      return _card('AI Workflow', [_errorPanel(_workflowError!)]);
    }

    final workflow = _workflow;
    final stepsByOrder = <int, Map<String, dynamic>>{};

    final rawSteps = workflow?['steps'];

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

    return _card('AI Workflow', [
      if (workflow != null) ...[
        _line('Workflow status', _label(_text(workflow['status']))),
        _line('Current step', workflow['currentStep']),
        _line('Approval status', _label(_text(workflow['approvalStatus']))),
      ] else ...[
        const Text('No AI workflow has started for this request.'),
        const SizedBox(height: 12),
      ],
      for (var order = 1; order <= 4; order++)
        _agentStatus(
          order,
          stepsByOrder[order],
          workflowExists: workflow != null,
        ),
      if (workflow == null && _workflowLoaded) ...[
        const SizedBox(height: 12),
        ElevatedButton.icon(
          onPressed:
              _fetching ||
                  _starting ||
                  _requestLoading ||
                  _requestError != null ||
                  _request == null
              ? null
              : _startWorkflow,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.adminAccent,
            foregroundColor: Colors.white,
          ),
          icon: _starting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Icon(Icons.play_arrow),
          label: Text(_starting ? 'Starting…' : 'Start Agent 1 Planner'),
        ),
      ],
    ]);
  }

  Widget _agentStatus(
    int order,
    Map<String, dynamic>? step, {
    required bool workflowExists,
  }) {
    final status = step == null
        ? workflowExists
              ? 'No status recorded'
              : 'Not started'
        : _label(_text(step['status']));

    final error = step?['errorSummary']?.toString().trim() ?? '';

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Agent $order · ${_agentNames[order]}',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          Text(
            'Status: $status',
            style: const TextStyle(color: AppColors.secondaryText),
          ),
          if (error.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(error, style: const TextStyle(color: AppColors.error)),
          ],
        ],
      ),
    );
  }

  Widget _historyCard() {
    if (_historyLoading) {
      return _card('Status History', [
        const Center(child: CircularProgressIndicator()),
      ]);
    }

    if (_historyError != null) {
      return _card('Status History', [_errorPanel(_historyError!)]);
    }

    return _card('Status History', [
      if (_history.isEmpty) const Text('No status history available.'),
      for (final entry in _history)
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${_label(_text(entry['oldStatus']))}'
                ' → '
                '${_label(_text(entry['newStatus']))}',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 6),
              Text(
                _date(entry['changedAt']),
                style: const TextStyle(
                  color: AppColors.secondaryText,
                  fontSize: 12,
                ),
              ),
              if (_text(entry['note'], '').isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(_text(entry['note'])),
              ],
            ],
          ),
        ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final request = _request;

    final emergency = request == null
        ? widget.emergency
        : request['requestType'] == 'EMERGENCY';

    final title = emergency
        ? 'Emergency #${widget.requestId}'
        : 'Maintenance #${widget.requestId}';

    return PopScope(
      canPop: !_starting,
      child: RoleScaffold(
        title: title,
        roleLabel: 'Admin',
        expectedRole: 'Admin',
        accentColor: AppColors.adminAccent,
        menuItems: AdminHomeScreen.menuItems,
        currentRoute: widget.emergency
            ? AppRoutes.adminEmergencies
            : AppRoutes.adminMaintenance,
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
                  onPressed: _fetching || _starting ? null : _load,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Refresh'),
                ),
              ),
              if (_requestLoading) ...[
                const LinearProgressIndicator(),
                const SizedBox(height: 16),
              ],
              if (_requestError != null)
                _card('Request could not be refreshed', [
                  _errorPanel(_requestError!),
                ]),
              if (request != null) ...[
                _card('Request Details', [
                  _line('Description', request['description']),
                  _line('Type', request['requestType']),
                  if (emergency)
                    _line('Emergency type', request['emergencyType'])
                  else
                    _line(
                      'Category',
                      _text(request['categoryName'], 'Not analysed'),
                    ),
                  _line(
                    'Priority',
                    _text(
                      request['priority'],
                      emergency ? 'Critical' : 'Pending analysis',
                    ),
                  ),
                  _line('Status', _label(_text(request['status']))),
                  _line('Property', request['propertyName']),
                  _line('Address', request['propertyAddress']),
                  _line('Unit', request['unitName']),
                  _line('Created', _date(request['createdAt'])),
                  _line('Updated', _date(request['updatedAt'])),
                ]),
                _photos(request),
                _card('Tenant Information', [
                  _line('Name', request['tenantName']),
                  _line('Email', request['tenantEmail']),
                  _line('Mobile', request['tenantMobile']),
                ]),
                if (request['workOrderId'] != null ||
                    _text(request['assignedWorkerName'], '').isNotEmpty)
                  _card('Technician Assignment', [
                    _line('Work order', request['workOrderId']),
                    _line('Assigned worker', request['assignedWorkerName']),
                    _line('Worker email', request['assignedWorkerEmail']),
                    _line('Worker mobile', request['assignedWorkerMobile']),
                    _line(
                      'Assignment status',
                      _label(_text(request['workOrderStatus'])),
                    ),
                    _line('Scheduled visit', _date(request['scheduledDate'])),
                  ]),
              ],
              _workflowCard(),
              _historyCard(),
            ],
          ),
        ),
      ),
    );
  }
}
