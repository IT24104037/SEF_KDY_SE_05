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
      data.message ||
        data.detail ||
        responseText ||
        "Something went wrong."
    );
  }

  return data;
}

export async function getUnits(propertyId) {
  const response = await fetch(
    `${API_URL}/api/properties/${propertyId}/units`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return handleResponse(response);
}

export async function getArchivedUnits(propertyId) {
  const response = await fetch(
    `${API_URL}/api/properties/${propertyId}/units/archived`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return handleResponse(response);
}

export async function getUnit(propertyId, unitId) {
  const response = await fetch(
    `${API_URL}/api/properties/${propertyId}/units/${unitId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return handleResponse(response);
}

export async function createUnit(propertyId, unit) {
  const response = await fetch(
    `${API_URL}/api/properties/${propertyId}/units`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(unit),
    }
  );

  return handleResponse(response);
}

export async function updateUnit(propertyId, unitId, unit) {
  const response = await fetch(
    `${API_URL}/api/properties/${propertyId}/units/${unitId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(unit),
    }
  );

  return handleResponse(response);
}

export async function archiveUnit(propertyId, unitId) {
  const response = await fetch(
    `${API_URL}/api/properties/${propertyId}/units/${unitId}`,
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

export async function restoreUnit(propertyId, unitId) {
  const response = await fetch(
    `${API_URL}/api/properties/${propertyId}/units/${unitId}/restore`,
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

export async function createBulkUnits(propertyId, units) {
  const response = await fetch(
    `${API_URL}/api/properties/${propertyId}/units/bulk`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        units,
      }),
    }
  );

  return handleResponse(response);
}