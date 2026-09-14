import { getToken } from "../../../utils/auth.js";

const API_URL = import.meta.env.VITE_API_BASE_URL;

async function handleResponse(response) {
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
      data.message || "Something went wrong."
    );
  }

  return data;
}

export async function getMyProperties() {
  const response = await fetch(
    `${API_URL}/api/properties`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return handleResponse(response);
}

export async function getProperty(id) {
  const response = await fetch(
    `${API_URL}/api/properties/${id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return handleResponse(response);
}

export async function createProperty(property) {
  const response = await fetch(
    `${API_URL}/api/properties`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(property),
    }
  );

  return handleResponse(response);
}

export async function updateProperty(id, property) {
  const response = await fetch(
    `${API_URL}/api/properties/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(property),
    }
  );

  return handleResponse(response);
}

export async function archiveProperty(id) {
  const response = await fetch(
    `${API_URL}/api/properties/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  if (!response.ok) {
    return handleResponse(response);
  }

  return true;
}