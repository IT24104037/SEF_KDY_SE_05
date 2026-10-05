import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/dashboard_action_card.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/property_service.dart';

class OwnerDashboardScreen extends StatefulWidget {
  const OwnerDashboardScreen({super.key});

  static const List<RoleMenuItem> menuItems = [
    RoleMenuItem(
      label: 'Dashboard',
      icon: Icons.dashboard_outlined,
      route: AppRoutes.ownerDashboard,
    ),
    RoleMenuItem(
      label: 'Properties',
      icon: Icons.apartment_outlined,
      route: AppRoutes.ownerProperties,
    ),
    RoleMenuItem(
      label: 'Tenants',
      icon: Icons.people_outline,
      route: AppRoutes.ownerTenants,
    ),
    RoleMenuItem(
      label: 'Maintenance Requests',
      icon: Icons.build_outlined,
      route: AppRoutes.ownerMaintenance,
    ),
    RoleMenuItem(
      label: 'Emergency Requests',
      icon: Icons.warning_amber_rounded,
      route: AppRoutes.ownerEmergency,
    ),
    RoleMenuItem(
      label: 'Maintenance History',
      icon: Icons.history,
      route: AppRoutes.ownerMaintenanceHistory,
    ),
    RoleMenuItem(
      label: 'Work Orders',
      icon: Icons.assignment_outlined,
      route: AppRoutes.ownerWorkOrders,
    ),
    RoleMenuItem(
      label: 'Owner Approvals',
      icon: Icons.fact_check_outlined,
      route: AppRoutes.ownerApproval,
    ),
    RoleMenuItem(
      label: 'AI Workflow',
      icon: Icons.auto_awesome_outlined,
      route: AppRoutes.ownerAiWorkflow,
    ),
    RoleMenuItem(
      label: 'Profile',
      icon: Icons.person_outline,
      route: AppRoutes.ownerProfile,
    ),
  ];

  @override
  State<OwnerDashboardScreen> createState() => _OwnerDashboardScreenState();
}

class _OwnerDashboardScreenState extends State<OwnerDashboardScreen> {
  final PropertyService _service = PropertyService.instance;

  Map<String, dynamic>? _dashboard;

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
      final result = await _service.getDashboard();

      if (!mounted) return;

      setState(() {
        _dashboard = result;
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

  int _value(String key) {
    final value = _dashboard?[key];

    if (value is int) {
      return value;
    }

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    return RoleScaffold(
      title: 'Owner Portal',
      roleLabel: 'Owner',
      expectedRole: 'PropertyOwner',
      accentColor: AppColors.ownerAccent,
      menuItems: OwnerDashboardScreen.menuItems,
      currentRoute: AppRoutes.ownerDashboard,
      child: RefreshIndicator(
        color: AppColors.ownerAccent,
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'Owner Dashboard',
              style: TextStyle(
                color: AppColors.heading,
                fontSize: 24,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Manage your properties, units, tenants and maintenance.',
              style: TextStyle(color: AppColors.secondaryText),
            ),
            const SizedBox(height: 22),

            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(28),
                  child: CircularProgressIndicator(
                    color: AppColors.ownerAccent,
                  ),
                ),
              )
            else if (_error != null)
              Text(_error!, style: const TextStyle(color: AppColors.error))
            else ...[
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _StatCard(
                    title: 'Total Properties',
                    value: _value('totalProperties'),
                  ),
                  _StatCard(
                    title: 'Active Properties',
                    value: _value('activeProperties'),
                  ),

                  _StatCard(
                    title: 'Archived Properties',
                    value: _value('archivedProperties'),
                  ),
                  _StatCard(
                    title: 'Active Units',
                    value: _value('activeUnits'),
                  ),
                  _StatCard(
                    title: 'Archived Units',
                    value: _value('archivedUnits'),
                  ),

                  _StatCard(title: 'Total Units', value: _value('totalUnits')),
                  _StatCard(
                    title: 'Occupied Units',
                    value: _value('occupiedUnits'),
                  ),
                  _StatCard(
                    title: 'Vacant Units',
                    value: _value('vacantUnits'),
                  ),
                ],
              ),
            ],

            const SizedBox(height: 26),

            DashboardActionCard(
              title: 'Properties',
              subtitle: 'Manage your properties and units.',
              icon: Icons.apartment_outlined,
              accentColor: AppColors.ownerAccent,
              onTap: () =>
                  Navigator.pushNamed(context, AppRoutes.ownerProperties),
            ),

            const SizedBox(height: 12),

            DashboardActionCard(
              title: 'Tenants',
              subtitle: 'Create tenants and manage tenancies.',
              icon: Icons.people_outline,
              accentColor: AppColors.ownerAccent,
              onTap: () => Navigator.pushNamed(context, AppRoutes.ownerTenants),
            ),

            const SizedBox(height: 12),

            DashboardActionCard(
              title: 'Maintenance Requests',
              subtitle: 'Review maintenance requests submitted by tenants.',
              icon: Icons.build_outlined,
              accentColor: AppColors.ownerAccent,
              onTap: () =>
                  Navigator.pushNamed(context, AppRoutes.ownerMaintenance),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.title, required this.value});

  final String title;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 155,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D16222A),
            blurRadius: 16,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 3,
            decoration: BoxDecoration(
              color: AppColors.ownerAccent,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: AppColors.secondaryText,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 7),
          Text(
            '$value',
            style: const TextStyle(
              color: AppColors.heading,
              fontSize: 26,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
