import { getToken } from "../../../utils/auth.js";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export async function getOwnerDashboard() {
  const response = await fetch(
    `${API_URL}/api/properties/dashboard`,
    {
      method: "GET",
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
      data.message || "Failed to load owner dashboard."
    );
  }

  return data;
}