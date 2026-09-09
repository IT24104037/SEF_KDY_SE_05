import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../../../api/authApi.js";
import { saveSession } from "../../../utils/auth.js"

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
          <p style={styles.error}>{error}</p>
        )}

        <button
          style={styles.button}
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#F5F7FA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: "360px",
    backgroundColor: "#FFFFFF",
    padding: "32px",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  title: {
    margin: 0,
    color: "#17324D",
  },

  subtitle: {
    color: "#6B7280",
  },

  input: {
    padding: "11px",
    border: "1px solid #DDE3E9",
    borderRadius: "6px",
  },

  button: {
    marginTop: "10px",
    padding: "12px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#1F8A8A",
    color: "#FFFFFF",
    cursor: "pointer",
  },

  error: {
    color: "#D64545",
  },
};

export default LoginPage;