import 'package:flutter/material.dart';

import '../core/storage/secure_storage_service.dart';
import '../core/theme/app_colors.dart';

import '../features/admin/screens/admin_home_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/maintenance/screens/my_requests_screen.dart';
import '../features/maintenance/screens/report_emergency_screen.dart';
import '../features/maintenance/screens/report_maintenance_screen.dart';
import '../features/property/screens/owner_dashboard_screen.dart';
import '../features/tenancy/screens/tenant_home_screen.dart';
import '../features/worker/screens/worker_dashboard_screen.dart';

import '../features/admin/screens/admin_users_screen.dart';
import '../features/admin/screens/admin_verification_screens.dart';
import '../features/admin/screens/admin_maintenance_requests_screen.dart';
import '../features/admin/screens/admin_maintenance_categories_screen.dart';
import '../features/admin/screens/admin_maintenance_history_screen.dart';
import '../features/admin/screens/admin_ai_monitoring_screen.dart';

//tenancy
import '../features/tenancy/screens/activate_account_screen.dart';
import '../features/tenancy/screens/tenant_notifications_screen.dart';
import '../features/tenancy/screens/tenant_profile_screen.dart';
import '../features/tenancy/screens/tenancy_history_screen.dart';
import '../features/tenancy/screens/owner_add_tenant_screen.dart';
import '../features/tenancy/screens/owner_tenant_details_screen.dart';
import '../features/tenancy/screens/owner_tenants_screen.dart';

//owner
import '../features/property/screens/owner_add_property_screen.dart';
import '../features/property/screens/owner_properties_screen.dart';
import '../features/property/screens/owner_units_screen.dart';
import '../features/property/screens/owner_maintenance_details_screen.dart';
import '../features/property/screens/owner_maintenance_history_screen.dart';
import '../features/property/screens/owner_maintenance_screen.dart';
import '../features/property/screens/owner_work_orders_screen.dart';
import '../features/property/screens/owner_approval_screen.dart';
import '../features/property/screens/owner_recommendation_screen.dart';
import '../features/property/screens/owner_profile_screen.dart';

//worker
import '../features/worker/screens/availability_screen.dart';
import '../features/worker/screens/job_details_screen.dart';
import '../features/worker/screens/job_history_screen.dart';
import '../features/worker/screens/my_jobs_screen.dart';
import '../features/worker/screens/worker_profile_screen.dart';

import '../core/widgets/owner_verification_gate.dart';
import '../features/auth/screens/account_registration_screen.dart';
import '../features/auth/screens/account_verification_screen.dart';
import '../features/property/screens/owner_ai_workflow_screen.dart';
import '../features/property/screens/owner_work_order_details_screen.dart';
import '../features/tenancy/screens/owner_tenancies_screen.dart';

abstract final class AppRoutes {
  static const String root = '/';
  static const String login = '/login';

  static const String registerOwner = '/register-owner';
  static const String activateTenant = '/activate-tenant';
  static const String registerWorker = '/register-worker';

  // ADMIN
  static const String admin = '/admin';
  static const String adminUsers = '/admin/users';
  static const String adminOwnerVerification = '/admin/owner-verification';
  static const String adminOwnerProfileRequests =
      '/admin/owner-profile-requests';
  static const String adminPropertyVerification =
      '/admin/property-verification';
  static const String adminWorkers = '/admin/workers';
  static const String adminMaintenance = '/admin/maintenance';
  static const String adminEmergencies = '/admin/emergencies';
  static const String adminCategories = '/admin/categories';
  static const String adminMaintenanceHistory = '/admin/maintenance-history';
  static const String adminAiMonitoring = '/admin/ai-monitoring';

