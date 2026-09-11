const API_URL = import.meta.env.VITE_API_BASE_URL;

function getAuthHeaders() {
  const token = sessionStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getUsers({
  search = "",
  role = "",
  isActive = "",
  page = 1,
  pageSize = 10,
}) {
  const params = new URLSearchParams();

  if (search) params.append("search", search);
  if (role) params.append("role", role);
  if (isActive !== "") params.append("isActive", isActive);

  params.append("page", page);
  params.append("pageSize", pageSize);

  const response = await fetch(
    `${API_URL}/api/admin/users?${params.toString()}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load users.");
  }

  return await response.json();
}

export async function suspendUser(id) {
  const response = await fetch(
    `${API_URL}/api/admin/users/${id}/suspend`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to suspend user.");
  }

  return data;
}

export async function reactivateUser(id) {
  const response = await fetch(
    `${API_URL}/api/admin/users/${id}/reactivate`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to reactivate user.");
  }

  return data;
}