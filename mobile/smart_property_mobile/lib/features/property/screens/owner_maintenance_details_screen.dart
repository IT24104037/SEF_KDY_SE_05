import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../services/property_service.dart';
import '../widgets/owner_workflow_panel.dart';

class OwnerMaintenanceDetailsScreen extends StatefulWidget {
  const OwnerMaintenanceDetailsScreen({super.key, required this.requestId});

  final int requestId;

  @override
  State<OwnerMaintenanceDetailsScreen> createState() =>
      _OwnerMaintenanceDetailsScreenState();
}

class _OwnerMaintenanceDetailsScreenState
    extends State<OwnerMaintenanceDetailsScreen> {
  final PropertyService _service = PropertyService.instance;

  Map<String, dynamic>? _request;
  List<Map<String, dynamic>> _history = [];

  bool _loading = true;
  String? _error;

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
      final request = await _service.getOwnerMaintenanceRequest(
        widget.requestId,
      );

      final history = await _service.getMaintenanceRequestHistory(
        widget.requestId,
      );

      if (!mounted) return;

      setState(() {
        _request = request;
        _history = history;
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

  String _text(String key, {String fallback = '-'}) {
    final value = _request?[key];

    if (value == null || value.toString().trim().isEmpty) {
      return fallback;
    }

    return value.toString();
  }

  String _dateTime(dynamic value) {
    if (value == null) return '-';

    final parsed = DateTime.tryParse(value.toString());

    if (parsed == null) {
      return value.toString();
    }

    final date = parsed.toLocal();

    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year} '
        '${date.hour.toString().padLeft(2, '0')}:'
        '${date.minute.toString().padLeft(2, '0')}';
  }

  List<String> get _images {
    final raw = _request?['imageUrls'];

    if (raw is! List) {
      return [];
    }

    return raw
        .map((value) => value.toString())
        .where((url) => url.trim().isNotEmpty)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: Text('Request #${widget.requestId}'),
        actions: [
          IconButton(
            onPressed: _loading ? null : _load,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.ownerAccent),
            )
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.error),
                ),
              ),
            )
          : _request == null
          ? const Center(child: Text('Maintenance request not found.'))
          : RefreshIndicator(
              color: AppColors.ownerAccent,
              onRefresh: _load,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                children: [
                  _headerCard(),

                  const SizedBox(height: 16),

                  _detailsCard(),

                  if (_images.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    const _SectionTitle(title: 'Photos'),
                    const SizedBox(height: 10),
                    ..._images.map(
                      (url) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            constraints: const BoxConstraints(
                              minHeight: 180,
                              maxHeight: 300,
                            ),
                            color: const Color(0xFFE9EEF0),
                            child: Image.network(
                              url,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return const SizedBox(
                                  height: 180,
                                  child: Center(
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.broken_image_outlined,
                                          color: AppColors.secondaryText,
                                        ),
                                        SizedBox(height: 8),
                                        Text(
                                          'Image could not be loaded.',
                                          style: TextStyle(
                                            color: AppColors.secondaryText,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),

                  _aiCard(),
                  OwnerWorkflowPanel(requestId: widget.requestId),

                  const SizedBox(height: 12),

                  OutlinedButton.icon(
                    onPressed: () async {
                      await Navigator.pushNamed(
                        context,
                        '${AppRoutes.ownerApproval}/'
                        '${widget.requestId}',
                      );

                      if (mounted) {
                        await _load();
                      }
                    },
                    icon: const Icon(Icons.auto_awesome_outlined),
                    label: const Text('Review AI Recommendation'),
                  ),

                  if (_request?['workOrderId'] != null) ...[
                    const SizedBox(height: 20),
                    _workOrderCard(),
                  ],

                  const SizedBox(height: 20),

                  const _SectionTitle(title: 'Status History'),

                  const SizedBox(height: 10),

                  if (_history.isEmpty)
                    const _SimpleCard(
                      child: Text(
                        'No status history available.',
                        style: TextStyle(color: AppColors.secondaryText),
                      ),
                    )
                  else
                    ..._history.map(_historyCard),

                  const SizedBox(height: 30),
                ],
              ),
            ),
    );
  }

  Widget _headerCard() {
    final emergency = _text('requestType').toUpperCase() == 'EMERGENCY';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: emergency ? AppColors.errorBackground : AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: emergency ? AppColors.errorBorder : AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                emergency ? Icons.warning_amber_rounded : Icons.build_outlined,
                color: emergency ? AppColors.error : AppColors.ownerAccent,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  emergency ? 'Emergency Request' : 'Maintenance Request',
                  style: TextStyle(
                    color: emergency ? AppColors.error : AppColors.heading,
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _infoRow('Status', _text('status')),
          _infoRow('Priority', _text('priority', fallback: 'Not set')),
          if (emergency) _infoRow('Emergency Type', _text('emergencyType')),
          _infoRow('Created', _dateTime(_request?['createdAt'])),
        ],
      ),
    );
  }

  Widget _detailsCard() {
    return _SimpleCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionTitle(title: 'Request Details'),
          const SizedBox(height: 14),

          _infoRow('Property', _text('propertyName')),
          _infoRow('Address', _text('propertyAddress')),
          _infoRow('Unit', _text('unitName')),
          _infoRow('Tenant', _text('tenantName', fallback: 'Tenant')),

          if (_request?['tenantEmail'] != null)
            _infoRow('Tenant Email', _text('tenantEmail')),

          if (_request?['tenantMobile'] != null)
            _infoRow('Tenant Mobile', _text('tenantMobile')),

          const SizedBox(height: 8),

          const Text(
            'Description',
            style: TextStyle(
              color: AppColors.secondaryText,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),

          const SizedBox(height: 5),

          Text(
            _text('description'),
            style: const TextStyle(
              color: AppColors.heading,
              fontSize: 15,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _aiCard() {
    return _SimpleCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.auto_awesome_outlined, color: AppColors.ownerAccent),
              SizedBox(width: 8),
              Text(
                'AI Classification',
                style: TextStyle(
                  color: AppColors.heading,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          _infoRow(
            'Category',
            _text('categoryName', fallback: 'Not available'),
          ),

          _infoRow('Priority', _text('priority', fallback: 'Not available')),
        ],
      ),
    );
  }

  Widget _workOrderCard() {
    return _SimpleCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionTitle(title: 'Work Order'),
          const SizedBox(height: 14),

          _infoRow('Work Order ID', '#${_text('workOrderId')}'),

          _infoRow(
            'Worker',
            _text('assignedWorkerName', fallback: 'Not available'),
          ),

          if (_request?['assignedWorkerEmail'] != null)
            _infoRow('Worker Email', _text('assignedWorkerEmail')),

          if (_request?['assignedWorkerMobile'] != null)
            _infoRow('Worker Mobile', _text('assignedWorkerMobile')),

          _infoRow('Scheduled', _dateTime(_request?['scheduledDate'])),

          _infoRow('Work Order Status', _text('workOrderStatus')),
        ],
      ),
    );
  }

  Widget _historyCard(Map<String, dynamic> item) {
    final oldStatus = item['oldStatus']?.toString().trim() ?? '';

    final newStatus = item['newStatus']?.toString().trim() ?? '-';

    final note = item['note']?.toString().trim() ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 5),
            width: 9,
            height: 9,
            decoration: const BoxDecoration(
              color: AppColors.ownerAccent,
              shape: BoxShape.circle,
            ),
          ),

          const SizedBox(width: 12),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  oldStatus.isEmpty ? newStatus : '$oldStatus → $newStatus',
                  style: const TextStyle(
                    color: AppColors.heading,
                    fontWeight: FontWeight.w700,
                  ),
                ),

                if (note.isNotEmpty) ...[
                  const SizedBox(height: 5),
                  Text(
                    note,
                    style: const TextStyle(color: AppColors.secondaryText),
                  ),
                ],

                const SizedBox(height: 6),

                Text(
                  _dateTime(item['changedAt']),
                  style: const TextStyle(
                    color: AppColors.secondaryText,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 115,
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.secondaryText,
                fontSize: 13,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: AppColors.heading,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        color: AppColors.heading,
        fontSize: 18,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

class _SimpleCard extends StatelessWidget {
  const _SimpleCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: child,
    );
  }
}
