import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import OwnerLayout from "../layouts/OwnerLayout";
import TenantLayout from "../layouts/TenantLayout";
import LoginPage from "../features/auth/pages/LoginPage";
import OwnerRegisterPage from "../features/auth/pages/OwnerRegisterPage";
import AdminLayout from "../layouts/AdminLayout";

import AdminHome from "../features/admin/pages/AdminHome";
import UserManagementPage from "../features/admin/pages/UserManagementPage";
import AdminOwnerVerificationPage from "../features/admin/pages/OwnerVerificationPage";
import AiWorkflowPage from "../features/admin/pages/AiWorkflowPage";
import ReportsPage from "../features/admin/pages/ReportsPage";
import SystemActivityPage from "../features/admin/pages/SystemActivityPage";
import AdminMaintenanceRequestsPage from "../features/admin/pages/MaintenanceRequestsPage";
import MaintenanceCategoriesPage from "../features/admin/pages/MaintenanceCategoriesPage";
import EmergencyRequestsPage from "../features/admin/pages/EmergencyRequestsPage";

import TenantListPage from "../features/tenancies/pages/TenantListPage";
import AddTenantPage from "../features/tenancies/pages/AddTenantPage";
import TenantDetailsPage from "../features/tenancies/pages/TenantDetailsPage";
import TenantActivationPage from "../features/tenancies/pages/TenantActivationPage";
import CurrentTenanciesPage from "../features/tenancies/pages/CurrentTenanciesPage";
import TenancyHistoryPage from "../features/tenancies/pages/TenancyHistoryPage";

import MyTenancyPage from "../features/tenant-dashboard/pages/MyTenancyPage";
import TenantTenancyHistoryPage from "../features/tenant-dashboard/pages/TenantTenancyHistoryPage";
import ProfilePage from "../features/tenant-dashboard/pages/ProfilePage";
import NotificationsPage from "../features/tenant-dashboard/pages/NotificationsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-owner" element={<OwnerRegisterPage />} />
      <Route path="/activate-tenant" element={<TenantActivationPage />} />
        <Route path="/" element={<Navigate to="/owner/tenants" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["PropertyOwner"]} />}>
            <Route element={<OwnerLayout />}>
              <Route path="/owner/tenants" element={<TenantListPage />} />
              <Route path="/owner/tenants/add" element={<AddTenantPage />} />
              <Route path="/owner/tenants/:id" element={<TenantDetailsPage />} />
              <Route path="/owner/tenants/:tenantId/tenancies" element={<CurrentTenanciesPage />} />
              <Route path="/owner/tenants/:tenantId/tenancy-history" element={<TenancyHistoryPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/owner" element={<Navigate to="/owner/tenants" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["Tenant"]} />}>
            <Route element={<TenantLayout />}>
              <Route path="/tenant/home" element={<MyTenancyPage />} />
              <Route path="/tenant/tenancy-history" element={<TenantTenancyHistoryPage />} />
              <Route path="/tenant/profile" element={<ProfilePage />} />
              <Route path="/tenant/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/tenant" element={<Navigate to="/tenant/home" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["Admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="owner-verification" element={<AdminOwnerVerificationPage />} />
              <Route path="maintenance" element={<AdminMaintenanceRequestsPage />} />
              <Route path="emergencies" element={<EmergencyRequestsPage />} />
              <Route path="categories" element={<MaintenanceCategoriesPage />} />
              <Route path="ai-monitoring" element={<AiWorkflowPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="activity" element={<SystemActivityPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/unauthorized" element={<p style={{ padding: 24 }}>You don't have access to this page.</p>} />
        <Route path="*" element={<p style={{ padding: 24 }}>Page not found.</p>} />
    </Routes>
  );
}