import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "./features/auth/pages/LoginPage.jsx";
import UnauthorizedPage from "./features/auth/pages/UnauthorizedPage.jsx";
import AdminHome from "./features/admin/pages/AdminHome.jsx";
import TenantListPage from "./features/tenancies/pages/TenantListPage.jsx";
import AddTenantPage from "./features/tenancies/pages/AddTenantPage.jsx";
import TenantDetailsPage from "./features/tenancies/pages/TenantDetailsPage.jsx";
import ProtectedRoute from "./routes/ProtectedRoute";

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

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/unauthorized"
          element={<UnauthorizedPage />}
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={["PropertyOwner"]}>
              <OwnerHome />
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