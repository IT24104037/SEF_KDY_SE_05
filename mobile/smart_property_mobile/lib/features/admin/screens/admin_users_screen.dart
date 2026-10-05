import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/admin_service.dart';
import 'admin_home_screen.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  final AdminService _service = AdminService.instance;

  final TextEditingController _searchController = TextEditingController();

  List<Map<String, dynamic>> _users = [];

  String _roleFilter = 'All';
  String _statusFilter = 'All';

  bool _loading = true;
  String? _error;

  int _page = 1;
  int _totalPages = 1;
  int _totalCount = 0;
  int _loadGeneration = 0;

  int? _changingUserId;

  bool get _busy => _loading || _changingUserId != null;

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

  String _text(dynamic value, [String fallback = '-']) {
    final text = value?.toString().trim() ?? '';

    return text.isEmpty ? fallback : text;
  }

  String _roleLabel(String role) {
    switch (role) {
      case 'PropertyOwner':
        return 'Property Owner';
      case 'MaintenanceWorker':
        return 'Maintenance Worker';
      default:
        return role;
    }
  }

  Future<void> _load({int? page}) async {
    if (!mounted || _changingUserId != null) return;

    final generation = ++_loadGeneration;
    final requestedPage = page ?? _page;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final bool? activeFilter = _statusFilter == 'Active'
          ? true
          : _statusFilter == 'Suspended'
          ? false
          : null;

      final result = await _service.getUsers(
        search: _searchController.text,
        role: _roleFilter == 'All' ? null : _roleFilter,
        isActive: activeFilter,
        page: requestedPage,
      );

      final rawUsers = result['users'];

      if (rawUsers is! List) {
        throw Exception('Unexpected user list response.');
      }

      final users = rawUsers
          .whereType<Map>()
          .map((user) => Map<String, dynamic>.from(user))
          .toList();

      final totalPages = int.tryParse('${result['totalPages']}') ?? 1;

      final totalCount = int.tryParse('${result['totalCount']}') ?? 0;

      if (!mounted || generation != _loadGeneration) {
        return;
      }

      if (totalPages > 0 && requestedPage > totalPages) {
        await _load(page: totalPages);
        return;
      }

      setState(() {
        _users = users;
        _page = requestedPage;
        _totalPages = totalPages;
        _totalCount = totalCount;
      });
    } catch (error) {
      if (mounted && generation == _loadGeneration) {
        setState(() {
          _error = error.toString();
        });
      }
    } finally {
      if (mounted && generation == _loadGeneration) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _changeUserStatus(Map<String, dynamic> user) async {
    if (_busy) return;

    final userId = int.tryParse('${user['id']}');

    if (userId == null || userId <= 0) return;

    final isActive = user['isActive'] == true;
    final action = isActive ? 'Suspend' : 'Reactivate';
    final name = _text(user['fullName'], 'this user');

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('$action User?'),
        content: Text('$action the account for $name?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(action),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted || _busy) {
      return;
    }

    setState(() {
      _changingUserId = userId;
    });

    try {
      final result = isActive
          ? await _service.suspendUser(userId)
          : await _service.reactivateUser(userId);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_text(result['message'], 'Account updated.'))),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.toString())));
      }
    } finally {
      if (mounted) {
        setState(() {
          _changingUserId = null;
        });
      }
    }

    if (mounted) {
      await _load();
    }
  }

  Widget _roleFilterField() {
    return InputDecorator(
      decoration: const InputDecoration(labelText: 'Role'),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _roleFilter,
          isExpanded: true,
          isDense: true,
          items: const [
            DropdownMenuItem(value: 'All', child: Text('All Roles')),
            DropdownMenuItem(value: 'Admin', child: Text('Admin')),
            DropdownMenuItem(
              value: 'PropertyOwner',
              child: Text('Property Owner'),
            ),
            DropdownMenuItem(value: 'Tenant', child: Text('Tenant')),
            DropdownMenuItem(
              value: 'MaintenanceWorker',
              child: Text('Maintenance Worker'),
            ),
          ],
          onChanged: _busy
              ? null
              : (value) {
                  if (value == null) return;

                  setState(() {
                    _roleFilter = value;
                  });

                  _load(page: 1);
                },
        ),
      ),
    );
  }

  Widget _statusFilterField() {
    return InputDecorator(
      decoration: const InputDecoration(labelText: 'Account Status'),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _statusFilter,
          isExpanded: true,
          isDense: true,
          items: const [
            DropdownMenuItem(value: 'All', child: Text('All Statuses')),
            DropdownMenuItem(value: 'Active', child: Text('Active')),
            DropdownMenuItem(value: 'Suspended', child: Text('Suspended')),
          ],
          onChanged: _busy
              ? null
              : (value) {
                  if (value == null) return;

                  setState(() {
                    _statusFilter = value;
                  });

                  _load(page: 1);
                },
        ),
      ),
    );
  }

  Widget _userCard(Map<String, dynamic> user) {
    final isActive = user['isActive'] == true;
    final userId = int.tryParse('${user['id']}');
    final updating = _changingUserId == userId;

    final statusColor = isActive ? AppColors.ownerAccent : AppColors.error;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.person_outline, color: AppColors.adminAccent),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  _text(user['fullName'], 'User'),
                  style: const TextStyle(
                    color: AppColors.heading,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _roleLabel(_text(user['role'])),
            style: const TextStyle(
              color: AppColors.adminAccent,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Email: ${_text(user['email'])}',
            style: const TextStyle(color: AppColors.secondaryText),
          ),
          const SizedBox(height: 6),
          Text(
            'Mobile: ${_text(user['mobile'])}',
            style: const TextStyle(color: AppColors.secondaryText),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              isActive ? 'Active' : 'Suspended',
              style: TextStyle(
                color: statusColor,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _busy ? null : () => _changeUserStatus(user),
            icon: Icon(
              isActive ? Icons.block_outlined : Icons.check_circle_outline,
            ),
            label: Text(
              updating
                  ? 'Updating...'
                  : isActive
                  ? 'Suspend Account'
                  : 'Reactivate Account',
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _changingUserId == null,
      child: RoleScaffold(
        title: 'User Management',
        roleLabel: 'Admin',
        expectedRole: 'Admin',
        accentColor: AppColors.adminAccent,
        menuItems: AdminHomeScreen.menuItems,
        currentRoute: AppRoutes.adminUsers,
        showBackButton: true,
        child: RefreshIndicator(
          color: AppColors.adminAccent,
          onRefresh: _load,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            children: [
              const Text(
                'User Management',
                style: TextStyle(
                  color: AppColors.heading,
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Search accounts and manage their active status.',
                style: TextStyle(color: AppColors.secondaryText),
              ),
              const SizedBox(height: 18),
              TextField(
                controller: _searchController,
                enabled: !_busy,
                decoration: InputDecoration(
                  labelText: 'Search name, email or mobile',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: IconButton(
                    onPressed: _busy ? null : () => _load(page: 1),
                    icon: const Icon(Icons.arrow_forward),
                  ),
                ),
                onSubmitted: (_) => _load(page: 1),
              ),
              const SizedBox(height: 16),
              _roleFilterField(),
              const SizedBox(height: 16),
              _statusFilterField(),
              const SizedBox(height: 20),

              if (_loading)
                const Padding(
                  padding: EdgeInsets.all(30),
                  child: Center(
                    child: CircularProgressIndicator(
                      color: AppColors.adminAccent,
                    ),
                  ),
                )
              else if (_error != null)
                Column(
                  children: [
                    Text(
                      _error!,
                      style: const TextStyle(color: AppColors.error),
                    ),
                    TextButton.icon(
                      onPressed: () => _load(),
                      icon: const Icon(Icons.refresh),
                      label: const Text('Try Again'),
                    ),
                  ],
                )
              else ...[
                Text(
                  '$_totalCount matching users',
                  style: const TextStyle(color: AppColors.secondaryText),
                ),
                const SizedBox(height: 12),

                if (_users.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(child: Text('No matching users found.')),
                  )
                else
                  ..._users.map(_userCard),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: !_busy && _page > 1
                          ? () => _load(page: _page - 1)
                          : null,
                      child: const Text('Previous'),
                    ),
                    Text(
                      'Page $_page of '
                      '${_totalPages < 1 ? 1 : _totalPages}',
                    ),
                    TextButton(
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
