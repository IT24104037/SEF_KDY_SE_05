import TenantListPage from "../features/tenancies/pages/TenantListPage";
import AddTenantPage from "../features/tenancies/pages/AddTenantPage";
import TenantDetailsPage from "../features/tenancies/pages/TenantDetailsPage";

// inside your <Routes> block:
<Route path="/owner/tenants" element={<TenantListPage />} />
<Route path="/owner/tenants/add" element={<AddTenantPage />} />
<Route path="/owner/tenants/:id" element={<TenantDetailsPage />} />