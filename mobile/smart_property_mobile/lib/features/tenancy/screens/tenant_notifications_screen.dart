import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/tenancy_service.dart';
import 'tenant_home_screen.dart';

class TenantNotificationsScreen extends StatefulWidget {
  const TenantNotificationsScreen({super.key});

  @override
  State<TenantNotificationsScreen> createState() =>
      _TenantNotificationsScreenState();
}

class _TenantNotificationsScreenState extends State<TenantNotificationsScreen> {
  final TenancyService _service = TenancyService.instance;

  List<Map<String, dynamic>> _notifications = [];

  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await _service.getNotifications();

      if (!mounted) return;

      setState(() {
        _notifications = result;
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

  String _formatDateTime(dynamic value) {
    if (value == null) {
      return '-';
    }

    final parsed = DateTime.tryParse(value.toString());

    if (parsed == null) {
      return '-';
    }

    final date = parsed.toUtc();

    final day = date.day.toString().padLeft(2, '0');

    final month = date.month.toString().padLeft(2, '0');

    final hour = date.hour.toString().padLeft(2, '0');

    final minute = date.minute.toString().padLeft(2, '0');

    return '$day/$month/${date.year}, $hour:$minute';
  }

  String _formatDate(dynamic value) {
    if (value == null) {
      return '-';
    }

    final parsed = DateTime.tryParse(value.toString());

    if (parsed == null) {
      return '-';
    }

    final date = parsed.toUtc();

    final day = date.day.toString().padLeft(2, '0');

    final month = date.month.toString().padLeft(2, '0');

    return '$day/$month/${date.year}';
  }

  String _formatTime(dynamic value) {
    if (value == null) {
      return '-';
    }

    final parsed = DateTime.tryParse(value.toString());

    if (parsed == null) {
      return '-';
    }

    final date = parsed.toUtc();

    final hour = date.hour.toString().padLeft(2, '0');

    final minute = date.minute.toString().padLeft(2, '0');

    return '$hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    return RoleScaffold(
      title: 'Updates',
      roleLabel: 'Tenant',
      expectedRole: 'Tenant',
      accentColor: AppColors.tenantAccent,
      menuItems: TenantHomeScreen.menuItems,
      currentRoute: AppRoutes.tenantNotifications,
      showBackButton: true,

      child: RefreshIndicator(
        color: AppColors.tenantAccent,
        onRefresh: _loadNotifications,

        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),

          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Notifications / Updates',
                        style: TextStyle(
                          color: AppColors.heading,
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                        ),
                      ),

                      SizedBox(height: 6),

                      Text(
                        'Maintenance approval and owner updates will appear here.',
                        style: TextStyle(
                          color: AppColors.secondaryText,
                          fontSize: 14,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),

                IconButton(
                  tooltip: 'Refresh',
                  onPressed: _loading ? null : _loadNotifications,
                  icon: const Icon(
                    Icons.refresh,
                    color: AppColors.tenantAccent,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            if (_loading)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(
                  child: CircularProgressIndicator(
                    color: AppColors.tenantAccent,
                  ),
                ),
              )
            else if (_error != null)
              _ErrorCard(message: _error!, onRetry: _loadNotifications)
            else if (_notifications.isEmpty)
              const _EmptyNotifications()
            else
              ..._notifications.map(
                (notification) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: _NotificationCard(
                    notification: notification,
                    formatDateTime: _formatDateTime,
                    formatDate: _formatDate,
                    formatTime: _formatTime,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.notification,
    required this.formatDateTime,
    required this.formatDate,
    required this.formatTime,
  });

  final Map<String, dynamic> notification;

  final String Function(dynamic) formatDateTime;

  final String Function(dynamic) formatDate;

  final String Function(dynamic) formatTime;

  @override
  Widget build(BuildContext context) {
    final decision = (notification['decision'] ?? '').toString().trim();

    final approved = decision.toLowerCase() == 'approved';

    final requestId = notification['maintenanceRequestId']?.toString() ?? '-';

    final ownerMessage = notification['ownerMessage']?.toString().trim() ?? '';

    final hasWorker = notification['hasAssignedWorker'] == true;

    final workerName = notification['workerName']?.toString().trim() ?? '';

    final scheduledDate = notification['scheduledDateTime'];

    final decidedAt = notification['decidedAt'];

    final statusColor = approved
        ? const Color(0xFF166534)
        : const Color(0xFF991B1B);

    final borderColor = approved
        ? const Color(0xFF16A34A)
        : const Color(0xFFDC2626);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D16222A),
            blurRadius: 18,
            offset: Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            child: Container(color: borderColor),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(22, 18, 18, 18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      approved
                          ? Icons.check_circle_outline
                          : Icons.cancel_outlined,
                      color: statusColor,
                      size: 24,
                    ),
                    const SizedBox(width: 9),
                    Expanded(
                      child: Text(
                        'Request #$requestId '
                        '${approved ? 'Approved' : 'Rejected'}',
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                Text(
                  approved
                      ? 'Your maintenance request has been approved.'
                      : 'Your maintenance request has been rejected.',
                  style: const TextStyle(
                    color: Color(0xFF334155),
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),

                if (approved && hasWorker) ...[
                  const SizedBox(height: 14),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(13),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F6F7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Worker: '
                          '${workerName.isEmpty ? '-' : workerName}',
                          style: const TextStyle(
                            color: Color(0xFF374151),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Scheduled Date: '
                          '${formatDate(scheduledDate)}',
                          style: const TextStyle(color: Color(0xFF374151)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Scheduled Time: '
                          '${formatTime(scheduledDate)}',
                          style: const TextStyle(color: Color(0xFF374151)),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 14),

                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(13),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFB),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        approved ? 'Owner Message' : 'Reason',
                        style: const TextStyle(
                          color: AppColors.heading,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 7),
                      Text(
                        ownerMessage.isNotEmpty
                            ? ownerMessage
                            : approved && hasWorker
                            ? 'The technician has been approved.'
                            : 'No additional message was provided.',
                        style: const TextStyle(
                          color: Color(0xFF374151),
                          fontSize: 14,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                Text(
                  'Decision recorded: '
                  '${formatDateTime(decidedAt)}',
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
}

class _EmptyNotifications extends StatelessWidget {
  const _EmptyNotifications();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),

      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),

      child: const Column(
        children: [
          Icon(
            Icons.notifications_none,
            size: 38,
            color: AppColors.secondaryText,
          ),

          SizedBox(height: 10),

          Text(
            'No maintenance approval updates yet.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.secondaryText),
          ),
        ],
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),

      decoration: BoxDecoration(
        color: AppColors.errorBackground,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.errorBorder),
      ),

      child: Column(
        children: [
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.error),
          ),

          const SizedBox(height: 10),

          TextButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Try Again'),
          ),
        ],
      ),
    );
  }
}
