import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import OwnerVerificationRoute from "./OwnerVerificationRoute";

import OwnerLayout from "../layouts/OwnerLayout";
import TenantLayout from "../layouts/TenantLayout";
import LoginPage from "../features/auth/pages/LoginPage";
import AdminLayout from "../layouts/AdminLayout";

const LandingPage = lazy(() =>
  import("../features/landing/pages/LandingPage")
);

const OwnerRegisterPage = lazy(() =>
  import("../features/auth/pages/OwnerRegisterPage")
);

const TenantActivationPage = lazy(() =>
  import("../features/tenancies/pages/TenantActivationPage")
);

const WorkerRegistrationPage = lazy(() =>
  import("../features/workers/pages/WorkerRegistrationPage")
);

const AdminHome = lazy(() =>
  import("../features/admin/pages/AdminHome")
);

const UserManagementPage = lazy(() =>
  import("../features/admin/pages/UserManagementPage")
);

const AdminOwnerVerificationPage = lazy(() =>
  import("../features/admin/pages/OwnerVerificationPage")
);

const OwnerProfileRequestsPage = lazy(() =>
  import("../features/admin/pages/OwnerProfileRequestsPage")
);

const PropertyVerificationPage = lazy(() =>
  import("../features/admin/pages/PropertyVerificationPage")
);

const AiWorkflowPage = lazy(() =>
  import("../features/admin/pages/AiWorkflowPage")
);

const AdminMaintenanceRequestsPage = lazy(() =>
  import("../features/admin/pages/MaintenanceRequestsPage")
);

const MaintenanceCategoriesPage = lazy(() =>
  import("../features/admin/pages/MaintenanceCategoriesPage")
);

const EmergencyRequestsPage = lazy(() =>
  import("../features/admin/pages/EmergencyRequestsPage")
);

const MaintenanceHistoryPage = lazy(() =>
  import("../features/maintenance/pages/MaintenanceHistoryPage")
);

const WorkerVerificationPage = lazy(() =>
  import("../features/workers/pages/WorkerVerificationPage")
);

const WorkerDashboardPage = lazy(() =>
  import("../features/workers/pages/WorkerDashboardPage")
);

const WorkOrdersPage = lazy(() =>
  import("../features/workers/pages/WorkOrdersPage")
);

const WorkOrderDetailsPage = lazy(() =>
  import("../features/workers/pages/WorkOrderDetailsPage")
);


const WorkersPage = lazy(() =>
  import("../features/workers/pages/WorkersPage")
);

const OwnerDashboardPage = lazy(() =>
  import("../features/properties/pages/OwnerDashboardPage")
);

const OwnerVerificationPage = lazy(() =>
  import("../features/properties/pages/OwnerVerificationPage")
);

const MyPropertiesPage = lazy(() =>
  import("../features/properties/pages/MyPropertiesPage")
);

const AddPropertyPage = lazy(() =>
  import("../features/properties/pages/AddPropertyPage")
);

const UnitsPage = lazy(() =>
  import("../features/properties/pages/UnitsPage")
);

const OwnerProfilePage = lazy(() =>
  import("../features/properties/pages/OwnerProfilePage")
);

const ApprovalPage = lazy(() =>
  import("../features/ai-workflow/pages/ApprovalPage")
);

const WorkflowDetailsPage = lazy(() =>
  import("../features/ai-workflow/pages/WorkflowDetailsPage")
);

const WorkflowHistoryPage = lazy(() =>
  import("../features/ai-workflow/pages/WorkflowHistoryPage")
);

const ReportMaintenancePage = lazy(() =>
  import("../features/maintenance/pages/ReportMaintenancePage")
);

const ReportEmergencyPage = lazy(() =>
  import("../features/maintenance/pages/ReportEmergencyPage")
);

const MyMaintenanceRequestsPage = lazy(() =>
  import("../features/maintenance/pages/MyMaintenanceRequestsPage")
);

const TenantMaintenanceDetailsPage = lazy(() =>
  import("../features/maintenance/pages/TenantMaintenanceDetailsPage")
);

const OwnerMaintenanceRequestsPage = lazy(() =>
  import("../features/maintenance/pages/OwnerMaintenanceRequestsPage")
);

const OwnerEmergencyRequestsPage = lazy(() =>
  import("../features/maintenance/pages/OwnerEmergencyRequestsPage")
);

const MaintenanceRequestDetailsPage = lazy(() =>
  import("../features/maintenance/pages/MaintenanceRequestDetailsPage")
);

const TenantListPage = lazy(() =>
  import("../features/tenancies/pages/TenantListPage")
);

const AddTenantPage = lazy(() =>
  import("../features/tenancies/pages/AddTenantPage")
);

const TenantDetailsPage = lazy(() =>
  import("../features/tenancies/pages/TenantDetailsPage")
);

const CurrentTenanciesPage = lazy(() =>
  import("../features/tenancies/pages/CurrentTenanciesPage")
);

const TenancyHistoryPage = lazy(() =>
  import("../features/tenancies/pages/TenancyHistoryPage")
);

