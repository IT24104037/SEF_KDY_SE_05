import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../services/property_service.dart';
import '../widgets/owner_ai_widgets.dart';
import '../../../core/network/mobile_api.dart';

class OwnerRecommendationScreen extends StatefulWidget {
  const OwnerRecommendationScreen({
    super.key,
    required this.requestId,
    this.initialRequest,
    this.workflowId,
  });

  final int requestId;
  final Map<String, dynamic>? initialRequest;
  final int? workflowId;

  @override
  State<OwnerRecommendationScreen> createState() =>
      _OwnerRecommendationScreenState();
}

class _OwnerRecommendationScreenState extends State<OwnerRecommendationScreen> {
  final PropertyService _service = PropertyService.instance;

  final TextEditingController _notesController = TextEditingController();

  Map<String, dynamic>? _request;
  Map<String, dynamic>? _recommendation;
  Map<String, dynamic>? _workflow;

  DateTime? _scheduledDate;

  bool _customSchedule = false;
  bool _fetching = false;
  bool _requestLoading = true;
  bool _recommendationLoading = true;
  bool _workflowLoading = true;
  bool _saving = false;
  bool _decisionRecorded = false;

  String? _requestError;
  String? _recommendationError;
  String? _workflowError;
  String? _resultMessage;

  static const _noWorkerResults = {
    'NO_WORKER_WITH_REQUIRED_SKILL',
    'NO_WORKER_IN_LOCATION',
    'NO_AVAILABLE_WORKER',
    'NO_AVAILABLE_EMERGENCY_WORKER',
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

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  bool _requestAllowsDecision(Map<String, dynamic>? request) {
    if (request == null ||
        request['isArchived'] == true ||
        request['workOrderId'] != null) {
      return false;
    }

    final status = ownerAiText(request['status'])
        .toLowerCase()
        .replaceAll(' ', '');

    return !const [
      'assigned',
      'inprogress',
      'completed',
      'cancelled',
      'closed',
    ].contains(status);
  }

  bool _emergencyServicesRequired(Map<String, dynamic>? workflow) {
    final approvalStatus = ownerAiText(
      workflow?['approvalStatus'],
      '',
    ).toLowerCase();

    final currentStep = ownerAiText(workflow?['currentStep'], '').toLowerCase();

    return approvalStatus == 'emergencyservicesrequired' ||
        currentStep == 'emergency services required';
  }

  bool _manualDecisionAvailable(
    Map<String, dynamic>? recommendation,
    Map<String, dynamic>? workflow,
  ) {
    if (_emergencyServicesRequired(workflow)) {
      return true;
    }

    final matchingResult = ownerAiText(
      recommendation?['validationStatus'],
      '',
    ).toUpperCase();

    return _noWorkerResults.contains(matchingResult);
  }

  bool _manualDecisionAlreadyRecorded(Map<String, dynamic>? workflow) {
    final approvalStatus = ownerAiText(
      workflow?['approvalStatus'],
      '',
    ).toLowerCase();

    return approvalStatus == 'manualapproved' ||
        approvalStatus == 'manualrejected';
  }

  bool _workerIsValidated(Map<String, dynamic>? recommendation) {
    final workerId = int.tryParse('${recommendation?['recommendedWorkerId']}');

    return recommendation?['hasAvailableWorker'] == true &&
        workerId != null &&
        workerId > 0 &&
        recommendation?['validationStatus'] == 'Agent 4 Verified (Pass)';
  }

  bool get _manualMode => _manualDecisionAvailable(_recommendation, _workflow);

  bool get _canDecide =>
      !_saving &&
      !_requestLoading &&
      !_recommendationLoading &&
      !_workflowLoading &&
      _requestError == null &&
      _recommendationError == null &&
      _workflowError == null &&
      !_decisionRecorded &&
      !_manualDecisionAlreadyRecorded(_workflow) &&
      _requestAllowsDecision(_request);

  bool get _canApprove {
    if (!_canDecide) return false;

    if (_manualMode) {
      final message = _notesController.text.trim();

      return message.isNotEmpty && message.length <= 1000;
    }

    return _workerIsValidated(_recommendation) &&
        _scheduledDate != null &&
        _scheduledDate!.isAfter(DateTime.now());
  }

  Future<void> _loadRequest() async {
    try {
      final request = await _service.getOwnerMaintenanceRequest(
        widget.requestId,
      );

      if (!mounted) return;

      setState(() {
        _request = request;
      });
    } catch (error) {
      if (mounted) {
        setState(() {
          _requestError = error.toString();
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _requestLoading = false;
        });
      }
    }
  }

  Future<void> _loadRecommendation() async {
    try {
      final recommendation = await _service.getOwnerRecommendation(
        widget.requestId,
      );

      if (!mounted) return;

      setState(() {
        _recommendation = recommendation;

        if (!_customSchedule) {
          final proposedTime = DateTime.tryParse(
            '${recommendation['proposedTime']}',
          )?.toLocal();

          _scheduledDate =
              proposedTime != null && proposedTime.isAfter(DateTime.now())
              ? proposedTime
              : null;
        }
      });
    } catch (error) {
      if (mounted) {
        setState(() {
          _recommendationError = error.toString();
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _recommendationLoading = false;
        });
      }
    }
  }

  Future<void> _loadWorkflow() async {
    try {
      final workflow = widget.workflowId == null
          ? await _service.getOwnerWorkflow(widget.requestId)
          : MobileApi.map(
              await MobileApi.request(
                '/api/agent-workflows/${widget.workflowId}',
              ),
            );

      if (!mounted) return;

      setState(() {
        _workflow = workflow;
      });
    } catch (error) {
      if (mounted) {
        setState(() {
          _workflowError = error.toString();
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _workflowLoading = false;
        });
      }
    }
  }

  Future<void> _load() async {
    if (!mounted || _saving || _fetching) return;

    _fetching = true;

    setState(() {
      _requestLoading = true;
      _recommendationLoading = true;
      _workflowLoading = true;

      _requestError = null;
      _recommendationError = null;
      _workflowError = null;
    });

    try {
      // Independent API calls run concurrently.
      // Each card appears as its own request finishes.
      await Future.wait<void>([
        _loadRequest(),
        _loadRecommendation(),
        _loadWorkflow(),
      ]);
    } finally {
      _fetching = false;
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;

    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _chooseSchedule() async {
    final now = DateTime.now();

    final initialDate = _scheduledDate != null && _scheduledDate!.isAfter(now)
        ? _scheduledDate!
        : now;

    final day = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: DateTime(
        initialDate.year + 1,
        initialDate.month,
        initialDate.day,
      ),
    );

    if (day == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initialDate),
    );

    if (time == null || !mounted) return;

    final selectedDate = DateTime(
      day.year,
      day.month,
      day.day,
      time.hour,
      time.minute,
    );

    if (!selectedDate.isAfter(DateTime.now())) {
      _showMessage('Please select a future date and time.');
      return;
    }

    setState(() {
      _scheduledDate = selectedDate;
      _customSchedule = true;
    });
  }

  Future<void> _submitDecision(String decision) async {
    if (!_canDecide || (decision == 'Approve' && !_canApprove)) {
      return;
    }

    final manual = _manualMode;
    final notes = _notesController.text.trim();
    final selectedSchedule = _scheduledDate;

    final workerId = int.tryParse('${_recommendation?['recommendedWorkerId']}');

    if ((manual || decision != 'Approve') && notes.isEmpty) {
      _showMessage(
        manual
            ? 'Enter a message to the tenant.'
            : 'Enter a reason for this decision.',
      );
      return;
    }

    if (manual && notes.length > 1000) {
      _showMessage('The message cannot exceed 1000 characters.');
      return;
    }

    final label = decision == 'RevisionRequested'
        ? 'Request Revision'
        : decision;

    final confirmation = manual
        ? '$label this request and send this message '
              'to the tenant?\n\n$notes\n\n'
              'This records your manual decision. '
              'It does not assign a maintenance worker.'
        : decision == 'Approve'
        ? 'Assign ${ownerAiText(_recommendation?['recommendedWorker'])} on ${ownerAiDate(selectedSchedule)}?'
        : '$label will be recorded with your reason.';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('$label request?'),
        content: Text(confirmation),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(label),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted || !_canDecide) {
      return;
    }

    setState(() {
      _saving = true;
      _resultMessage = null;
    });

    try {
      // Recheck current state concurrently before submitting.
      final current = await Future.wait<dynamic>([
        _service.getOwnerMaintenanceRequest(widget.requestId),
        _service.getOwnerRecommendation(widget.requestId),
        if (manual) _service.getOwnerWorkflow(widget.requestId),
      ]);

      final currentRequest = Map<String, dynamic>.from(current[0] as Map);

      final currentRecommendation = Map<String, dynamic>.from(
        current[1] as Map,
      );

      final Map<String, dynamic>? currentWorkflow = manual
          ? current[2] == null
                ? null
                : Map<String, dynamic>.from(current[2] as Map)
          : _workflow;

      if (!mounted) return;

      setState(() {
        _request = currentRequest;
        _recommendation = currentRecommendation;

        if (manual) {
          _workflow = currentWorkflow;
        }
      });

      if (!_requestAllowsDecision(currentRequest)) {
        throw Exception('This request is assigned, closed or archived.');
      }

      Map<String, dynamic> result;

      if (manual) {
        if (_manualDecisionAlreadyRecorded(currentWorkflow)) {
          throw Exception('A manual decision has already been recorded.');
        }

        if (!_manualDecisionAvailable(currentRecommendation, currentWorkflow)) {
          throw Exception(
            'The request has changed. Review it again '
            'before making a decision.',
          );
        }

        result = await _service.submitOwnerManualDecision(
          requestId: widget.requestId,
          decision: decision,
          message: notes,
        );
      } else {
        if (decision == 'Approve') {
          final currentWorkerId = int.tryParse(
            '${currentRecommendation['recommendedWorkerId']}',
          );

          if (!_workerIsValidated(currentRecommendation) ||
              currentWorkerId != workerId) {
            throw Exception(
              'The technician recommendation changed '
              'or is awaiting validation. Review it again.',
            );
          }
        }

        result = await _service.submitOwnerApproval(
          requestId: widget.requestId,
          decision: decision,
          workerId: workerId,
          scheduledDate: selectedSchedule,
          notes: notes,
        );
      }

      if (!mounted) return;

      setState(() {
        _decisionRecorded = true;

        _resultMessage = ownerAiText(result['message'], 'Decision recorded.');

        if (result['createdWorkOrder'] == true) {
          _resultMessage =
              '$_resultMessage Work Order '
              '#${result['workOrderId']}.';
        }
      });
    } catch (error) {
      if (mounted) {
        setState(() {
          _resultMessage = error.toString();
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }

    if (mounted) {
      await _load();
    }
  }

  Widget _loadingCard(String title) {
    return OwnerAiCard(
      title: title,
      children: const [LinearProgressIndicator(color: AppColors.ownerAccent)],
    );
  }

  Widget _requestCard() {
    if (_requestError != null) {
      return OwnerAiError(message: _requestError!, onRetry: _load);
    }

    final request = _request;

    if (request == null) {
      return _loadingCard('Request Details');
    }

    return OwnerAiCard(
      title: 'Request Details',
      children: [
        OwnerAiLine(
          'Property / Unit',
          '${ownerAiText(request['propertyName'])} / '
              '${ownerAiText(request['unitName'])}',
        ),
        OwnerAiLine('Tenant', request['tenantName']),
        OwnerAiLine('Request Type', request['requestType']),
        OwnerAiLine('Status', request['status']),
        OwnerAiLine('Priority', request['priority']),
        OwnerAiLine('Description', request['description']),
        TextButton.icon(
          onPressed: _saving
              ? null
              : () async {
                  await Navigator.pushNamed(
                    context,
                    '${AppRoutes.ownerMaintenance}/'
                    '${widget.requestId}',
                  );

                  if (mounted) {
                    await _load();
                  }
                },
          icon: const Icon(Icons.photo_library_outlined),
          label: const Text('Photos and Status History'),
        ),
      ],
    );
  }

  Widget _recommendationCard() {
    if (_recommendationError != null) {
      return OwnerAiError(message: _recommendationError!, onRetry: _load);
    }

    if (_recommendationLoading) {
      return _loadingCard('Technician Recommendation');
    }

    final recommendation = _recommendation;

    final hasWorker = recommendation?['hasAvailableWorker'] == true;

    return OwnerAiCard(
      title: hasWorker ? 'Recommended Technician' : 'Technician Matching',
      children: [
        if (hasWorker) ...[
          OwnerAiLine('Name', recommendation?['recommendedWorker']),
          OwnerAiLine('Skill', recommendation?['workerSkill']),
          OwnerAiLine('Service Area', recommendation?['serviceArea']),
          OwnerAiLine('Email', recommendation?['workerEmail']),
          OwnerAiLine('Mobile', recommendation?['workerMobile']),
          OwnerAiLine('Hourly Rate', recommendation?['hourlyRate']),
          OwnerAiLine(
            'Proposed Time',
            ownerAiDate(recommendation?['proposedTime']),
          ),
        ],
        OwnerAiLine('Validation', recommendation?['validationStatus']),
        OwnerAiLine('Message', recommendation?['message']),
      ],
    );
  }

  Widget _workflowCard() {
    if (_workflowError != null) {
      return OwnerAiError(
        message: 'AI workflow: $_workflowError',
        onRetry: _load,
      );
    }

    if (_workflowLoading) {
      return _loadingCard('AI Workflow');
    }

    final workflow = _workflow;

    if (workflow == null) {
      return const OwnerAiCard(
        title: 'AI Workflow',
        children: [Text('No AI workflow is available yet.')],
      );
    }

    final steps = ownerAiList(workflow['steps']);

    steps.sort((first, second) {
      final firstOrder = int.tryParse('${first['stepOrder']}') ?? 0;
      final secondOrder = int.tryParse('${second['stepOrder']}') ?? 0;

      return firstOrder.compareTo(secondOrder);
    });

    return OwnerAiCard(
      title: 'AI Workflow',
      children: [
        OwnerAiLine('Workflow Status', workflow['status']),
        OwnerAiLine('Current Step', workflow['currentStep']),

        if (steps.isEmpty) const Text('No agent steps are available yet.'),

        ...steps.map((step) {
          final error = ownerAiText(step['errorSummary'], '');

          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Divider(),
                Text(
                  '${ownerAiText(step['stepOrder'])}. '
                  '${ownerAiText(step['stepName'])}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                OwnerAiLine('Status', step['status']),

                if (error.isNotEmpty)
                  Text(error, style: const TextStyle(color: AppColors.error)),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _decisionCard() {
    if (_decisionRecorded || _manualDecisionAlreadyRecorded(_workflow)) {
      return const OwnerAiCard(
        title: 'Owner Decision',
        children: [
          Text(
            'Your decision has been recorded. '
            'Review Status History for the details.',
          ),
        ],
      );
    }

    if (_requestLoading || _recommendationLoading || _workflowLoading) {
      return _loadingCard('Owner Decision');
    }

    if (_requestError != null ||
        _recommendationError != null ||
        _workflowError != null) {
      return const OwnerAiCard(
        title: 'Owner Decision',
        children: [
          Text(
            'Reload the failed section before '
            'submitting a decision.',
          ),
        ],
      );
    }

    if (!_requestAllowsDecision(_request)) {
      return const OwnerAiCard(
        title: 'Owner Decision',
        children: [Text('This request is assigned, closed or archived.')],
      );
    }

    final manual = _manualMode;
    final emergency = _emergencyServicesRequired(_workflow);

    final safetyMessage = ownerAiText(_workflow?['finalOutcome'], '');

    return OwnerAiCard(
      title: manual ? 'Manual Owner Decision' : 'Owner Decision',
      children: [
        if (manual) ...[
          Text(
            emergency
                ? 'Send instructions to the tenant for '
                      'this emergency.'
                : 'No suitable worker is available. '
                      'Enter your instructions or arrangement '
                      'for the tenant.',
          ),
          const SizedBox(height: 12),

          if (emergency && safetyMessage.isNotEmpty)
            OwnerAiLine('Emergency Guidance', safetyMessage),
        ] else ...[
          OwnerAiLine(
            'Schedule (your device local time)',
            ownerAiDate(_scheduledDate),
          ),
          OutlinedButton.icon(
            onPressed: _saving || !_workerIsValidated(_recommendation)
                ? null
                : _chooseSchedule,
            icon: const Icon(Icons.calendar_month),
            label: const Text('Choose Date and Time'),
          ),
          const SizedBox(height: 12),
        ],

        TextField(
          controller: _notesController,
          enabled: !_saving,
          maxLines: 3,
          maxLength: manual ? 1000 : null,
          onChanged: (_) {
            setState(() {});
          },
          decoration: InputDecoration(
            labelText: manual ? 'Message to Tenant' : 'Notes / Reason',
            helperText: manual
                ? 'Required for manual Approve or Reject.'
                : 'Enter a reason for Reject or Request Revision.',
            helperMaxLines: 2,
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 10,
          runSpacing: 8,
          children: [
            FilledButton(
              onPressed: _canApprove ? () => _submitDecision('Approve') : null,
              child: const Text('Approve'),
            ),
            OutlinedButton(
              onPressed: _canDecide ? () => _submitDecision('Reject') : null,
              child: const Text('Reject'),
            ),

            if (!manual)
              OutlinedButton(
                onPressed: _canDecide
                    ? () => _submitDecision('RevisionRequested')
                    : null,
                child: const Text('Request Revision'),
              ),
          ],
        ),

        if (_saving)
          const Padding(
            padding: EdgeInsets.only(top: 12),
            child: LinearProgressIndicator(),
          ),

        if (!manual && !_workerIsValidated(_recommendation))
          const Padding(
            padding: EdgeInsets.only(top: 12),
            child: Text(
              'Approval is waiting for a valid technician '
              'match and verification.',
            ),
          ),

        if (!manual &&
            _workerIsValidated(_recommendation) &&
            _scheduledDate == null)
          const Padding(
            padding: EdgeInsets.only(top: 12),
            child: Text('Select a future schedule to enable approval.'),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_saving,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text('AI Review • Request #${widget.requestId}'),
          actions: [
            IconButton(
              onPressed: _fetching || _saving ? null : _load,
              icon: const Icon(Icons.refresh),
            ),
          ],
        ),
        body: RefreshIndicator(
          color: AppColors.ownerAccent,
          onRefresh: _load,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            children: [
              if (_resultMessage != null)
                OwnerAiCard(
                  title: 'Decision Update',
                  children: [Text(_resultMessage!)],
                ),
              _requestCard(),
              _recommendationCard(),
              _workflowCard(),
              _decisionCard(),
            ],
          ),
        ),
      ),
    );
  }
}
