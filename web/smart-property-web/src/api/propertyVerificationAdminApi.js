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
    throw new Error(data.message || "Property verification request failed.");
  }

  return data;
}

export function getAllProperties() {
  return request("/api/admin/properties");
}

export function getPendingProperties() {
  return request("/api/admin/properties/pending");
}

export function approveProperty(propertyId) {
  return request(`/api/admin/properties/${propertyId}/approve`, { method: "PUT" });
}

export function rejectProperty(propertyId, rejectionReason) {
  return request(`/api/admin/properties/${propertyId}/reject`, {
    method: "PUT",
    body: JSON.stringify({ rejectionReason }),
  });
}
