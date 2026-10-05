import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/app_router.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/admin_service.dart';
import 'admin_home_screen.dart';

class AdminReviewScreen extends StatefulWidget {
  const AdminReviewScreen({super.key, required this.type});

  final AdminReviewType type;

  @override
  State<AdminReviewScreen> createState() => _AdminReviewScreenState();
}

class _AdminReviewScreenState extends State<AdminReviewScreen> {
  final _service = AdminService.instance;
  final _searchController = TextEditingController();

  List<Map<String, dynamic>> _items = [];

  late String _statusFilter;

  bool _loading = false;
  bool _saving = false;
  bool _confirming = false;

  String? _error;

  int _page = 1;
  int _total = 0;
  int _totalPages = 1;

  bool get _busy => _loading || _saving || _confirming;

  bool get _isWorker => widget.type == AdminReviewType.workers;

  bool get _isProfileRequest =>
      widget.type == AdminReviewType.ownerProfileRequests;

  String get _title {
    switch (widget.type) {
      case AdminReviewType.owners:
        return 'Owner Verification';

      case AdminReviewType.workers:
        return 'Worker Verification';

      case AdminReviewType.properties:
        return 'Property Verification';

      case AdminReviewType.ownerProfileRequests:
        return 'Owner Profile Requests';
    }
  }

  String get _route {
    switch (widget.type) {
      case AdminReviewType.owners:
        return AppRoutes.adminOwnerVerification;

      case AdminReviewType.workers:
        return AppRoutes.adminWorkers;

      case AdminReviewType.properties:
        return AppRoutes.adminPropertyVerification;

      case AdminReviewType.ownerProfileRequests:
        return AppRoutes.adminOwnerProfileRequests;
    }
  }

  List<String> get _statusOptions {
    switch (widget.type) {
      case AdminReviewType.owners:
      case AdminReviewType.workers:
        return ['PendingVerification', 'Verified', 'Rejected', 'All'];

      case AdminReviewType.properties:
        return ['UnderReview', 'Approved', 'Rejected', 'All'];

      case AdminReviewType.ownerProfileRequests:
        return ['Pending'];
    }
  }

