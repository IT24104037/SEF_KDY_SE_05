import 'package:flutter/material.dart';

import '../../../core/network/mobile_api.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/mobile_forms.dart';

class OwnerWorkOrderDetailsScreen extends StatefulWidget {
  const OwnerWorkOrderDetailsScreen({super.key, required this.workOrderId});

  final int workOrderId;

  @override
  State<OwnerWorkOrderDetailsScreen> createState() =>
      _OwnerWorkOrderDetailsScreenState();
}

class _OwnerWorkOrderDetailsScreenState
    extends State<OwnerWorkOrderDetailsScreen> {
  Json? _order;
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
      final data = MobileApi.map(
        await MobileApi.request('/api/work-orders/${widget.workOrderId}'),
      );

      if (mounted) setState(() => _order = data);
    } catch (e) {
      if (mounted) setState(() => _error = mobileError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = _order ?? {};

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text('Work Order #${widget.workOrderId}')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          children: [
            if (_error != null)
              Text(_error!, style: const TextStyle(color: AppColors.error)),

            if (_loading)
              const Center(child: CircularProgressIndicator())
            else if (_order != null) ...[
              MobileInfoCard('Work order', {
                'Request': order['maintenanceRequestId'],
                'Description': order['description'],
                'Status': order['status'],
                'Priority': order['priority'],
                'Property': order['propertyName'],
                'Address': order['propertyAddress'],
                'Unit': order['unitLabel'],
                'Scheduled visit': mobileDate(
                  order['scheduledDate'],
                  schedule: true,
                ),
                'Started': mobileDate(order['startedAt']),
                'Completed': mobileDate(order['completedAt']),
                'Notes': order['notes'],
                'Created': mobileDate(order['createdAt']),
                'Updated': mobileDate(order['updatedAt']),
              }),
              MobileInfoCard('Technician', {
                'Name': order['workerName'],
                'Email': order['workerEmail'],
                'Mobile': order['workerMobile'],
              }),
              MobileInfoCard('Tenant', {
                'Name': order['tenantName'],
                'Email': order['tenantEmail'],
                'Mobile': order['tenantMobile'],
              }),
              MobileInfoCard(
                'Completion evidence',
                {'Notes': order['completionNotes']},
                actions: [
                  if (order['completionEvidenceUrl'] != null &&
                      '${order['completionEvidenceUrl']}'.trim().isNotEmpty)
                    TextButton(
                      onPressed: () async {
                        try {
                          await MobileApi.openDocument(
                            '${order['completionEvidenceUrl']}',
                          );
                        } catch (e) {
                          if (mounted) {
                            setState(() => _error = mobileError(e));
                          }
                        }
                      },
                      child: const Text('Open Evidence Attachment'),
                    ),
                ],
              ),
              if (order['maintenanceRequestId'] != null)
                TextButton(
                  onPressed: () => Navigator.pushNamed(
                    context,
                    '/owner/maintenance/'
                    '${order['maintenanceRequestId']}',
                  ),
                  child: const Text('View Maintenance Request'),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