const MyTenancyPage = lazy(() =>
  import("../features/tenant-dashboard/pages/MyTenancyPage")
);

const TenantTenancyHistoryPage = lazy(() =>
  import("../features/tenant-dashboard/pages/TenantTenancyHistoryPage")
);

const ProfilePage = lazy(() =>
  import("../features/tenant-dashboard/pages/ProfilePage")
);

const NotificationsPage = lazy(() =>
  import("../features/tenant-dashboard/pages/NotificationsPage")
);


//import Agent2TextAnalysisPage from "../features/ai-workflow/pages/Agent2TextAnalysisPage";



export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24 }}>
          Loading page...
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-owner" element={<OwnerRegisterPage />} />
        <Route path="/activate-tenant" element={<TenantActivationPage />} />
        <Route path="/register-worker" element={<WorkerRegistrationPage />} />

        <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["PropertyOwner"]} />}>
            <Route path="/owner/verification" element={<OwnerVerificationPage />} />
            <Route element={<OwnerVerificationRoute />}>
              <Route element={<OwnerLayout />}>
                <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
                <Route path="/owner/properties" element={<MyPropertiesPage />} />
                <Route path="/owner/properties/add" element={<AddPropertyPage />} />
                <Route path="/owner/properties/:propertyId/units" element={<UnitsPage />} />
                <Route path="/owner/tenants" element={<TenantListPage />} />
                <Route path="/owner/tenants/add" element={<AddTenantPage />} />
                <Route path="/owner/tenants/:id" element={<TenantDetailsPage />} />
                <Route path="/owner/tenants/:tenantId/tenancies" element={<CurrentTenanciesPage />} />
                <Route path="/owner/tenants/:tenantId/tenancy-history" element={<TenancyHistoryPage />} />
                <Route path="/owner/profile" element={<OwnerProfilePage />} />
                <Route path="/owner/approval" element={<ApprovalPage />} />
                <Route path="/owner/ai-workflow" element={<WorkflowHistoryPage />} />
                <Route  path="/owner/ai-workflow/:workflowId" element={<WorkflowDetailsPage />} />  
                <Route path="/owner/maintenance" element={<OwnerMaintenanceRequestsPage />} />
                <Route path="/owner/maintenance/:id" element={<MaintenanceRequestDetailsPage />} />
                <Route path="/owner/emergency" element={<OwnerEmergencyRequestsPage />} />
                <Route path="/owner/emergency/:id" element={<MaintenanceRequestDetailsPage />} />
                <Route  path="/owner/maintenance-history" element={<MaintenanceHistoryPage />} />
                

              </Route> 
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["Tenant"]} />}>
            <Route element={<TenantLayout />}>
              <Route path="/tenant/home" element={<MyTenancyPage />} />
              <Route path="/tenant/tenancy-history" element={<TenantTenancyHistoryPage />} />
              <Route path="/tenant/profile" element={<ProfilePage />} />
              <Route path="/tenant/notifications" element={<NotificationsPage />} />
               <Route path="/tenant/maintenance/report" element={<ReportMaintenancePage />} />
            <Route path="/tenant/maintenance/emergency" element={<ReportEmergencyPage />} />
            <Route path="/tenant/maintenance/requests" element={<MyMaintenanceRequestsPage />} />
            <Route path="/tenant/maintenance/requests/:id" element={<TenantMaintenanceDetailsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/tenant" element={<Navigate to="/tenant/home" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["Admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="workers" element={<WorkersPage />} />
              <Route path="maintenance/:id" element={<MaintenanceRequestDetailsPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="owner-verification" element={<AdminOwnerVerificationPage />} />
              <Route path="owner-profile-requests" element={<OwnerProfileRequestsPage />} />
              <Route path="property-verification" element={<PropertyVerificationPage />} />
              <Route path="maintenance" element={<AdminMaintenanceRequestsPage />} />
              <Route path="emergencies" element={<EmergencyRequestsPage />} />
              <Route path="categories" element={<MaintenanceCategoriesPage />} />
              <Route path="ai-monitoring" element={<AiWorkflowPage />} />
              <Route  path="ai-workflow/:workflowId" element={<WorkflowDetailsPage />} />
              <Route  path="/admin/maintenance-history" element={<MaintenanceHistoryPage />} />
            </Route> 
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["MaintenanceWorker"]} />}>
            <Route path="/worker" element={<WorkerDashboardPage />} />
            <Route path="/worker/verification" element={<WorkerVerificationPage />} />
            <Route path="/worker/registration" element={<WorkerRegistrationPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["PropertyOwner", "MaintenanceWorker"]} />}>
            <Route path="/owner/work-orders" element={<WorkOrdersPage />} />
            <Route path="/owner/work-orders/:id" element={<WorkOrderDetailsPage />} />
          </Route>
        </Route>

        <Route path="/unauthorized" element={<p style={{ padding: 24 }}>You don't have access to this page.</p>} />
        <Route path="*" element={<p style={{ padding: 24 }}>Page not found.</p>} />
    </Routes>
    </Suspense>
  );
}