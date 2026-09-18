export { default } from "../api/apiClient";

// All calls to /api/tenants and /api/tenancies.
const tenancyService = {
  // ---- Tenant Management ----
  createTenant: (payload) =>
    apiClient.post("/api/tenants", payload).then((res) => res.data),

  getTenants: (params) =>
    apiClient.get("/api/tenants", { params }).then((res) => res.data),

  getTenantById: (id) =>
    apiClient.get(`/api/tenants/${id}`).then((res) => res.data),

  updateTenant: (id, payload) =>
    apiClient.put(`/api/tenants/${id}`, payload).then((res) => res.data),

  // ---- Tenancy Management ----
  createTenancy: (payload) =>
    apiClient.post("/api/tenancies", payload).then((res) => res.data),

  // Owner-facing: every tenancy (active + ended) for one tenant.
  getTenanciesForTenant: (tenantId) =>
    apiClient.get(`/api/tenancies/tenant/${tenantId}`).then((res) => res.data),

  // Tenant-facing (used later by the Flutter/Tenant Dashboard side, kept
  // here too in case a Tenant-facing React view is ever needed):
  getCurrentTenancy: () =>
    apiClient.get("/api/tenancies/current").then((res) => res.data),

  getTenancyHistory: () =>
    apiClient.get("/api/tenancies/history").then((res) => res.data),

  endTenancy: (tenancyId, payload = {}) =>
    apiClient.put(`/api/tenancies/${tenancyId}/end`, payload).then((res) => res.data),
};

export default tenancyService;