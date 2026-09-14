import { Routes, Route } from "react-router-dom";
import TenantListPage from "../features/tenancies/pages/TenantListPage";
import AddTenantPage from "../features/tenancies/pages/AddTenantPage";
import TenantDetailsPage from "../features/tenancies/pages/TenantDetailsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/owner/tenants" element={<TenantListPage />} />
      <Route path="/owner/tenants/add" element={<AddTenantPage />} />
      <Route path="/owner/tenants/:id" element={<TenantDetailsPage />} />
    </Routes>
  );
}