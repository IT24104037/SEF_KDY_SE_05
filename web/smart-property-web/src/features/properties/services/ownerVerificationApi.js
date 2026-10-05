import { getToken } from "../../../utils/auth.js";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5144";

export async function getOwnerVerificationStatus({ signal } = {}) {
  const response = await fetch(
    `${API_URL}/api/owners/me/verification`,
    {
      method: "GET",
      signal,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  const responseText = await response.text();

  let data = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load verification status."
    );
  }

  return data;
}

export async function reapplyOwnerVerification(ownerData) {
  const response = await fetch(`${API_URL}/api/owners/me/reapply`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(ownerData),
  });

  const responseText = await response.text();
  let data = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(data.message || "Failed to resubmit verification.");
  }

  return data;
}