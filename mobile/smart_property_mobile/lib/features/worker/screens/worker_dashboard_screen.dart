import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/dashboard_action_card.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../widgets/worker_overview_card.dart';

class WorkerDashboardScreen extends StatelessWidget {
  const WorkerDashboardScreen({super.key});

  static const List<RoleMenuItem> menuItems = [
    RoleMenuItem(
      label: 'Dashboard',
      icon: Icons.dashboard_outlined,
      route: AppRoutes.worker,
    ),
    RoleMenuItem(
      label: 'My Jobs',
      icon: Icons.work_outline,
      route: AppRoutes.workerJobs,
    ),
    RoleMenuItem(
      label: 'Availability',
      icon: Icons.calendar_month_outlined,
      route: AppRoutes.workerAvailability,
    ),
    RoleMenuItem(
      label: 'Job History',
      icon: Icons.history,
      route: AppRoutes.workerJobHistory,
    ),
    RoleMenuItem(
      label: 'Profile',
      icon: Icons.person_outline,
      route: AppRoutes.workerProfile,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return RoleScaffold(
      title: 'Maintenance Command Center',
      roleLabel: 'Maintenance Worker',
      expectedRole: 'MaintenanceWorker',
      accentColor: AppColors.workerAccent,
      menuItems: menuItems,
      currentRoute: AppRoutes.worker,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Maintenance Command Center',
            style: TextStyle(
              color: AppColors.heading,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Manage assigned jobs, schedule and availability.',
            style: TextStyle(color: AppColors.secondaryText),
          ),
          const SizedBox(height: 22),
          const WorkerOverviewCard(),
          const SizedBox(height: 16),
          DashboardActionCard(
            title: 'My Jobs',
            subtitle: 'View your assigned maintenance work orders.',
            icon: Icons.work_outline,
            accentColor: AppColors.workerAccent,
            onTap: () => Navigator.pushNamed(context, AppRoutes.workerJobs),
          ),
          const SizedBox(height: 12),
          DashboardActionCard(
            title: 'Availability',
            subtitle: 'Manage your current availability and work schedule.',
            icon: Icons.calendar_month_outlined,
            accentColor: AppColors.workerAccent,
            onTap: () =>
                Navigator.pushNamed(context, AppRoutes.workerAvailability),
          ),
          const SizedBox(height: 12),
          DashboardActionCard(
            title: 'Job History',
            subtitle: 'Review completed and previous maintenance jobs.',
            icon: Icons.history,
            accentColor: AppColors.workerAccent,
            onTap: () =>
                Navigator.pushNamed(context, AppRoutes.workerJobHistory),
          ),
        ],
      ),
    );
  }
}
