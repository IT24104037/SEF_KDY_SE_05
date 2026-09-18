import { Routes, Route } from "react-router-dom";
import TenantListPage from "../features/tenancies/pages/TenantListPage";
import AddTenantPage from "../features/tenancies/pages/AddTenantPage";
import TenantDetailsPage from "../features/tenancies/pages/TenantDetailsPage";
import TenantActivationPage from "../features/tenancies/pages/TenantActivationPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/activate-tenant" element={<TenantActivationPage />} />
      <Route path="/owner/tenants" element={<TenantListPage />} />
      <Route path="/owner/tenants/add" element={<AddTenantPage />} />
      <Route path="/owner/tenants/:id" element={<TenantDetailsPage />} />
      <Route path="/owner/tenants/:tenantId/tenancies" element={<CurrentTenanciesPage />} />
<Route path="/owner/tenants/:tenantId/tenancy-history" element={<TenancyHistoryPage />} />
    </Routes>
  );
}