import apiClient from "../../../api/apiClient";

export async function startPlannerWorkflow(maintenanceRequestId) {
  try {
    const response = await apiClient.post("/api/agent-workflows/start", {
      maintenanceRequestId: Number(maintenanceRequestId),
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to start Agent 1 Planner workflow.";
    throw new Error(message);
  }
}

export async function getWorkflowById(workflowId) {
  try {
    const response = await apiClient.get(`/api/agent-workflows/${workflowId}`);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to load AI workflow details.";
    throw new Error(message);
  }
}

export async function getWorkflowByRequestId(maintenanceRequestId) {
  try {
    const response = await apiClient.get(
      `/api/agent-workflows/request/${maintenanceRequestId}`
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to load AI workflow for maintenance request.";
    throw new Error(message);
  }
}

export async function getWorkflowLogs(workflowId) {
  try {
    const response = await apiClient.get(
      `/api/agent-workflows/${workflowId}/logs`
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to load workflow execution logs.";
    throw new Error(message);
  }
}