  @override
  void initState() {
    super.initState();

    _statusFilter = _statusOptions.first;
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _text(dynamic value) {
    final result = value?.toString().trim() ?? '';
    return result.isEmpty ? '—' : result;
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

  String _statusLabel(String status) {
    switch (status) {
      case 'PendingVerification':
        return 'Pending Verification';

      case 'UnderReview':
        return 'Under Review';

      default:
        return status;
    }
  }

  String _recordStatus(Map<String, dynamic> item) {
    return _text(_isWorker ? item['verificationStatus'] : item['status']);
  }

  int? _recordId(Map<String, dynamic> item) {
    final dynamic value;

    switch (widget.type) {
      case AdminReviewType.owners:
        value = item['ownerId'];

      case AdminReviewType.workers:
        value = item['id'];

      case AdminReviewType.properties:
        value = item['propertyId'];

      case AdminReviewType.ownerProfileRequests:
        value = item['requestId'];
    }

    return int.tryParse(value?.toString() ?? '');
  }

  String _recordTitle(Map<String, dynamic> item) {
    switch (widget.type) {
      case AdminReviewType.owners:
      case AdminReviewType.workers:
        return _text(item['fullName']);

      case AdminReviewType.properties:
        return _text(item['name']);

      case AdminReviewType.ownerProfileRequests:
        return _text(item['currentFullName']);
    }
  }

  bool _canDecide(Map<String, dynamic> item, {required bool approve}) {
    final id = _recordId(item);

    if (id == null || id <= 0) return false;

    final status = _recordStatus(item);

    switch (widget.type) {
      case AdminReviewType.owners:
      case AdminReviewType.workers:
        if (!['PendingVerification', 'Verified', 'Rejected'].contains(status)) {
          return false;
        }

        return approve ? status != 'Verified' : status != 'Rejected';

      case AdminReviewType.properties:
        return status == 'UnderReview';

      case AdminReviewType.ownerProfileRequests:
        return status == 'Pending';
    }
  }

  Future<void> _load({int page = 1}) async {
    if (_busy) return;

    setState(() {
      _loading = true;
      _error = null;
      _items = [];
    });

    try {
      final response = await _service.getReviewPage(
        type: widget.type,
        status: _statusFilter,
        search: _searchController.text,
        page: page,
      );

      if (!mounted) return;

      final rawItems = response['items'] as List;

      final items = rawItems
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();

      final total = int.tryParse('${response['total']}') ?? items.length;

      final pageSize = int.tryParse('${response['pageSize']}') ?? 20;

      var totalPages = _isWorker && pageSize > 0
          ? (total / pageSize).ceil()
          : 1;

      if (totalPages < 1) totalPages = 1;

      setState(() {
        _items = items;
        _total = total;
        _page = _isWorker ? page : 1;
        _totalPages = totalPages;
      });

      // Another admin may have removed the last pending record
      // while this page was being refreshed.
      if (_isWorker && page > totalPages) {
        setState(() => _loading = false);
        await _load(page: totalPages);
      }
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = _errorText(error);
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _decide(
    Map<String, dynamic> item, {
    required bool approve,
  }) async {
    if (_busy || !_canDecide(item, approve: approve)) {
      return;
    }

    final id = _recordId(item)!;

    setState(() => _confirming = true);

    String? reason;

    try {
      reason = await showDialog<String>(
        context: context,
        barrierDismissible: false,
        builder: (_) => _ReviewDecisionDialog(
          approve: approve,
          subject: _recordTitle(item),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _confirming = false);
      }
    }

    if (!mounted || reason == null) return;

    setState(() => _saving = true);

    try {
      await _service.submitReviewDecision(
        type: widget.type,
        id: id,
        approve: approve,
        rejectionReason: reason,
      );

      if (!mounted) return;

      final message = _isProfileRequest && approve
          ? 'Profile changes approved and applied.'
          : approve
          ? 'Approved successfully.'
          : 'Rejected successfully.';

      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(message)));
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(_errorText(error))));
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }

    if (mounted) {
      // Reload from the backend, including when another admin
      // has already reviewed this record.
      await _load();
    }
  }

