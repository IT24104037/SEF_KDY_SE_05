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



const initialWorkOrders = [
  {
    id: 5001,
    requestId: 9001,
    title: "Major kitchen water leak",
    property: "Lakeview Apartments",
    unit: "A2",
    worker: "Nimal Silva",
    status: "Assigned",
    priority: "Emergency",
    scheduledAt: "2026-09-18T10:30:00Z",
    description: "Inspect and stop the leak under the kitchen sink.",
  },
  {
    id: 5002,
    requestId: 9002,
    title: "Air conditioner not cooling",
    property: "Cedar Court",
    unit: "F3",
    worker: "Amal Perera",
    status: "InProgress",
    priority: "Normal",
    scheduledAt: "2026-09-17T14:00:00Z",
    description: "Check the indoor unit and restore cooling.",
  },
];

export async function getWorkOrders() {
  const stored = localStorage.getItem("smart-property.mock-work-orders");
  const workOrders = stored ? JSON.parse(stored) : initialWorkOrders;
  if (!stored) localStorage.setItem("smart-property.mock-work-orders", JSON.stringify(workOrders));
  return workOrders;
}

export async function getWorkOrder(id) {
  const workOrders = await getWorkOrders();
  return workOrders.find((workOrder) => workOrder.id === Number(id));
}

export async function updateWorkOrderStatus(id, status) {
  const workOrders = await getWorkOrders();
  const updated = workOrders.map((workOrder) => (
    workOrder.id === Number(id) ? { ...workOrder, status } : workOrder
  ));
  localStorage.setItem("smart-property.mock-work-orders", JSON.stringify(updated));
  return updated.find((workOrder) => workOrder.id === Number(id));
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
  return { id: Date.now(), ...payload, status: "ExternalMaintenanceScheduled" };
}
