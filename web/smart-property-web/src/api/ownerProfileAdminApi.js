import { getToken } from "../utils/auth.js";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5144";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Admin request failed.");
  }

  return data;
}

export function getPendingProfileChangeRequests() {
  return request("/api/admin/owners/profile-change-requests/pending");
}

export function approveProfileChangeRequest(requestId) {
  return request(`/api/admin/owners/profile-change-requests/${requestId}/approve`, {
    method: "PUT",
  });
}

export function rejectProfileChangeRequest(requestId, rejectionReason) {
  return request(`/api/admin/owners/profile-change-requests/${requestId}/reject`, {
    method: "PUT",
    body: JSON.stringify({ rejectionReason }),
  });
}
