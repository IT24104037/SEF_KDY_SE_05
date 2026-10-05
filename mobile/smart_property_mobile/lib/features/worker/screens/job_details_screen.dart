import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/worker_service.dart';
import 'worker_dashboard_screen.dart';
import '../../../core/network/mobile_api.dart';
import '../../../core/widgets/mobile_forms.dart';
import 'completion_evidence_screen.dart';

class JobDetailsScreen extends StatefulWidget {
  const JobDetailsScreen({super.key, required this.workOrderId});

  final int workOrderId;

  @override
  State<JobDetailsScreen> createState() => _JobDetailsScreenState();
}

class _JobDetailsScreenState extends State<JobDetailsScreen> {
  final WorkerService _service = WorkerService.instance;

  Map<String, dynamic>? _order;

  bool _loading = true;
  bool _saving = false;

  String? _error;
  String? _message;

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
      final data = await _service.getWorkOrder(widget.workOrderId);

      if (!mounted) return;

      setState(() {
        _order = data;
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

  Future<void> _startJob() async {
    final started = await mobileForm(
      context,
      'Start Job',
      const [MobileField('notes', 'Action notes (optional)', lines: 3)],
      (data) async {
        await _service.updateWorkOrderStatus(
          id: widget.workOrderId,
          status: 'InProgress',
          notes: data['notes']?.toString() ?? '',
        );
      },
    );

    if (started && mounted) {
      await _load();
    }
  }

  Future<void> _updateStatus({
    required String status,
    required String successMessage,
    String notes = '',
    String completionNotes = '',
  }) async {
    setState(() {
      _saving = true;
      _error = null;
      _message = null;
    });

    try {
      final updated = await _service.updateWorkOrderStatus(
        id: widget.workOrderId,
        status: status,
        notes: notes,
        completionNotes: completionNotes,
      );

      if (!mounted) return;

      setState(() {
        _order = updated;
        _message = successMessage;
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

  Future<void> _completeJob() async {
    final completed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) =>
            CompletionEvidenceScreen(workOrderId: widget.workOrderId),
      ),
    );

    if (completed == true && mounted) {
      await _load();
    }
  }

  Future<void> _cancelJob() async {
    final controller = TextEditingController();

    final reason = await showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Cancel Job'),
          content: TextField(
            controller: controller,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Cancellation Reason'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Back'),
            ),
            FilledButton(
              onPressed: () {
                final value = controller.text.trim();

                if (value.isEmpty) {
                  return;
                }

                Navigator.pop(context, value);
              },
              child: const Text('Cancel Job'),
            ),
          ],
        );
      },
    );

    controller.dispose();

    if (reason == null || reason.isEmpty) {
      return;
    }

    await _updateStatus(
      status: 'Cancelled',
      notes: reason,
      successMessage: 'Work order cancelled.',
    );
  }

  Future<void> _scheduleVisit() async {
    final selected = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );

    if (selected == null) {
      return;
    }

    final hour = selected.hour.toString().padLeft(2, '0');

    final minute = selected.minute.toString().padLeft(2, '0');

    setState(() {
      _saving = true;
      _error = null;
      _message = null;
    });

    try {
      final updated = await _service.updateWorkOrderSchedule(
        id: widget.workOrderId,
        visitTime: '$hour:$minute',
      );

      if (!mounted) return;

      setState(() {
        _order = updated;
        _message = 'Visit time updated successfully.';
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

  String _value(String key) {
    final value = _order?[key];

    if (value == null || value.toString().trim().isEmpty) {
      return '-';
    }

    return value.toString();
  }

  Widget _detail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.secondaryText,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.heading,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return RoleScaffold(
      title: 'Work Order #${widget.workOrderId}',
      roleLabel: 'Maintenance Worker',
      expectedRole: 'MaintenanceWorker',
      accentColor: AppColors.workerAccent,
      menuItems: WorkerDashboardScreen.menuItems,
      currentRoute: AppRoutes.workerJobs,
      showBackButton: true,

      child: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.workerAccent),
            )
          : _order == null
          ? Center(
              child: Text(
                _error ?? 'Work order not found.',
                style: const TextStyle(color: AppColors.error),
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        _value('requestTitle'),
                        style: const TextStyle(
                          color: AppColors.heading,
                          fontSize: 23,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.workerAccent.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _value('status'),
                        style: const TextStyle(
                          color: AppColors.workerAccent,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 18),

                if (_error != null) _notice(_error!, error: true),

                if (_message != null) _notice(_message!, error: false),

                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _detail('Description', _value('description')),
                      _detail('Property', _value('propertyName')),
                      _detail('Unit', _value('unitLabel')),
                      _detail('Address', _value('propertyAddress')),
                      _detail('Tenant', _value('tenantName')),
                      _detail('Tenant Mobile', _value('tenantMobile')),
                      _detail('Priority', _value('priority')),
                      _detail('Scheduled Date', _value('scheduledDate')),
                    ],
                  ),
                ),

                const SizedBox(height: 18),

                if (_order?['scheduledDate'] != null &&
                    !['Completed', 'Cancelled'].contains(_order?['status']))
                  OutlinedButton.icon(
                    onPressed: _saving ? null : _scheduleVisit,
                    icon: const Icon(Icons.schedule),
                    label: const Text('Set Visit Time'),
                  ),

                const SizedBox(height: 10),

                if (_value('status') == 'Assigned')
                  ElevatedButton.icon(
                    onPressed: _saving ? null : _startJob,
                    icon: const Icon(Icons.play_arrow),
                    label: const Text('Start Job'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.workerAccent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),

                if (_value('status') == 'InProgress') ...[
                  ElevatedButton.icon(
                    onPressed: _saving ? null : _completeJob,
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Complete Job'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.success,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),

                  const SizedBox(height: 10),

                  OutlinedButton.icon(
                    onPressed: _saving ? null : _cancelJob,
                    icon: const Icon(Icons.cancel_outlined),
                    label: const Text('Cancel Job'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                    ),
                  ),
                ],

                if (_order?['completionEvidenceUrl'] != null &&
                    '${_order!['completionEvidenceUrl']}'.trim().isNotEmpty)
                  TextButton(
                    onPressed: () async {
                      try {
                        await MobileApi.openDocument(
                          '${_order!['completionEvidenceUrl']}',
                        );
                      } catch (e) {
                        if (mounted) {
                          setState(() => _error = mobileError(e));
                        }
                      }
                    },
                    child: const Text('Open Completion Evidence'),
                  ),

                if (_value('status') == 'Completed') ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.successBackground,
                      border: Border.all(color: AppColors.successBorder),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Completion Notes',
                          style: TextStyle(
                            color: AppColors.success,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(_value('completionNotes')),
                      ],
                    ),
                  ),
                ],
              ],
            ),
    );
  }

  Widget _notice(String text, {required bool error}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: error ? AppColors.errorBackground : AppColors.successBackground,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: error ? AppColors.errorBorder : AppColors.successBorder,
        ),
      ),
      child: Text(
        text,
        style: TextStyle(color: error ? AppColors.error : AppColors.success),
      ),
    );
  }
}
