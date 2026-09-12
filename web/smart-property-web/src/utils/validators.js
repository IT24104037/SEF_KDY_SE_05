export function isValidMobileNumber(value) {
  return /^\d{7,15}$/.test((value || "").trim());
}

export function isValidEmail(value) {
  if (!value) return true; // email is optional across the app
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isRequired(value) {
  return value !== undefined && value !== null && value.toString().trim() !== "";
}