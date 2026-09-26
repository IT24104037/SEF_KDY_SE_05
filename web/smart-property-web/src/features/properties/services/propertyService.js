import { getToken } from "../../../utils/auth.js";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5144";

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

export async function getMyProperties(params = {}) {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.city) queryParams.append("city", params.city);
  if (params.status) queryParams.append("status", params.status);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortDirection) queryParams.append("sortDirection", params.sortDirection);
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);

  const queryString = queryParams.toString();
  const url = `${API_URL}/api/properties${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

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

export async function resubmitProperty(id, property) {
  const response = await fetch(
    `${API_URL}/api/properties/${id}/resubmit`,
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

export async function getArchivedProperties() {
  const response = await fetch(
    `${API_URL}/api/properties/archived`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return handleResponse(response);
}

export async function restoreProperty(propertyId) {
  const response = await fetch(
    `${API_URL}/api/properties/${propertyId}/restore`,
    {
      method: "PUT",
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