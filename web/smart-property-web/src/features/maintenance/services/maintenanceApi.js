import apiClient from "../../../api/apiClient";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5144";

function getAuthHeaders() {
  const token = sessionStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getMaintenanceRequests({
  search = "",
  status = "",
  requestType = "",
  priority = "",
  propertyId = "",
  sortBy = "createdAt",
  sortDirection = "desc",
  page = 1,
  pageSize = 10,
}) {
  const params = new URLSearchParams();

  if (search) params.append("search", search);
  if (status) params.append("status", status);
  if (requestType) params.append("requestType", requestType);
  if (priority) params.append("priority", priority);
  if (propertyId) params.append("propertyId", propertyId);

  params.append("sortBy", sortBy);
  params.append("sortDirection", sortDirection);
  params.append("page", page);
  params.append("pageSize", pageSize);

  const response = await fetch(
    `${API_URL}/api/maintenance-requests?${params.toString()}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load maintenance requests.");
  }

  return await response.json();
}

export async function getMaintenanceRequestById(id) {
  const response = await fetch(
    `${API_URL}/api/maintenance-requests/${id}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load maintenance request.");
  }

  return await response.json();
}

export async function getMaintenanceHistory(id) {
  const response = await fetch(
    `${API_URL}/api/maintenance-requests/${id}/history`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load maintenance history.");
  }

  return await response.json();
}

export async function updateMaintenanceStatus(id, status, note = "") {
  const response = await fetch(
    `${API_URL}/api/maintenance-requests/${id}/status`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status,
        note,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update maintenance status."
    );
  }

  return data;
}

export async function uploadMaintenanceImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post(
      "/api/maintenance-images/upload",
      formData
    );

    return response.data.imageUrl;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      "Failed to upload maintenance image."
    );
  }
}

export async function createMaintenanceRequest(data) {
  const response = await fetch(
    `${API_URL}/api/maintenance-requests`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to create maintenance request."
    );
  }

  return result;
  
}

export async function archiveMaintenanceRequest(id) {
  try {
    const response = await apiClient.put(
      `/api/maintenance-requests/${id}/archive`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to remove maintenance request."
    );
  }
}


export async function getMaintenanceHistoryRequests(params = {}) {
  try {
    const response = await apiClient.get(
      "/api/maintenance-requests/history-list",
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to load maintenance history."
    );
  }
}


export async function startMaintenanceWorkflow(
  maintenanceRequestId
) {
  const response = await fetch(
    `${API_URL}/api/agent-workflows/start`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        maintenanceRequestId,
      }),
    }
  );

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
        `Failed to start maintenance analysis. Status: ${response.status}`
    );
  }

  return result;
}

export function getAgent2SafetyConcern(workflow) {
  if (!workflow) {
    return null;
  }

  const steps =
    workflow.steps ||
    workflow.Steps ||
    [];

  const agent2Step = steps.find((step) => {
    const stepOrder =
      step.stepOrder ??
      step.StepOrder;

    const agentName =
      step.agentName ??
      step.AgentName ??
      "";

    const stepName =
      step.stepName ??
      step.StepName ??
      "";

    return (
      stepOrder === 2 ||
      agentName === "MaintenanceAnalysisAgent" ||
      stepName === "Visual Analysis & Responsibility"
    );
  });

  if (agent2Step) {
    const outputSummary =
      agent2Step.outputSummary ??
      agent2Step.OutputSummary;

    if (outputSummary) {
      try {
        const analysis =
          typeof outputSummary === "string"
            ? JSON.parse(outputSummary)
            : outputSummary;

        const safetyConcern =
          analysis.safetyConcern ??
          analysis.SafetyConcern;

        if (
          typeof safetyConcern === "string" &&
          safetyConcern.trim()
        ) {
          return safetyConcern;
        }
      } catch (error) {
        console.error(
          "Could not parse Agent 2 output:",
          error
        );
      }
    }
  }

  const approvalStatus =
    workflow.approvalStatus ??
    workflow.ApprovalStatus;

  const finalOutcome =
    workflow.finalOutcome ??
    workflow.FinalOutcome;

  if (
    approvalStatus === "EmergencyServicesRequired" &&
    finalOutcome
  ) {
    return finalOutcome;
  }

  return null;
}
