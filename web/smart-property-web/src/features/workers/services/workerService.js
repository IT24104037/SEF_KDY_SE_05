import apiClient from "../../../api/apiClient.js";

export async function registerWorker(payload) {
  try {
    const response = await apiClient.post("/api/workers/register", {
      fullName: payload.fullName,
      email: payload.email,
      mobile: payload.mobile,
      password: payload.password,
      skills: payload.skills,
      serviceArea: payload.serviceArea,
      proofDocumentName: payload.proofDocumentName,
      proofDocumentUrl: payload.proofDocumentUrl,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to register worker.";
    throw new Error(message);
  }
}

export async function getWorkers({ search = "", status = "" } = {}) {
  try {
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;

    const response = await apiClient.get("/api/workers", { params });
    return {
      workers: response.data.workers || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to fetch workers.";
    throw new Error(message);
  }
}

export async function updateWorkerVerification(id, decision, rejectionReason = "") {
  try {
    const response = await apiClient.put(`/api/admin/workers/${id}/verification`, {
      decision,
      rejectionReason: decision === "Rejected" ? rejectionReason : null,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to update verification status.";
    throw new Error(message);
  }
}

export async function getWorkerStatus() {
  try {
    const response = await apiClient.get("/api/workers/me/status");
    return response.data;
  } catch {
    return null;
  }
}

export async function getMyProfile() {
  try {
    const response = await apiClient.get("/api/workers/me");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to load worker profile.";
    throw new Error(message);
  }
}

export async function updateMyProfile(payload) {
  try {
    const response = await apiClient.put("/api/workers/me", payload);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to update profile.";
    throw new Error(message);
  }
}

export async function getMyAvailability() {
  try {
    const response = await apiClient.get("/api/workers/me/availability");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to load availability.";
    throw new Error(message);
  }
}

export async function updateMyAvailability(slots) {
  try {
    const response = await apiClient.put("/api/workers/me/availability", { slots });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to update availability schedule.";
    throw new Error(message);
  }
}



export async function getWorkOrders({ status = "", page = 1, pageSize = 50 } = {}) {
  try {
    const params = {};
    if (status) params.status = status;
    if (page) params.page = page;
    if (pageSize) params.pageSize = pageSize;

    const response = await apiClient.get("/api/work-orders", { params });
    return response.data?.workOrders || [];
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to load work orders.";
    throw new Error(message);
  }
}

export async function getWorkOrder(id) {
  try {
    const response = await apiClient.get(`/api/work-orders/${id}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to load work order details.";
    throw new Error(message);
  }
}

export async function updateWorkOrderStatus(id, status, completionNotes = "", completionEvidenceUrl = "", notes = "") {
  try {
    const response = await apiClient.put(`/api/work-orders/${id}/status`, {
      status,
      notes,
      completionNotes,
      completionEvidenceUrl,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to update work order status.";
    throw new Error(message);
  }
}

export async function getPendingApprovals() {
  try {
    const response = await apiClient.get("/api/maintenance-requests/pending-approvals");
    return response.data || [];
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to load pending approvals.";
    throw new Error(message);
  }
}

export async function getApprovalRequest(requestId) {
  try {
    if (requestId) {
      const response = await apiClient.get(`/api/maintenance-requests/${requestId}/recommendation`);
      return response.data;
    }

    // If no ID passed, try fetching pending approvals for the logged-in owner
    const pending = await getPendingApprovals();
    if (pending && pending.length > 0) {
      return pending[0];
    }

    // If no pending approvals found, fetch the first available maintenance request to get its recommendation
    const listResponse = await apiClient.get("/api/maintenance-requests?pageSize=1");
    const requests = listResponse.data?.requests || [];
    if (requests.length > 0) {
      const response = await apiClient.get(`/api/maintenance-requests/${requests[0].id}/recommendation`);
      return response.data;
    }

    return null;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to load technician recommendation.";
    throw new Error(message);
  }
}

export async function submitApprovalDecision(requestId, decision, note = "", scheduledDate = null, workerId = null) {
  try {
    const payload = {
      decision,
      notes: note,
      scheduledDate,
      workerId,
    };
    const response = await apiClient.post(`/api/maintenance-requests/${requestId}/approval`, payload);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to submit approval decision.";
    throw new Error(message);
  }
}

export async function createExternalArrangement(payload) {
  try {
    const { maintenanceRequestId, ...data } = payload;
    const response = await apiClient.post(
      `/api/maintenance-requests/${maintenanceRequestId}/external-arrangement`,
      data
    );
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to create external arrangement.";
    throw new Error(message);
  }
}

export async function getExternalArrangements(maintenanceRequestId) {
  try {
    const response = await apiClient.get(
      `/api/maintenance-requests/${maintenanceRequestId}/external-arrangements`
    );
    return response.data || [];
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to load external arrangements.";
    throw new Error(message);
  }
}

export async function confirmExternalArrangement(id, payload = {}) {
  try {
    const response = await apiClient.put(
      `/api/external-arrangements/${id}/confirm`,
      payload
    );
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Failed to confirm external arrangement.";
    throw new Error(message);
  }
}

