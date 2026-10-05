import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class WorkOrderCard extends StatelessWidget {
  const WorkOrderCard({
    super.key,
    required this.workOrder,
    required this.onTap,
  });

  final Map<String, dynamic> workOrder;
  final VoidCallback onTap;

  Color _statusColor(String status) {
    switch (status) {
      case 'Completed':
        return const Color(0xFF166534);

      case 'InProgress':
        return const Color(0xFF0369A1);

      case 'Cancelled':
        return const Color(0xFF991B1B);

      case 'Assigned':
        return AppColors.workerAccent;

      default:
        return AppColors.secondaryText;
    }
  }

  String _scheduleText(dynamic value) {
    if (value == null) {
      return 'Not scheduled';
    }

    final date = DateTime.tryParse(value.toString());

    if (date == null) {
      return 'Not scheduled';
    }

    final day = date.day.toString().padLeft(2, '0');

    final month = date.month.toString().padLeft(2, '0');

    final hour = date.hour.toString().padLeft(2, '0');

    final minute = date.minute.toString().padLeft(2, '0');

    return '$day/$month/${date.year} • $hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    final status = workOrder['status']?.toString() ?? 'Unknown';

    final color = _statusColor(status);

    final title =
        workOrder['requestTitle']?.toString() ??
        workOrder['description']?.toString() ??
        'Maintenance Job';

    final property = workOrder['propertyName']?.toString() ?? 'Property';

    final unit = workOrder['unitLabel']?.toString() ?? '-';

    final isEmergency = workOrder['isEmergency'] == true;

    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),

      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),

        child: Container(
          padding: const EdgeInsets.all(16),

          decoration: BoxDecoration(
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

          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,

            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        color: AppColors.heading,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                  ),

                  const SizedBox(width: 8),

                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      status,
                      style: TextStyle(
                        color: color,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              Row(
                children: [
                  const Icon(
                    Icons.apartment_outlined,
                    size: 17,
                    color: AppColors.secondaryText,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      '$property • Unit $unit',
                      style: const TextStyle(
                        color: AppColors.secondaryText,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 8),

              Row(
                children: [
                  const Icon(
                    Icons.schedule_outlined,
                    size: 17,
                    color: AppColors.secondaryText,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      _scheduleText(workOrder['scheduledDate']),
                      style: const TextStyle(
                        color: AppColors.secondaryText,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),

              if (isEmergency) ...[
                const SizedBox(height: 10),

                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.errorBackground,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'EMERGENCY',
                    style: TextStyle(
                      color: AppColors.error,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 12),

              const Align(
                alignment: Alignment.centerRight,
                child: Icon(
                  Icons.chevron_right,
                  color: AppColors.secondaryText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
