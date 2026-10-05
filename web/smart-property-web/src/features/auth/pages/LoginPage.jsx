import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../../../api/authApi.js";
import { saveSession } from "../../../utils/auth.js";

function LoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await login(identifier, password);

      saveSession(result);

      if (result.role === "Admin") {
        navigate("/admin");
      } else if (result.role === "PropertyOwner") {
        navigate("/owner");
      } else if (result.role === "Tenant") {
        navigate("/tenant");
      } else if (result.role === "MaintenanceWorker") {
        navigate("/worker");
      } else {
        navigate("/unauthorized");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>Smart Property</h1>

        <p style={styles.subtitle}>
          Sign in to your account
        </p>

        <label>Email or Mobile</label>

        <input
          style={styles.input}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter email or mobile"
          required
        />

        <label>Password</label>

        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
        />

        {error && (
          <p style={styles.error}>
            {error}
          </p>
        )}

        <button
          style={styles.button}
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <button
          type="button"
          style={styles.registerButton}
          onClick={() => navigate("/register-owner")}
        >
          Register as Property Owner
        </button>

        <button
          type="button"
          style={styles.workerRegisterButton}
          onClick={() => navigate("/register-worker")}
        >
          Register as Maintenance Worker
        </button>

        <button
          type="button"
          style={styles.activateButton}
          onClick={() => navigate("/activate-tenant")}
        >
          Activate My Account
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f5f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "clamp(18px, 4vw, 40px)",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1f2933",
  },

  card: {
    width: "min(400px, 100%)",
    backgroundColor: "#ffffff",
    padding: "clamp(22px, 4vw, 34px)",
    border: "1px solid #e2e7e9",
    borderTop: "3px solid #0f766e",
    borderRadius: "12px",
    boxShadow: "0 12px 32px rgba(22, 34, 42, 0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  title: {
    margin: 0,
    color: "#172033",
    fontSize: "28px",
    fontWeight: 750,
  },

  subtitle: {
    color: "#64748b",
  },

  input: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    color: "#1f2933",
    fontFamily: "inherit",
  },

  button: {
    marginTop: "10px",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#0f766e",
    color: "#FFFFFF",
    cursor: "pointer",
    fontWeight: 650,
  },

  registerButton: {
    padding: "10px",
    border: "1px solid #b9d8d3",
    borderRadius: "8px",
    backgroundColor: "#f2f8f7",
    color: "#0f766e",
    cursor: "pointer",
  },

  workerRegisterButton: {
    padding: "10px",
    border: "1px solid #fcd34d",
    borderRadius: "8px",
    backgroundColor: "#fffbeb",
    color: "#b45309",
    cursor: "pointer",
    fontWeight: "600",
  },

  activateButton: {
    padding: "10px",
    border: "none",
    backgroundColor: "transparent",
    color: "#0369a1",
    cursor: "pointer",
  },

  error: {
    color: "#991b1b",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "10px 12px",
  },
};

export default LoginPage;