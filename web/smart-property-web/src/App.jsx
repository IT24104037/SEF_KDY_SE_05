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

import AdminHome from "./features/admin/pages/AdminHome.jsx";
import UserManagementPage from "./features/admin/pages/UserManagementPage.jsx";
import MaintenanceRequestsPage from "./features/admin/pages/MaintenanceRequestsPage.jsx";
import EmergencyRequestsPage from "./features/admin/pages/EmergencyRequestsPage.jsx";
import MaintenanceCategoriesPage from "./features/admin/pages/MaintenanceCategoriesPage.jsx";
import AiWorkflowPage from "./features/admin/pages/AiWorkflowPage.jsx";
import ReportsPage from "./features/admin/pages/ReportsPage.jsx";
import SystemActivityPage from "./features/admin/pages/SystemActivityPage.jsx";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register-owner"
          element={<OwnerRegisterPage />}
        />

        <Route
          path="/unauthorized"
          element={<UnauthorizedPage />}
        />
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
          <Route
            index
            element={<AdminHome />}
          />

          <Route
            path="users"
            element={<UserManagementPage />}
          />

          <Route
            path="maintenance"
            element={<MaintenanceRequestsPage />}
          />

          <Route
            path="emergencies"
            element={<EmergencyRequestsPage />}
          />

          <Route
            path="categories"
            element={<MaintenanceCategoriesPage />}
          />

          <Route
            path="ai-monitoring"
            element={<AiWorkflowPage />}
          />

          <Route
            path="reports"
            element={<ReportsPage />}
          />

          <Route
            path="activity"
            element={<SystemActivityPage />}
          />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;