  // OWNER
  static const String owner = '/owner';
  static const String ownerDashboard = '/owner/dashboard';
  static const String ownerProperties = '/owner/properties';
  static const String ownerTenants = '/owner/tenants';
  static const String ownerPropertiesAdd = '/owner/properties/add';
  static const String ownerTenantsAdd = '/owner/tenants/add';
  static const String ownerMaintenance = '/owner/maintenance';
  static const String ownerEmergency = '/owner/emergency';
  static const String ownerMaintenanceHistory = '/owner/maintenance-history';
  static const String ownerProfile = '/owner/profile';
  static const String ownerApproval = '/owner/approval';
  static const String ownerAiWorkflow = '/owner/ai-workflow';
  static const String ownerWorkOrders = '/owner/work-orders';
  static const String ownerVerification = '/owner/verification';

  // TENANT
  static const String tenant = '/tenant';
  static const String tenantHome = '/tenant/home';
  static const String tenantTenancyHistory = '/tenant/tenancy-history';
  static const String tenantProfile = '/tenant/profile';
  static const String tenantNotifications = '/tenant/notifications';
  static const String tenantReportMaintenance = '/tenant/maintenance/report';
  static const String tenantReportEmergency = '/tenant/maintenance/emergency';
  static const String tenantMaintenanceRequests =
      '/tenant/maintenance/requests';

  // WORKER
  static const String worker = '/worker';
  static const String workerVerification = '/worker/verification';
  static const String workerRegistration = '/worker/registration';

  static const String workerJobs = '/worker/jobs';
  static const String workerAvailability = '/worker/availability';
  static const String workerJobHistory = '/worker/job-history';
  static const String workerProfile = '/worker/profile';
}

abstract final class AppRouter {
  static String routeForRole(String role) {
    switch (role) {
      case 'Admin':
        return AppRoutes.admin;
      case 'PropertyOwner':
        return AppRoutes.ownerDashboard;
      case 'Tenant':
        return AppRoutes.tenantHome;
      case 'MaintenanceWorker':
        return AppRoutes.worker;
      default:
        return AppRoutes.login;
    }
  }

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    final routeName = settings.name ?? '';

    if (routeName.startsWith('${AppRoutes.workerJobs}/')) {
      final idText = routeName.substring('${AppRoutes.workerJobs}/'.length);

      final id = int.tryParse(idText);

      if (id != null) {
        return _page(JobDetailsScreen(workOrderId: id), settings);
      }
    }

    // OWNER PROPERTY UNITS
    if (routeName.startsWith('/owner/properties/') &&
        routeName.endsWith('/units')) {
      final parts = routeName.split('/');

      if (parts.length >= 5) {
        final propertyId = int.tryParse(parts[3]);

        if (propertyId != null) {
          return _page(OwnerUnitsScreen(propertyId: propertyId), settings);
        }
      }
    }

    // OWNER TENANCY PAGES / WORK ORDER DETAILS / WORKFLOW DETAILS
    final parts = routeName.split('/');

    if (parts.length == 5 && parts[1] == 'owner' && parts[2] == 'tenants') {
      final id = int.tryParse(parts[3]);

      if (id != null &&
          id > 0 &&
          ['tenancies', 'tenancy-history'].contains(parts[4])) {
        return _page(
          OwnerTenanciesScreen(
            tenantId: id,
            historyOnly: parts[4] == 'tenancy-history',
          ),
          settings,
        );
      }
    }

    if (parts.length == 4 && parts[1] == 'owner' && parts[2] == 'work-orders') {
      final id = int.tryParse(parts[3]);

      if (id != null && id > 0) {
        return _page(OwnerWorkOrderDetailsScreen(workOrderId: id), settings);
      }
    }

    if (parts.length == 4 && parts[1] == 'owner' && parts[2] == 'ai-workflow') {
      final id = int.tryParse(parts[3]);

      if (id != null && id > 0) {
        return _page(OwnerAiWorkflowScreen(initialWorkflowId: id), settings);
      }
    }

    if (parts.length == 4 && parts[1] == 'owner' && parts[2] == 'emergency') {
      final id = int.tryParse(parts[3]);

      if (id != null && id > 0) {
        return _page(OwnerMaintenanceDetailsScreen(requestId: id), settings);
      }
    }

