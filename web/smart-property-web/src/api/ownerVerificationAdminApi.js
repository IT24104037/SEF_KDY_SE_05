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
    throw new Error(data.message || "Verification request failed.");
  }

  return data;
}

export function getAllOwners() {
  return request("/api/admin/owners");
}

export function getPendingOwners() {
  return request("/api/admin/owners/pending");
}

export function updateOwnerVerification(ownerId, status, rejectionReason) {
  return request(`/api/admin/owners/${ownerId}/verification`, {
    method: "PUT",
    body: JSON.stringify({ status, rejectionReason }),
  });
}
