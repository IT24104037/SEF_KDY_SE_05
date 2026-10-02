import { useState } from "react";
import { useNavigate } from "react-router-dom";
import tenancyService from "../services/tenancyService";
import { isValidMobileNumber } from "../../../utils/validators";

export default function TenantActivationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    mobileNumber: "",
    pin: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isValidMobileNumber(form.mobileNumber)) {
      setError("Enter a valid mobile number (exactly 10 digits).");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await tenancyService.activateTenant(form);
      if (!result.success) {
        setError(result.message || "Activation failed.");
        return;
      }

      setMessage(result.message || "Account activated successfully.");
      setForm({ mobileNumber: "", pin: "", password: "", confirmPassword: "" });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Activation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>Activate Tenant Account</h1>
        <p style={styles.subtitle}>Enter the one-time PIN provided by your property owner.</p>

        <label htmlFor="mobileNumber" style={styles.label}>Mobile number</label>
        <input id="mobileNumber" name="mobileNumber" value={form.mobileNumber}
          onChange={updateField} style={styles.input} inputMode="numeric"
          maxLength={10} pattern="[0-9]{10}" required />

        <label htmlFor="pin" style={styles.label}>Activation PIN</label>
        <input id="pin" name="pin" value={form.pin} onChange={updateField}
          style={styles.input} inputMode="numeric" maxLength={6} required />

        <label htmlFor="password" style={styles.label}>Password</label>
        <input id="password" name="password" type="password" value={form.password}
          onChange={updateField} style={styles.input} minLength={8} required />

        <label htmlFor="confirmPassword" style={styles.label}>Confirm password</label>
        <input id="confirmPassword" name="confirmPassword" type="password"
          value={form.confirmPassword} onChange={updateField} style={styles.input} required />

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Activating..." : "Activate Account"}
        </button>
        <button type="button" style={styles.linkButton} onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f3f5f6", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(18px, 4vw, 40px)", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1f2933" },
  card: { width: "min(420px, 100%)", backgroundColor: "#ffffff", padding: "clamp(22px, 4vw, 34px)", border: "1px solid #e2e7e9", borderTop: "3px solid #0369a1", borderRadius: 12, boxShadow: "0 12px 32px rgba(22, 34, 42, 0.06)", display: "flex", flexDirection: "column", gap: 12 },
  title: { margin: 0, color: "#172033", fontSize: 23, fontWeight: 700 },
  subtitle: { color: "#64748b", marginTop: 0, lineHeight: 1.5 },
  label: { color: "#334155", fontSize: 13, fontWeight: 600 },
  input: { padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, color: "#1f2933", fontFamily: "inherit" },
  button: { padding: 12, border: 0, borderRadius: 8, backgroundColor: "#0369a1", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 650 },
  linkButton: { border: 0, background: "none", color: "#0369a1", cursor: "pointer", fontWeight: 600 },
  error: { color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", margin: 0 },
  success: { color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px", margin: 0 },
};