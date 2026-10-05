import 'package:flutter/material.dart';

import '../../../core/network/mobile_api.dart';
import '../../../core/widgets/mobile_forms.dart';
import '../services/worker_service.dart';

class CompletionEvidenceScreen extends StatelessWidget {
  const CompletionEvidenceScreen({super.key, required this.workOrderId});

  final int workOrderId;

  @override
  Widget build(BuildContext context) => MobileFormScreen(
    title: 'Complete Work Order',
    fields: const [
      MobileField(
        'completionNotes',
        'Completion notes',
        isRequired: true,
        lines: 4,
      ),
      MobileField(
        'completionEvidenceUrl',
        'Evidence photo / document link (optional)',
        kind: 'url',
      ),
      MobileField('notes', 'Additional action notes', lines: 3),
    ],
    submit: (Json data) async {
      await WorkerService.instance.updateWorkOrderStatus(
        id: workOrderId,
        status: 'Completed',
        completionNotes: '${data['completionNotes']}',
        completionEvidenceUrl: data['completionEvidenceUrl']?.toString() ?? '',
        notes: data['notes']?.toString() ?? '',
      );
    },
  );
}
