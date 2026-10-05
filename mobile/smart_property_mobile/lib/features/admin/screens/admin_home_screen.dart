import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/admin_service.dart';

class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  static const List<RoleMenuItem> menuItems = [
    RoleMenuItem(
      label: 'Dashboard',
      icon: Icons.dashboard_outlined,
      route: AppRoutes.admin,
    ),
    RoleMenuItem(
      label: 'User Management',
      icon: Icons.people_outline,
      route: AppRoutes.adminUsers,
    ),
    RoleMenuItem(
      label: 'Owner Verification',
      icon: Icons.verified_user_outlined,
      route: AppRoutes.adminOwnerVerification,
    ),
    RoleMenuItem(
      label: 'Owner Profile Requests',
      icon: Icons.manage_accounts_outlined,
      route: AppRoutes.adminOwnerProfileRequests,
    ),
    RoleMenuItem(
      label: 'Property Verification',
      icon: Icons.apartment_outlined,
      route: AppRoutes.adminPropertyVerification,
    ),
    RoleMenuItem(
      label: 'Worker Verification',
      icon: Icons.engineering_outlined,
      route: AppRoutes.adminWorkers,
    ),
    RoleMenuItem(
      label: 'Maintenance Requests',
      icon: Icons.build_outlined,
      route: AppRoutes.adminMaintenance,
    ),
    RoleMenuItem(
      label: 'Emergency Requests',
      icon: Icons.warning_amber_rounded,
      route: AppRoutes.adminEmergencies,
    ),
    RoleMenuItem(
      label: 'Maintenance Categories',
      icon: Icons.category_outlined,
      route: AppRoutes.adminCategories,
    ),
    RoleMenuItem(
      label: 'Maintenance History',
      icon: Icons.history,
      route: AppRoutes.adminMaintenanceHistory,
    ),
    RoleMenuItem(
      label: 'AI Monitoring',
      icon: Icons.auto_awesome_outlined,
      route: AppRoutes.adminAiMonitoring,
    ),
  ];

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  final AdminService _service = AdminService.instance;

  Map<String, dynamic>? _summary;

  bool _loading = true;
  bool _fetching = false;

  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted || _fetching) return;

    _fetching = true;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final summary = await _service.getDashboardSummary();

      if (!mounted) return;

      setState(() {
        _summary = summary;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString();
      });
    } finally {
      _fetching = false;

      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _openUsers() async {
    await Navigator.pushNamed(context, AppRoutes.adminUsers);

    if (mounted) {
      await _load();
    }
  }

  Widget _summaryCard({
    required String title,
    required String keyName,
    required IconData icon,
    required Color color,
  }) {
    final value = _summary?[keyName]?.toString() ?? '-';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                color: AppColors.heading,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 28,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _errorCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Text(
            _error!,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.error),
          ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh),
            label: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return RoleScaffold(
      title: 'Admin Dashboard',
      roleLabel: 'Admin',
      expectedRole: 'Admin',
      accentColor: AppColors.adminAccent,
      menuItems: AdminHomeScreen.menuItems,
      currentRoute: AppRoutes.admin,
      child: RefreshIndicator(
        color: AppColors.adminAccent,
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Admin Dashboard',
                    style: TextStyle(
                      color: AppColors.heading,
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Refresh Dashboard',
                  onPressed: _loading ? null : _load,
                  icon: const Icon(Icons.refresh, color: AppColors.adminAccent),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Review system activity and manage accounts.',
              style: TextStyle(color: AppColors.secondaryText, height: 1.4),
            ),
            const SizedBox(height: 24),

            if (_loading)
              const Padding(
                padding: EdgeInsets.all(35),
                child: Center(
                  child: CircularProgressIndicator(
                    color: AppColors.adminAccent,
                  ),
                ),
              )
            else if (_error != null)
              _errorCard()
            else ...[
              _summaryCard(
                title: 'Total Users',
                keyName: 'totalUsers',
                icon: Icons.people_outline,
                color: AppColors.adminAccent,
              ),
              _summaryCard(
                title: 'Maintenance Requests',
                keyName: 'maintenanceRequests',
                icon: Icons.build_outlined,
                color: AppColors.ownerAccent,
              ),
              _summaryCard(
                title: 'Emergency Requests',
                keyName: 'emergencyRequests',
                icon: Icons.warning_amber_rounded,
                color: AppColors.error,
              ),
              _summaryCard(
                title: 'Active AI Workflows',
                keyName: 'activeAiWorkflows',
                icon: Icons.auto_awesome,
                color: AppColors.adminAccent,
              ),
              const SizedBox(height: 10),
              FilledButton.icon(
                onPressed: _openUsers,
                icon: const Icon(Icons.people_outline),
                label: const Text('Open User Management'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
