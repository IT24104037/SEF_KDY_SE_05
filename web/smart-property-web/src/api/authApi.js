const API_URL = import.meta.env.VITE_API_BASE_URL;

export async function login(identifier, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error("Invalid email/mobile or password.");
  }

  return await response.json();
}

export async function registerOwner(ownerData) {
  const response = await fetch(`${API_URL}/api/auth/register-owner`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
    throw new Error(
      data.message || "Owner registration failed."
    );
  }

  return data;
}