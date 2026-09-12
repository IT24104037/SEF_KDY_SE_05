import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5080";

// Shared axios instance for the whole app. Reads the API base URL from an
// env variable so it's easy to point at a different backend in dev/prod.
// Create a .env file in web/smart-property-web with:
//   VITE_API_BASE_URL=http://localhost:5000
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attaches the JWT (set by the Login page) to every request automatically.
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a request comes back 401 (expired/invalid token), clear it so the
// user isn't stuck in a broken logged-in state.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Optional hook form, for components that prefer calling a hook.
export function useApi() {
  return apiClient;
}