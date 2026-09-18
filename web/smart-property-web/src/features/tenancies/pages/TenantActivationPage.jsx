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

        <label htmlFor="mobileNumber">Mobile number</label>
        <input id="mobileNumber" name="mobileNumber" value={form.mobileNumber}
          onChange={updateField} style={styles.input} inputMode="numeric"
          maxLength={10} pattern="[0-9]{10}" required />

        <label htmlFor="pin">Activation PIN</label>
        <input id="pin" name="pin" value={form.pin} onChange={updateField}
          style={styles.input} inputMode="numeric" maxLength={6} required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" value={form.password}
          onChange={updateField} style={styles.input} minLength={8} required />

        <label htmlFor="confirmPassword">Confirm password</label>
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
  page: { minHeight: "100vh", backgroundColor: "#F5F7FA", display: "flex", alignItems: "center", justifyContent: "center" },
  card: { width: 360, backgroundColor: "#FFFFFF", padding: 32, borderRadius: 10, boxShadow: "0 4px 15px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: 12 },
  title: { margin: 0, color: "#17324D" },
  subtitle: { color: "#6B7280", marginTop: 0 },
  input: { padding: 11, border: "1px solid #DDE3E9", borderRadius: 6, fontSize: 15 },
  button: { padding: 12, border: 0, borderRadius: 6, backgroundColor: "#1F8A8A", color: "#fff", cursor: "pointer", fontSize: 15 },
  linkButton: { border: 0, background: "none", color: "#1F8A8A", cursor: "pointer" },
  error: { color: "#D64545", margin: 0 },
  success: { color: "#16805A", margin: 0 },
};