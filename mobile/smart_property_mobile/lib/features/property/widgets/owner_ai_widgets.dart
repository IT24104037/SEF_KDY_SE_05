import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

String ownerAiText(dynamic value, [String fallback = '-']) {
  final text = value?.toString().trim() ?? '';

  return text.isEmpty ? fallback : text;
}

String ownerAiDate(dynamic value) {
  final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();

  if (date == null) {
    return ownerAiText(value);
  }

  String two(int number) {
    return number.toString().padLeft(2, '0');
  }

  return '${two(date.day)}/'
      '${two(date.month)}/'
      '${date.year} '
      '${two(date.hour)}:'
      '${two(date.minute)}';
}

List<Map<String, dynamic>> ownerAiList(dynamic value) {
  if (value is! List) {
    return [];
  }

  return value
      .whereType<Map>()
      .map((item) => Map<String, dynamic>.from(item))
      .toList();
}

class OwnerAiCard extends StatelessWidget {
  const OwnerAiCard({super.key, required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
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
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }
}

class OwnerAiLine extends StatelessWidget {
  const OwnerAiLine(this.label, this.value, {super.key});

  final String label;
  final dynamic value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
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
          const SizedBox(height: 3),
          Text(
            ownerAiText(value),
            style: const TextStyle(
              color: AppColors.heading,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class OwnerAiError extends StatelessWidget {
  const OwnerAiError({super.key, required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return OwnerAiCard(
      title: 'Unable to load',
      children: [
        Text(message, style: const TextStyle(color: AppColors.error)),
        TextButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh),
          label: const Text('Try Again'),
        ),
      ],
    );
  }
}
