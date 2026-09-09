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