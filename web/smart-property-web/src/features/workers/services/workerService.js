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

export async function getApprovalRequest() {
  return {
    id: 9003,
    title: "Blocked bathroom drain",
    property: "Lakeview Apartments",
    unit: "B1",
    tenant: "Sahan Fernando",
    priority: "Normal",
    description: "Water is draining slowly and backing up in the bathroom.",
    recommendedWorker: "Amal Perera",
    workerSkill: "Plumbing",
    proposedTime: "2026-09-19T09:00:00Z",
    serviceArea: "Colombo 05, within 15 km",
    validationStatus: "Pending deterministic validation",
  };
}

export async function submitApprovalDecision(decision, note = "") {
  return { decision, note, createdWorkOrder: decision === "Approve" };
}

export async function createExternalArrangement(payload) {
  return { id: Date.now(), ...payload, status: "ExternalMaintenanceScheduled" };
}
