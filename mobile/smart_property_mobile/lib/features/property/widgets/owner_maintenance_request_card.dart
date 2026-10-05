import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class OwnerMaintenanceRequestCard extends StatelessWidget {
  const OwnerMaintenanceRequestCard({
    super.key,
    required this.request,
    required this.onTap,
    this.emergency = false,
  });

  final Map<String, dynamic> request;
  final VoidCallback onTap;
  final bool emergency;

  String _text(String key, {String fallback = '-'}) {
    final value = request[key];

    if (value == null || value.toString().trim().isEmpty) {
      return fallback;
    }

    return value.toString();
  }

  String _date(dynamic value) {
    if (value == null) return '-';

    final parsed = DateTime.tryParse(value.toString());

    if (parsed == null) {
      return value.toString();
    }

    final date = parsed.toLocal();

    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year}';
  }

  Color _priorityColor(String priority) {
    final value = priority.toLowerCase();

    if (value == 'critical' || value == 'emergency') {
      return AppColors.error;
    }

    if (value == 'high') {
      return AppColors.workerAccent;
    }

    if (value == 'medium') {
      return const Color(0xFFB45309);
    }

    return AppColors.ownerAccent;
  }

  @override
  Widget build(BuildContext context) {
    final status = _text('status');
    final priority = _text('priority', fallback: 'Not set');

    final accent = emergency ? AppColors.error : AppColors.ownerAccent;

    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(bottom: 2),
          padding: const EdgeInsets.all(17),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A16222A),
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 9,
                    height: 9,
                    decoration: BoxDecoration(
                      color: accent,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Request #${_text('id')}',
                      style: const TextStyle(
                        color: AppColors.heading,
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const Icon(
                    Icons.chevron_right,
                    color: AppColors.secondaryText,
                  ),
                ],
              ),

              const SizedBox(height: 11),

              Text(
                _text(
                  'categoryName',
                  fallback: emergency
                      ? _text('emergencyType', fallback: 'Emergency Request')
                      : 'Maintenance Request',
                ),
                style: const TextStyle(
                  color: AppColors.heading,
                  fontWeight: FontWeight.w700,
                ),
              ),

              const SizedBox(height: 6),

              Text(
                _text('description'),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.secondaryText,
                  height: 1.4,
                ),
              ),

              const SizedBox(height: 12),

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
                      '${_text('propertyName')}'
                      ' • Unit ${_text('unitName')}',
                      style: const TextStyle(
                        color: AppColors.secondaryText,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),

              if (request['tenantName'] != null) ...[
                const SizedBox(height: 7),
                Row(
                  children: [
                    const Icon(
                      Icons.person_outline,
                      size: 17,
                      color: AppColors.secondaryText,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        _text('tenantName'),
                        style: const TextStyle(
                          color: AppColors.secondaryText,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 14),

              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _Badge(
                    label: status,
                    foreground: AppColors.ownerAccent,
                    background: AppColors.ownerAccent.withValues(alpha: 0.10),
                  ),
                  _Badge(
                    label: priority,
                    foreground: _priorityColor(priority),
                    background: _priorityColor(priority)
                        .withValues(alpha: 0.10),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              Text(
                'Created: '
                '${_date(request['createdAt'])}',
                style: const TextStyle(
                  color: AppColors.secondaryText,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({
    required this.label,
    required this.foreground,
    required this.background,
  });

  final String label;
  final Color foreground;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: foreground,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
