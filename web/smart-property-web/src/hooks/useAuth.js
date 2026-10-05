import { useMemo } from "react";

// ASP.NET Core's JwtSecurityToken (built with new Claim(ClaimTypes.X, ...))
// stores claims under these long URIs in the raw JWT payload.
const CLAIM_ID = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const CLAIM_NAME = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
const CLAIM_ROLE = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const CLAIM_EMAIL = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Shared by the whole app (Owner and Tenant sides). Reads the token that
// the Login page (Member 3) stores in localStorage under "token" — this
// hook does not perform login itself, only reads what's already there.
export function useAuth() {
  const token = sessionStorage.getItem("token");

  const user = useMemo(() => {
    if (!token) return null;
    const payload = decodeToken(token);
    if (!payload) return null;

    return {
      id: payload[CLAIM_ID] ?? payload.sub ?? payload.nameid,
      fullName: payload[CLAIM_NAME] ?? payload.name ?? payload.unique_name,
      role: payload[CLAIM_ROLE] ?? payload.role ?? sessionStorage.getItem("role"),
      email: payload[CLAIM_EMAIL] ?? payload.email,
    };
  }, [token]);

  const logout = () => {
    sessionStorage.removeItem("token");
    window.location.href = "/login";
  };

  return {
    token,
    user,
    isAuthenticated: !!token,
    logout,
  };
}