import apiClient from "../../../api/apiClient";


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
