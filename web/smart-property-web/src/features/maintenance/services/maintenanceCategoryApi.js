const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5144";

function getAuthHeaders() {
  const token = sessionStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getMaintenanceCategories(
  includeInactive = true
) {
  const response = await fetch(
    `${API_URL}/api/maintenance-categories?includeInactive=${includeInactive}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load maintenance categories.");
  }

  return await response.json();
}

export async function createMaintenanceCategory(data) {
  const response = await fetch(
    `${API_URL}/api/maintenance-categories`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to create category."
    );
  }

  return result;
}

export async function updateMaintenanceCategory(
  id,
  data
) {
  const response = await fetch(
    `${API_URL}/api/maintenance-categories/${id}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Failed to update category."
    );
  }

  return result;
}