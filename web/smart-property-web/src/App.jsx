import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "./features/auth/pages/LoginPage.jsx";
import OwnerRegisterPage from "./features/auth/pages/OwnerRegisterPage.jsx";
import UnauthorizedPage from "./features/auth/pages/UnauthorizedPage.jsx";
import OwnerVerificationPage from "./features/properties/pages/OwnerVerificationPage.jsx";
import OwnerDashboardPage from "./features/properties/pages/OwnerDashboardPage.jsx";
import MyPropertiesPage from "./features/properties/pages/MyPropertiesPage.jsx";
import AddPropertyPage from "./features/properties/pages/AddPropertyPage.jsx";
import UnitsPage from "./features/properties/pages/UnitsPage.jsx";

import AdminHome from "./features/admin/pages/AdminHome.jsx";
import UserManagementPage from "./features/admin/pages/UserManagementPage.jsx";
import AdminOwnerVerificationPage from "./features/admin/pages/OwnerVerificationPage.jsx";
import AiWorkflowPage from "./features/admin/pages/AiWorkflowPage.jsx";
import ReportsPage from "./features/admin/pages/ReportsPage.jsx";
import SystemActivityPage from "./features/admin/pages/SystemActivityPage.jsx";
import WorkersPage from "./features/workers/pages/WorkersPage.jsx";
import WorkerRegistrationPage from "./features/workers/pages/WorkerRegistrationPage.jsx";
import WorkerVerificationPage from "./features/workers/pages/WorkerVerificationPage.jsx";
import WorkerDashboardPage from "./features/workers/pages/WorkerDashboardPage.jsx";
import WorkOrdersPage from "./features/workers/pages/WorkOrdersPage.jsx";
import WorkOrderDetailsPage from "./features/workers/pages/WorkOrderDetailsPage.jsx";
import ApprovalPage from "./features/ai-workflow/pages/ApprovalPage.jsx";

import MaintenanceRequestsPage from "./features/maintenance/pages/MaintenanceRequestsPage.jsx";
import MaintenanceCategoriesPage from "./features/maintenance/pages/MaintenanceCategoriesPage.jsx";
import MaintenanceRequestDetailsPage from "./features/maintenance/pages/MaintenanceRequestDetailsPage.jsx";
import EmergencyRequestsPage from "./features/maintenance/pages/EmergencyRequestsPage.jsx";

import TenantListPage from "./features/tenancies/pages/TenantListPage.jsx";
import AddTenantPage from "./features/tenancies/pages/AddTenantPage.jsx";
import TenantDetailsPage from "./features/tenancies/pages/TenantDetailsPage.jsx";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout.jsx";

function OwnerHome() {
  return (
    <main style={{ padding: "48px", fontFamily: "Georgia, serif" }}>
      <h1>Owner Dashboard</h1>
      <p>Welcome, Property Owner</p>
      <a href="/owner/tenants">Manage Tenants</a>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-owner" element={<OwnerRegisterPage />} />
        <Route path="/register-worker" element={<WorkerRegistrationPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <OwnerDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/properties"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <MyPropertiesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/properties/add"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <AddPropertyPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/properties/:propertyId/units"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <UnitsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/verification"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <OwnerVerificationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="owner-verification" element={<AdminOwnerVerificationPage />} />
          <Route path="maintenance" element={<MaintenanceRequestsPage />} />
          <Route path="emergencies" element={<EmergencyRequestsPage />} />
          <Route path="categories" element={<MaintenanceCategoriesPage />} />
          <Route path="ai-monitoring" element={<AiWorkflowPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="activity" element={<SystemActivityPage />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="maintenance/:id" element={<MaintenanceRequestDetailsPage />} />
        </Route>

        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <OwnerHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/approval"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <ApprovalPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/work-orders"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <WorkOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/work-orders/:id"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <WorkOrderDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/worker"
          element={
            <ProtectedRoute allowedRoles={["MaintenanceWorker"]}>
              <WorkerDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/worker/verification"
          element={
            <ProtectedRoute allowedRoles={["MaintenanceWorker"]}>
              <WorkerVerificationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/tenants"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <TenantListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/tenants/add"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <AddTenantPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner/tenants/:id"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <TenantDetailsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;