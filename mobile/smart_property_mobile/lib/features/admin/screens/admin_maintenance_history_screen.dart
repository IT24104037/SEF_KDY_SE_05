import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/admin_service.dart';
import 'admin_home_screen.dart';

class AdminMaintenanceHistoryScreen extends StatefulWidget {
  const AdminMaintenanceHistoryScreen({super.key});

  @override
  State<AdminMaintenanceHistoryScreen> createState() =>
      _AdminMaintenanceHistoryScreenState();
}

class _AdminMaintenanceHistoryScreenState
    extends State<AdminMaintenanceHistoryScreen> {
  final _service = AdminService.instance;
  final _searchController = TextEditingController();

  List<Map<String, dynamic>> _requests = [];

  String _requestType = 'All';
  String _status = 'All';
  String? _error;

  bool _loading = false;

  int _page = 1;
  int _totalPages = 1;
  int _totalCount = 0;

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
    if (value == 'NORMAL') return 'Normal';
    if (value == 'EMERGENCY') return 'Emergency';

    return value.replaceAllMapped(
      RegExp(r'([a-z])([A-Z])'),
      (match) => '${match[1]} ${match[2]}',
    );
  }

  String _date(dynamic value) {
    final date = DateTime.tryParse(value?.toString() ?? '')?.toLocal();

    if (date == null) return '—';

    String two(int number) => number.toString().padLeft(2, '0');

    return '${two(date.day)}/${two(date.month)}/${date.year} '
        '${two(date.hour)}:${two(date.minute)}';
  }

  Future<void> _load({int page = 1}) async {
    if (_loading) return;

    setState(() {
      _loading = true;
      _error = null;
      _requests = [];
    });

    try {
      final response = await _service.getMaintenanceHistoryRequests(
        search: _searchController.text,
        requestType: _requestType,
        status: _status,
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

      setState(() {
        _error = error.toString().replaceFirst(RegExp(r'^Exception:\s*'), '');
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  void _clearFilters() {
    if (_loading) return;

    _searchController.clear();

    setState(() {
      _requestType = 'All';
      _status = 'All';
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
          onChanged: _loading
              ? null
              : (selected) {
                  if (selected == null) return;
                  onChanged(selected);
                },
        ),
      ),
    );
  }

  Widget _line(String label, dynamic value) {
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
          Text(_text(value)),
        ],
      ),
    );
  }

  Widget _historyCard(Map<String, dynamic> request) {
    final archived = request['isArchived'] == true;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Request #${_text(request['id'])}',
            style: const TextStyle(
              color: AppColors.heading,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              Chip(
                label: Text(_label(_text(request['requestType']))),
                visualDensity: VisualDensity.compact,
              ),
              Chip(
                label: Text(_label(_text(request['status']))),
                visualDensity: VisualDensity.compact,
              ),
              if (archived)
                const Chip(
                  avatar: Icon(Icons.archive_outlined, size: 18),
                  label: Text('Archived'),
                  visualDensity: VisualDensity.compact,
                ),
            ],
          ),
          const SizedBox(height: 12),
          _line(
            'Property',
            _text(request['propertyName'], '#${request['propertyId']}'),
          ),
          _line('Unit', _text(request['unitName'], '#${request['unitId']}')),
          _line('Description', request['description']),
          if (request['requestType'] == 'EMERGENCY')
            _line('Emergency type', request['emergencyType']),
          _line('Category', request['categoryName']),
          _line('Priority', request['priority']),
          _line('Created', _date(request['createdAt'])),
          _line('Last updated', _date(request['updatedAt'])),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return RoleScaffold(
      title: 'Maintenance History',
      roleLabel: 'Admin',
      expectedRole: 'Admin',
      accentColor: AppColors.adminAccent,
      menuItems: AdminHomeScreen.menuItems,
      currentRoute: AppRoutes.adminMaintenanceHistory,
      showBackButton: true,
      child: RefreshIndicator(
        onRefresh: () => _load(page: _page),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'History of normal and emergency requests, '
              'including archived records.',
              style: TextStyle(color: AppColors.secondaryText),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _searchController,
              enabled: !_loading,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _load(),
              decoration: InputDecoration(
                labelText: 'Search history',
                hintText: 'Description or property name',
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  onPressed: _loading ? null : () => _load(),
                  icon: const Icon(Icons.arrow_forward),
                ),
              ),
            ),
            const SizedBox(height: 12),
            _filter(
              label: 'Request type',
              value: _requestType,
              options: const ['All', 'NORMAL', 'EMERGENCY'],
              onChanged: (value) {
                setState(() => _requestType = value);
                _load();
              },
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
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              children: [
                TextButton.icon(
                  onPressed: _loading ? null : () => _load(page: _page),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Refresh'),
                ),
                TextButton(
                  onPressed: _loading ? null : _clearFilters,
                  child: const Text('Clear Filters'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_error!, style: const TextStyle(color: AppColors.error)),
                  TextButton(
                    onPressed: () => _load(page: _page),
                    child: const Text('Retry'),
                  ),
                ],
              )
            else ...[
              Text(
                '$_totalCount matching records',
                style: const TextStyle(color: AppColors.secondaryText),
              ),
              const SizedBox(height: 12),
              if (_requests.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(child: Text('No maintenance history found.')),
                ),
              for (final request in _requests) _historyCard(request),
              if (_totalCount > 0)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    OutlinedButton(
                      onPressed: _page > 1
                          ? () => _load(page: _page - 1)
                          : null,
                      child: const Text('Previous'),
                    ),
                    Text('$_page / $_totalPages'),
                    OutlinedButton(
                      onPressed: _page < _totalPages
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
    );
  }
}
