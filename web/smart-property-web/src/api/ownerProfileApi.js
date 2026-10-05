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
    throw new Error(data.message || "Profile request failed.");
  }

  return data;
}

export function submitProfileChangeRequest(profileData) {
  return request("/api/owners/me/profile-change-request", {
    method: "POST",
    body: JSON.stringify(profileData),
  });
}

export function getMyProfileChangeRequest() {
  return request("/api/owners/me/profile-change-request");
}
