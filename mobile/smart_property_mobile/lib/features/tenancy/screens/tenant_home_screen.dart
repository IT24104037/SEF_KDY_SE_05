import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/dashboard_action_card.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/tenancy_service.dart';

class TenantHomeScreen extends StatefulWidget {
  const TenantHomeScreen({super.key});

  static const List<RoleMenuItem> menuItems = [
    RoleMenuItem(
      label: 'My Home',
      icon: Icons.home_outlined,
      route: AppRoutes.tenantHome,
    ),
    RoleMenuItem(
      label: 'Report Maintenance',
      icon: Icons.build_outlined,
      route: AppRoutes.tenantReportMaintenance,
    ),
    RoleMenuItem(
      label: 'Report Emergency',
      icon: Icons.warning_amber_rounded,
      route: AppRoutes.tenantReportEmergency,
    ),
    RoleMenuItem(
      label: 'My Maintenance Requests',
      icon: Icons.assignment_outlined,
      route: AppRoutes.tenantMaintenanceRequests,
    ),
    RoleMenuItem(
      label: 'Tenancy History',
      icon: Icons.history,
      route: AppRoutes.tenantTenancyHistory,
    ),
    RoleMenuItem(
      label: 'Updates',
      icon: Icons.notifications_none,
      route: AppRoutes.tenantNotifications,
    ),
    RoleMenuItem(
      label: 'Profile',
      icon: Icons.person_outline,
      route: AppRoutes.tenantProfile,
    ),
  ];

  @override
  State<TenantHomeScreen> createState() => _TenantHomeScreenState();
}

class _TenantHomeScreenState extends State<TenantHomeScreen> {
  final TenancyService _service = TenancyService.instance;

  Map<String, dynamic>? _tenancy;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final tenancy = await _service.getCurrentTenancy();

      if (!mounted) return;

      setState(() {
        _tenancy = tenancy;
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

  String _date(dynamic value) {
    if (value == null) return '-';

    final date = DateTime.tryParse(value.toString());

    if (date == null) return '-';

    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return RoleScaffold(
      title: 'Tenant Portal',
      roleLabel: 'Tenant',
      expectedRole: 'Tenant',
      accentColor: AppColors.tenantAccent,
      menuItems: TenantHomeScreen.menuItems,
      currentRoute: AppRoutes.tenantHome,
      child: RefreshIndicator(
        color: AppColors.tenantAccent,
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'My Home',
              style: TextStyle(
                color: AppColors.heading,
                fontSize: 24,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'View your tenancy and manage maintenance requests.',
              style: TextStyle(color: AppColors.secondaryText),
            ),
            const SizedBox(height: 20),

            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(30),
                  child: CircularProgressIndicator(
                    color: AppColors.tenantAccent,
                  ),
                ),
              )
            else if (_error != null)
              _MessageBox(message: _error!, error: true)
            else if (_tenancy == null)
              const _NoTenancyCard()
            else
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0D16222A),
                      blurRadius: 20,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 3,
                      decoration: BoxDecoration(
                        color: AppColors.tenantAccent,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Unit ${_tenancy!['unitName'] ?? _tenancy!['unitId'] ?? '-'}',
                      style: const TextStyle(
                        color: AppColors.heading,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Move-in date: ${_date(_tenancy!['startDate'])}',
                      style: const TextStyle(color: AppColors.secondaryText),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.successBackground,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Active',
                        style: TextStyle(
                          color: AppColors.success,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 24),

            DashboardActionCard(
              title: 'Report Maintenance',
              subtitle: 'Take a photo with your camera or choose one from your gallery.',
              icon: Icons.camera_alt_outlined,
              accentColor: AppColors.tenantAccent,
              onTap: () => Navigator.pushNamed(
                context,
                AppRoutes.tenantReportMaintenance,
              ),
            ),

            const SizedBox(height: 12),

            DashboardActionCard(
              title: 'Report Emergency',
              subtitle: 'Report an urgent maintenance issue.',
              icon: Icons.warning_amber_rounded,
              accentColor: const Color(0xFFB91C1C),
              onTap: () =>
                  Navigator.pushNamed(context, AppRoutes.tenantReportEmergency),
            ),

            const SizedBox(height: 12),

            DashboardActionCard(
              title: 'My Maintenance Requests',
              subtitle:
                  'Track your submitted requests and their current status.',
              icon: Icons.assignment_outlined,
              accentColor: AppColors.tenantAccent,
              onTap: () => Navigator.pushNamed(
                context,
                AppRoutes.tenantMaintenanceRequests,
              ),
            ),

            const SizedBox(height: 12),

            DashboardActionCard(
              title: 'Notifications',
              subtitle:
                  'View approval, rejection and worker assignment updates.',
              icon: Icons.notifications_none,
              accentColor: AppColors.tenantAccent,
              onTap: () =>
                  Navigator.pushNamed(context, AppRoutes.tenantNotifications),
            ),
          ],
        ),
      ),
    );
  }
}

class _NoTenancyCard extends StatelessWidget {
  const _NoTenancyCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Text(
        "You don't have an active tenancy right now.",
        style: TextStyle(color: AppColors.secondaryText),
      ),
    );
  }
}

class _MessageBox extends StatelessWidget {
  const _MessageBox({required this.message, required this.error});

  final String message;
  final bool error;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: error ? AppColors.errorBackground : AppColors.successBackground,
        border: Border.all(
          color: error ? AppColors.errorBorder : AppColors.successBorder,
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        message,
        style: TextStyle(color: error ? AppColors.error : AppColors.success),
      ),
    );
  }
}