  Future<void> _openDocument(dynamic value) async {
    try {
      final rawUrl = value?.toString().trim() ?? '';

      if (rawUrl.isEmpty) {
        throw Exception('No document URL is available.');
      }

      final base = ApiConstants.baseUrl.replaceFirst(RegExp(r'/+$'), '');

      final uri = Uri.parse('$base/').resolve(rawUrl);

      if ((uri.scheme != 'http' && uri.scheme != 'https') || uri.host.isEmpty) {
        throw Exception('The document URL is invalid.');
      }

      final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);

      if (!opened) {
        throw Exception('Could not open this document.');
      }
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(_errorText(error))));
    }
  }

  Map<String, String> _details(Map<String, dynamic> item) {
    switch (widget.type) {
      case AdminReviewType.owners:
        return {
          'Email': _text(item['email']),
          'Mobile': _text(item['mobile']),
          'Registered': _date(item['createdAt']),
          'Verified': _date(item['verifiedAt']),
        };

      case AdminReviewType.workers:
        final skills = item['skills'];
        final skillText = skills is List
            ? skills.map((skill) => skill.toString()).join(', ')
            : '';

        return {
          'Email': _text(item['email']),
          'Mobile': _text(item['mobile']),
          'Skills': _text(skillText),
          'Service area': _text(item['serviceArea']),
          'Hourly rate': _text(item['hourlyRate']),
          'Available': item['isAvailable'] == true ? 'Yes' : 'No',
          'Bio': _text(item['bio']),
          'Registered': _date(item['createdAt']),
          'Verified': _date(item['verifiedAt']),
        };

      case AdminReviewType.properties:
        return {
          'Owner': _text(item['ownerName']),
          'Owner email': _text(item['ownerEmail']),
          'Address': _text(item['address']),
          'City': _text(item['city']),
          'Description': _text(item['description']),
          'Submitted': _date(item['submittedAt']),
          'Verified': _date(item['verifiedAt']),
        };

      case AdminReviewType.ownerProfileRequests:
        return {'Submitted': _date(item['createdAt'])};
    }
  }

  Widget _detailLine(String label, String value) {
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
          SelectableText(value),
        ],
      ),
    );
  }

  Widget _profileComparison(Map<String, dynamic> item) {
    const fields = {
      'Name': ['currentFullName', 'requestedFullName'],
      'Email': ['currentEmail', 'requestedEmail'],
      'Mobile': ['currentMobile', 'requestedMobile'],
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(),
        const Text(
          'Requested changes',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        for (final field in fields.entries)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  field.key,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  'Current: ${_text(item[field.value[0]])}',
                  style: const TextStyle(color: AppColors.secondaryText),
                ),
                const SizedBox(height: 4),
                SelectableText('Requested: ${_text(item[field.value[1]])}'),
              ],
            ),
          ),
      ],
    );
  }

  Widget _documents(Map<String, dynamic> item) {
    final documents = <Map<String, dynamic>>[];

    if (_isWorker) {
      final url = item['proofDocumentUrl']?.toString().trim();

      if (url != null && url.isNotEmpty) {
        documents.add({
          'documentType': item['proofDocumentName'],
          'documentUrl': url,
        });
      }
    } else {
      final rawDocuments = item['documents'];

      if (rawDocuments is List) {
        for (final document in rawDocuments) {
          if (document is Map) {
            documents.add(Map<String, dynamic>.from(document));
          }
        }
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(),
        const Text('Documents', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        if (documents.isEmpty)
          const Text(
            'No documents available.',
            style: TextStyle(color: AppColors.secondaryText),
          ),
        for (final document in documents)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: OutlinedButton.icon(
              onPressed: _busy
                  ? null
                  : () => _openDocument(document['documentUrl']),
              icon: const Icon(Icons.description_outlined),
              label: Text(
                _text(document['documentType']) == '—'
                    ? 'Open document'
                    : _text(document['documentType']),
              ),
            ),
          ),
      ],
    );
  }

  Widget _reviewCard(Map<String, dynamic> item) {
    final status = _recordStatus(item);
    final rejectionReason = item['rejectionReason']?.toString().trim() ?? '';

    final canApprove = _canDecide(item, approve: true);
    final canReject = _canDecide(item, approve: false);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _recordTitle(item),
            style: const TextStyle(
              color: AppColors.heading,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Chip(
            label: Text(_statusLabel(status)),
            visualDensity: VisualDensity.compact,
          ),
          const SizedBox(height: 12),
          for (final detail in _details(item).entries)
            _detailLine(detail.key, detail.value),
          if (rejectionReason.isNotEmpty)
            _detailLine('Rejection reason', rejectionReason),
          if (_isProfileRequest) _profileComparison(item) else _documents(item),
          if (canApprove || canReject) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 10,
              children: [
                if (canApprove)
                  ElevatedButton.icon(
                    onPressed: _busy
                        ? null
                        : () => _decide(item, approve: true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.adminAccent,
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Approve'),
                  ),
                if (canReject)
                  OutlinedButton.icon(
                    onPressed: _busy
                        ? null
                        : () => _decide(item, approve: false),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                    ),
                    icon: const Icon(Icons.cancel_outlined),
                    label: const Text('Reject'),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _filters() {
    return Column(
      children: [
        TextField(
          controller: _searchController,
          enabled: !_busy,
          textInputAction: TextInputAction.search,
          onSubmitted: (_) => _load(),
          decoration: InputDecoration(
            labelText: 'Search',
            hintText: 'Name, email, mobile or property',
            prefixIcon: const Icon(Icons.search),
            border: const OutlineInputBorder(),
            suffixIcon: IconButton(
              tooltip: 'Search',
              onPressed: _busy ? null : () => _load(),
              icon: const Icon(Icons.arrow_forward),
            ),
          ),
        ),
        if (!_isProfileRequest) ...[
          const SizedBox(height: 12),
          InputDecorator(
            decoration: const InputDecoration(
              labelText: 'Status',
              border: OutlineInputBorder(),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _statusFilter,
                isExpanded: true,
                isDense: true,
                items: _statusOptions.map((status) {
                  return DropdownMenuItem<String>(
                    value: status,
                    child: Text(_statusLabel(status)),
                  );
                }).toList(),
                onChanged: _busy
                    ? null
                    : (value) {
                        if (value == null) return;

                        setState(() => _statusFilter = value);
                        _load();
                      },
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _errorPanel() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_error!, style: const TextStyle(color: AppColors.error)),
          TextButton.icon(
            onPressed: _busy ? null : () => _load(page: _page),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _pagination() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        OutlinedButton(
          onPressed: !_busy && _page > 1 ? () => _load(page: _page - 1) : null,
          child: const Text('Previous'),
        ),
        Text('$_page / $_totalPages'),
        OutlinedButton(
          onPressed: !_busy && _page < _totalPages
              ? () => _load(page: _page + 1)
              : null,
          child: const Text('Next'),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_saving,
      child: RoleScaffold(
        title: _title,
        roleLabel: 'Admin',
        expectedRole: 'Admin',
        accentColor: AppColors.adminAccent,
        menuItems: AdminHomeScreen.menuItems,
        currentRoute: _route,
        showBackButton: true,
        child: RefreshIndicator(
          onRefresh: () => _load(page: _page),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            children: [
              _filters(),
              const SizedBox(height: 16),
              if (_saving) ...[
                const LinearProgressIndicator(),
                const SizedBox(height: 8),
                const Text('Saving decision…'),
                const SizedBox(height: 16),
              ],
              if (_loading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 48),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_error != null)
                _errorPanel()
              else ...[
                Text(
                  '$_total matching '
                  '${_isProfileRequest ? 'requests' : 'records'}',
                  style: const TextStyle(color: AppColors.secondaryText),
                ),
                const SizedBox(height: 12),
                if (_isProfileRequest)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 16),
                    child: Text(
                      'Approving a request updates the owner’s '
                      'name, email and mobile in the existing account.',
                    ),
                  ),
                if (_items.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(child: Text('No matching records found.')),
                  ),
                for (final item in _items) _reviewCard(item),
                if (_isWorker && _total > 0) _pagination(),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ReviewDecisionDialog extends StatefulWidget {
  const _ReviewDecisionDialog({required this.approve, required this.subject});

  final bool approve;
  final String subject;

  @override
  State<_ReviewDecisionDialog> createState() => _ReviewDecisionDialogState();
}

class _ReviewDecisionDialogState extends State<_ReviewDecisionDialog> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!widget.approve && !(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    Navigator.of(context)
        .pop(widget.approve ? '' : _reasonController.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.approve ? 'Confirm approval' : 'Confirm rejection'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${widget.approve ? 'Approve' : 'Reject'} '
                '${widget.subject}?',
              ),
              if (!widget.approve) ...[
                const SizedBox(height: 16),
                TextFormField(
                  controller: _reasonController,
                  autofocus: true,
                  minLines: 3,
                  maxLines: 6,
                  decoration: const InputDecoration(
                    labelText: 'Rejection reason',
                    hintText: 'Explain why this is being rejected',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Enter a rejection reason.';
                    }

                    return null;
                  },
                ),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: widget.approve
                ? AppColors.adminAccent
                : AppColors.error,
            foregroundColor: Colors.white,
          ),
          child: Text(widget.approve ? 'Approve' : 'Reject'),
        ),
      ],
    );
  }
}
