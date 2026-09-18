import apiClient from "../../../api/apiClient";

// All calls to /api/tenants. Matches the backend TenantsController exactly.
const tenancyService = {
  getOptions: () =>
    apiClient.get("/api/tenants/options").then((res) => res.data),
  // POST /api/tenants
  createTenant: (payload) =>
    apiClient.post("/api/tenants", payload).then((res) => res.data),

  activateTenant: (payload) =>
    apiClient.post("/api/tenant-activation/activate", payload).then((res) => res.data),

  // GET /api/tenants?search=&isActive=&sortBy=&descending=&page=&pageSize=
  getTenants: (params) =>
    apiClient.get("/api/tenants", { params }).then((res) => res.data),

  // GET /api/tenants/{id}
  getTenantById: (id) =>
    apiClient.get(`/api/tenants/${id}`).then((res) => res.data),

  // PUT /api/tenants/{id}
  updateTenant: (id, payload) =>
    apiClient.put(`/api/tenants/${id}`, payload).then((res) => res.data),

  createTenancy: (payload) =>
    apiClient.post("/api/tenancies", payload).then((res) => res.data),

  getTenanciesForTenant: (tenantId) =>
    apiClient.get(`/api/tenancies/tenant/${tenantId}`).then((res) => res.data),

  getCurrentTenancy: () =>
    apiClient.get("/api/tenancies/current").then((res) => res.data),

  getTenancyHistory: () =>
    apiClient.get("/api/tenancies/history").then((res) => res.data),

  endTenancy: (tenancyId, payload = {}) =>
    apiClient.put(`/api/tenancies/${tenancyId}/end`, payload).then((res) => res.data),
};

export default tenancyService;