    // OWNER TENANT DETAILS
    if (routeName.startsWith('/owner/tenants/') &&
        routeName != AppRoutes.ownerTenantsAdd) {
      final idText = routeName.substring('/owner/tenants/'.length);

      final tenantId = int.tryParse(idText);

      if (tenantId != null) {
        return _page(OwnerTenantDetailsScreen(tenantId: tenantId), settings);
      }
    }

    // OWNER MAINTENANCE DETAILS
    if (routeName.startsWith('${AppRoutes.ownerMaintenance}/')) {
      final idText = routeName.substring(
        '${AppRoutes.ownerMaintenance}/'.length,
      );

      final requestId = int.tryParse(idText);

      if (requestId != null) {
        return _page(
          OwnerMaintenanceDetailsScreen(requestId: requestId),
          settings,
        );
      }
    }

    // OWNER APPROVAL / AI REVIEW DETAILS
    for (final base in [AppRoutes.ownerApproval]) {
      final prefix = '$base/';

      if (routeName.startsWith(prefix)) {
        final requestId = int.tryParse(routeName.substring(prefix.length));

        if (requestId != null && requestId > 0) {
          return _page(
            OwnerRecommendationScreen(requestId: requestId),
            settings,
          );
        }
      }
    }
    switch (settings.name) {
      case AppRoutes.login:
        return _page(const LoginScreen(), settings);

      // ADMIN
      case AppRoutes.admin:
        return _page(const AdminHomeScreen(), settings);

      case AppRoutes.adminUsers:
        return _page(const AdminUsersScreen(), settings);

      case AppRoutes.adminOwnerVerification:
        return _page(const AdminOwnerVerificationScreen(), settings);

      case AppRoutes.adminOwnerProfileRequests:
        return _page(const AdminOwnerProfileRequestsScreen(), settings);

      case AppRoutes.adminPropertyVerification:
        return _page(const AdminPropertyVerificationScreen(), settings);

      case AppRoutes.adminWorkers:
        return _page(const AdminWorkerVerificationScreen(), settings);

      case AppRoutes.adminMaintenance:
        return _page(const AdminMaintenanceRequestsScreen(), settings);

      case AppRoutes.adminEmergencies:
        return _page(
          const AdminMaintenanceRequestsScreen(emergency: true),
          settings,
        );

      case AppRoutes.adminCategories:
        return _page(const AdminMaintenanceCategoriesScreen(), settings);

      case AppRoutes.adminMaintenanceHistory:
        return _page(const AdminMaintenanceHistoryScreen(), settings);

      case AppRoutes.adminAiMonitoring:
        return _page(const AdminAiMonitoringScreen(), settings);

      // OWNER
      case AppRoutes.owner:
      case AppRoutes.ownerDashboard:
        return _page(const OwnerDashboardScreen(), settings);

      case AppRoutes.ownerProperties:
        return _page(const OwnerPropertiesScreen(), settings);
      case AppRoutes.ownerPropertiesAdd:
        return _page(const OwnerAddPropertyScreen(), settings);
      case AppRoutes.ownerTenants:
        return _page(const OwnerTenantsScreen(), settings);
      case AppRoutes.ownerTenantsAdd:
        return _page(const OwnerAddTenantScreen(), settings);
      case AppRoutes.ownerMaintenance:
        return _page(const OwnerMaintenanceScreen(), settings);

      case AppRoutes.ownerEmergency:
        return _page(
          const OwnerMaintenanceScreen(emergencyOnly: true),
          settings,
        );

      case AppRoutes.ownerMaintenanceHistory:
        return _page(const OwnerMaintenanceHistoryScreen(), settings);

      case AppRoutes.ownerProfile:
        return _page(const OwnerProfileScreen(), settings);

      case AppRoutes.ownerApproval:
        return _page(const OwnerApprovalScreen(), settings);

      case AppRoutes.ownerAiWorkflow:
        return _page(const OwnerAiWorkflowScreen(), settings);

      case AppRoutes.ownerWorkOrders:
        return _page(const OwnerWorkOrdersScreen(), settings);

      case AppRoutes.registerOwner:
        return _page(const AccountRegistrationScreen(owner: true), settings);

      case AppRoutes.ownerVerification:
        return _page(const AccountVerificationScreen(owner: true), settings);

      // TENANT
      case AppRoutes.tenant:
      case AppRoutes.tenantHome:
        return _page(const TenantHomeScreen(), settings);

      case AppRoutes.tenantTenancyHistory:
        return _page(const TenancyHistoryScreen(), settings);

      case AppRoutes.tenantProfile:
        return _page(const TenantProfileScreen(), settings);

      case AppRoutes.tenantNotifications:
        return _page(const TenantNotificationsScreen(), settings);

      case AppRoutes.tenantReportMaintenance:
        return _sessionPage(
          expectedRole: 'Tenant',
          settings: settings,
          builder: (session) => ReportMaintenanceScreen(token: session.token),
        );

      case AppRoutes.tenantReportEmergency:
        return _sessionPage(
          expectedRole: 'Tenant',
          settings: settings,
          builder: (session) => ReportEmergencyScreen(token: session.token),
        );

      case AppRoutes.tenantMaintenanceRequests:
        return _sessionPage(
          expectedRole: 'Tenant',
          settings: settings,
          builder: (session) => MyRequestsScreen(token: session.token),
        );

      case AppRoutes.activateTenant:
        return _page(const ActivateAccountScreen(), settings);

      // WORKER
      case AppRoutes.worker:
        return _page(const WorkerDashboardScreen(), settings);

      case AppRoutes.workerVerification:
        return _page(const AccountVerificationScreen(owner: false), settings);

      case AppRoutes.workerRegistration:
      case AppRoutes.registerWorker:
        return _page(const AccountRegistrationScreen(owner: false), settings);

      case AppRoutes.workerJobs:
        return _page(const MyJobsScreen(), settings);

      case AppRoutes.workerAvailability:
        return _page(const AvailabilityScreen(), settings);

      case AppRoutes.workerJobHistory:
        return _page(const JobHistoryScreen(), settings);

      case AppRoutes.workerProfile:
        return _page(const WorkerProfileScreen(), settings);

      default:
        return _page(const LoginScreen(), settings);
    }
  }

  static MaterialPageRoute<dynamic> _page(
    Widget child,
    RouteSettings settings,
  ) {
    return MaterialPageRoute<dynamic>(
      settings: settings,
      builder: (_) {
        final name = settings.name ?? '';
        final ownerPage = name == AppRoutes.owner || name.startsWith('/owner/');

        return ownerPage && name != AppRoutes.ownerVerification
            ? OwnerVerificationGate(child: child)
            : child;
      },
    );
  }

  static MaterialPageRoute<dynamic> _sessionPage({
    required String expectedRole,
    required RouteSettings settings,
    required Widget Function(StoredSession session) builder,
  }) {
    return MaterialPageRoute<dynamic>(
      settings: settings,
      builder: (_) =>
          _SessionProtectedPage(expectedRole: expectedRole, builder: builder),
    );
  }
}

class _SessionProtectedPage extends StatefulWidget {
  const _SessionProtectedPage({
    required this.expectedRole,
    required this.builder,
  });

  final String expectedRole;

  final Widget Function(StoredSession session) builder;

  @override
  State<_SessionProtectedPage> createState() => _SessionProtectedPageState();
}

class _SessionProtectedPageState extends State<_SessionProtectedPage> {
  StoredSession? _session;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final session = await SecureStorageService.instance.readSession();

    if (!mounted) return;

    if (session == null || session.role != widget.expectedRole) {
      Navigator.of(context)
          .pushNamedAndRemoveUntil(AppRoutes.login, (_) => false);
      return;
    }

    setState(() {
      _session = session;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _session == null) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return widget.builder(_session!);
  }
}
