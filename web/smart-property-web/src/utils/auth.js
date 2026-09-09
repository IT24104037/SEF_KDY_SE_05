export function saveSession(data) {
  sessionStorage.setItem("token", data.token);
  sessionStorage.setItem("role", data.role);
  sessionStorage.setItem("fullName", data.fullName);
}

export function getToken() {
  return sessionStorage.getItem("token");
}

export function getRole() {
  return sessionStorage.getItem("role");
}

export function getFullName() {
  return sessionStorage.getItem("fullName");
}

export function logout() {
  sessionStorage.clear();
}