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
      data.message ||
        data.detail ||
        responseText ||
        "Something went wrong."
    );
  }

  return data;
}

export async function getUnits(propertyId, params = {}) {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.status) queryParams.append("status", params.status);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortDirection) queryParams.append("sortDirection", params.sortDirection);
  if (params.page) queryParams.append("page", params.page);
  if (params.pageSize) queryParams.append("pageSize", params.pageSize);

  const queryString = queryParams.toString();
  const url = `${API_URL}/api/properties/${propertyId}/units${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

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

export async function softDeleteUnit(propertyId, unitId) {
  const response = await fetch(
    `${API_URL}/api/properties/${propertyId}/units/${unitId}/soft-delete`,
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

export async function downloadUnitTenancyHistory(propertyId, unitId, unitLabel) {
  const response = await fetch(
    `${API_URL}/api/properties/${propertyId}/units/${unitId}/tenancy-history/export`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  if (!response.ok) {
    return handleResponse(response);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${unitLabel}_Tenancy_History.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
