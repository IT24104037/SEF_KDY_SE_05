import apiClient from "../../../hooks/useApi";

// All calls to /api/tenants. Matches the backend TenantsController exactly.
const tenancyService = {
  getOptions: () =>
    apiClient.get("/api/tenants/options").then((res) => res.data),
  // POST /api/tenants
  createTenant: (payload) =>
    apiClient.post("/api/tenants", payload).then((res) => res.data),

  // GET /api/tenants?search=&isActive=&sortBy=&descending=&page=&pageSize=
  getTenants: (params) =>
    apiClient.get("/api/tenants", { params }).then((res) => res.data),

  // GET /api/tenants/{id}
  getTenantById: (id) =>
    apiClient.get(`/api/tenants/${id}`).then((res) => res.data),

  // PUT /api/tenants/{id}
  updateTenant: (id, payload) =>
    apiClient.put(`/api/tenants/${id}`, payload).then((res) => res.data),
};

export default tenancyService;