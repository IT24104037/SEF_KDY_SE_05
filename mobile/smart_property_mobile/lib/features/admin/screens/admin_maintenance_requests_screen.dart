import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/admin_service.dart';
import 'admin_home_screen.dart';
import 'admin_maintenance_request_details_screen.dart';

class AdminMaintenanceRequestsScreen extends StatefulWidget {
  const AdminMaintenanceRequestsScreen({super.key, this.emergency = false});

  final bool emergency;

  @override
  State<AdminMaintenanceRequestsScreen> createState() =>
      _AdminMaintenanceRequestsScreenState();
}

class _AdminMaintenanceRequestsScreenState
    extends State<AdminMaintenanceRequestsScreen> {
  final _service = AdminService.instance;
  final _searchController = TextEditingController();

  List<Map<String, dynamic>> _requests = [];

  String _status = 'All';
  String _priority = 'All';
  String? _error;

  bool _loading = false;
  bool _archiving = false;
  bool _dialogOpen = false;
  bool _openingDetails = false;

  int _page = 1;
  int _totalPages = 1;
  int _totalCount = 0;

  bool get _busy => _loading || _archiving || _dialogOpen || _openingDetails;

  String get _title =>
      widget.emergency ? 'Emergency Requests' : 'Maintenance Requests';

  String get _route => widget.emergency
      ? AppRoutes.adminEmergencies
      : AppRoutes.adminMaintenance;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _text(dynamic value, [String fallback = '—']) {
    final text = value?.toString().trim() ?? '';
    return text.isEmpty ? fallback : text;
  }

  String _label(String value) {
    return value.replaceAllMapped(
      RegExp(r'([a-z])([A-Z])'),
      (match) => '${match[1]} ${match[2]}',
    );
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

  Color _statusColor(String status) {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return Colors.green;

      case 'Emergency':
      case 'Rejected':
        return AppColors.error;

      case 'InProgress':
      case 'NeedsMoreInfo':
        return Colors.orange;

      case 'Cancelled':
        return Colors.grey;

      default:
        return AppColors.adminAccent;
    }
  }

  Future<void> _load({int page = 1}) async {
    if (_busy) return;

    setState(() {
      _loading = true;
      _error = null;
      _requests = [];
    });

    try {
      final response = await _service.getMaintenanceRequests(
        emergency: widget.emergency,
        search: _searchController.text,
        status: _status,
        priority: widget.emergency ? 'All' : _priority,
        page: page,
      );

      if (!mounted) return;

      final rawRequests = response['requests'];

      if (rawRequests is! List) {
        throw Exception('The server returned an invalid list.');
      }

      var totalPages = int.tryParse('${response['totalPages']}') ?? 1;

      if (totalPages < 1) totalPages = 1;

      if (page > totalPages) {
        setState(() => _loading = false);
        await _load(page: totalPages);
        return;
      }

      setState(() {
        _requests = rawRequests
            .map((item) => Map<String, dynamic>.from(item as Map))
            .toList();

        _page = page;
        _totalPages = totalPages;
        _totalCount = int.tryParse('${response['totalCount']}') ?? 0;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() => _error = _errorText(error));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _viewDetails(Map<String, dynamic> request) async {
    if (_busy) return;

    final id = int.tryParse('${request['id']}');

    if (id == null || id <= 0) return;

    setState(() => _openingDetails = true);

    try {
      await Navigator.of(context).push<void>(
        MaterialPageRoute(
          settings: RouteSettings(name: '${AppRoutes.adminMaintenance}/$id'),
          builder: (_) => AdminMaintenanceRequestDetailsScreen(
            requestId: id,
            emergency: widget.emergency,
            initialRequest: request,
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _openingDetails = false);
      }
    }

    if (mounted) {
      await _load(page: _page);
    }
  }

  Future<void> _archive(Map<String, dynamic> request) async {
    if (_busy || widget.emergency) return;

    final id = int.tryParse('${request['id']}');

    if (id == null ||
        id <= 0 ||
        request['status'] != 'Completed' ||
        request['isArchived'] == true) {
      return;
    }

    setState(() => _dialogOpen = true);

    bool? confirmed;

    try {
      confirmed = await showDialog<bool>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('Remove completed request'),
          content: Text(
            'Remove request #$id from the active list? '
            'Its maintenance history will be preserved.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Remove'),
            ),
          ],
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _dialogOpen = false);
      }
    }

    if (!mounted || confirmed != true) return;

    setState(() => _archiving = true);

    try {
      final response = await _service.archiveMaintenanceRequest(id);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            response['message']?.toString() ?? 'Completed request archived.',
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(_errorText(error))));
    } finally {
      if (mounted) {
        setState(() => _archiving = false);
      }
    }

    if (mounted) {
      await _load(page: _page);
    }
  }

  void _clearFilters() {
    if (_busy) return;

    _searchController.clear();

    setState(() {
      _status = 'All';
      _priority = 'All';
    });

    _load();
  }

  Widget _filter({
    required String label,
    required String value,
    required List<String> options,
    required ValueChanged<String> onChanged,
  }) {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          isDense: true,
          items: options.map((option) {
            return DropdownMenuItem(
              value: option,
              child: Text(_label(option), overflow: TextOverflow.ellipsis),
            );
          }).toList(),
          onChanged: _busy
              ? null
              : (selected) {
                  if (selected == null) return;
                  onChanged(selected);
                },
        ),
      ),
    );
  }

  Widget _requestCard(Map<String, dynamic> request) {
    final id = int.tryParse('${request['id']}');
    final status = _text(request['status']);
    final statusColor = _statusColor(status);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  'Request #${id ?? '—'}',
                  style: const TextStyle(
                    color: AppColors.heading,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _label(status),
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '${_text(request['propertyName'])} · '
            '${_text(request['unitName'])}',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          Text('Tenant: ${_text(request['tenantName'])}'),
          const SizedBox(height: 10),
          Text(
            _text(request['description']),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 10),
          Text(
            widget.emergency
                ? 'Emergency: ${_text(request['emergencyType'])}'
                : 'Category: '
                      '${_text(request['categoryName'], 'Not analysed')}',
          ),
          const SizedBox(height: 4),
          Text(
            'Priority: ${_text(request['priority'], widget.emergency ? 'Critical' : 'Pending')}',
          ),
          const SizedBox(height: 6),
          Text(
            _date(request['createdAt']),
            style: const TextStyle(
              color: AppColors.secondaryText,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              ElevatedButton.icon(
                onPressed: _busy || id == null || id <= 0
                    ? null
                    : () => _viewDetails(request),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.adminAccent,
                  foregroundColor: Colors.white,
                ),
                icon: const Icon(Icons.visibility_outlined),
                label: const Text('View Details'),
              ),
              if (!widget.emergency &&
                  status == 'Completed' &&
                  request['isArchived'] != true)
                OutlinedButton.icon(
                  onPressed: _busy || id == null || id <= 0
                      ? null
                      : () => _archive(request),
                  icon: const Icon(Icons.delete_outline),
                  label: const Text('Remove'),
                ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_archiving,
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
              TextField(
                controller: _searchController,
                enabled: !_busy,
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _load(),
                decoration: InputDecoration(
                  labelText: 'Search requests',
                  hintText: 'Description or category',
                  prefixIcon: const Icon(Icons.search),
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    onPressed: _busy ? null : () => _load(),
                    icon: const Icon(Icons.arrow_forward),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _filter(
                label: 'Status',
                value: _status,
                options: ['All', ...AdminService.maintenanceStatuses],
                onChanged: (value) {
                  setState(() => _status = value);
                  _load();
                },
              ),
              if (!widget.emergency) ...[
                const SizedBox(height: 12),
                _filter(
                  label: 'Priority',
                  value: _priority,
                  options: const ['All', 'Low', 'Medium', 'High', 'Critical'],
                  onChanged: (value) {
                    setState(() => _priority = value);
                    _load();
                  },
                ),
              ],
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                children: [
                  TextButton.icon(
                    onPressed: _busy ? null : () => _load(page: _page),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Refresh'),
                  ),
                  TextButton(
                    onPressed: _busy ? null : _clearFilters,
                    child: const Text('Clear Filters'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (_archiving) ...[
                const LinearProgressIndicator(),
                const SizedBox(height: 16),
              ],
              if (_loading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 48),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_error != null)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _error!,
                      style: const TextStyle(color: AppColors.error),
                    ),
                    TextButton(
                      onPressed: _busy ? null : () => _load(page: _page),
                      child: const Text('Retry'),
                    ),
                  ],
                )
              else ...[
                Text(
                  '$_totalCount matching requests',
                  style: const TextStyle(color: AppColors.secondaryText),
                ),
                const SizedBox(height: 12),
                if (_requests.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(child: Text('No matching requests found.')),
                  ),
                for (final request in _requests) _requestCard(request),
                if (_totalCount > 0)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      OutlinedButton(
                        onPressed: !_busy && _page > 1
                            ? () => _load(page: _page - 1)
                            : null,
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
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
