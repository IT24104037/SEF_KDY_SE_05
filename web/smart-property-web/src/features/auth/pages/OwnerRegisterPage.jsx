import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { registerOwner } from "../../../api/authApi.js";

function OwnerRegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    propertyName: "",
    propertyAddress: "",
    city: "",
    propertyDescription: "",
    latitude: "",
    longitude: "",
    documentType: "",
    documentUrl: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "mobile") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((previous) => ({
        ...previous,
        mobile: numericValue,
      }));
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      setError("Email is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    const mobileTrimmed = formData.mobile.trim();
    if (!mobileTrimmed) {
      setError("Mobile number is required.");
      return;
    }
    if (!/^\d+$/.test(mobileTrimmed)) {
      setError("Mobile number must contain only numerical digits.");
      return;
    }
    if (mobileTrimmed.length !== 10) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!formData.propertyName.trim()) {
      setError("Property name is required.");
      return;
    }

    if (!formData.propertyAddress.trim()) {
      setError("Property address is required.");
      return;
    }

    if (!formData.documentType.trim()) {
      setError("Document type is required.");
      return;
    }

    if (!formData.documentUrl.trim()) {
      setError("Document URL is required.");
      return;
    }

    setLoading(true);

    try {
      const ownerData = {
        ...formData,
        fullName: formData.fullName.trim(),
        email: emailTrimmed,
        mobile: mobileTrimmed,
        propertyName: formData.propertyName.trim(),
        propertyAddress: formData.propertyAddress.trim(),
        city: formData.city ? formData.city.trim() : null,
        propertyDescription: formData.propertyDescription
          ? formData.propertyDescription.trim()
          : null,
        documentType: formData.documentType.trim(),
        documentUrl: formData.documentUrl.trim(),
        latitude: formData.latitude
          ? Number(formData.latitude)
          : null,
        longitude: formData.longitude
          ? Number(formData.longitude)
          : null,
      };

      const result = await registerOwner(ownerData);

      setSuccess(result.message);

      setFormData({
        fullName: "",
        email: "",
        mobile: "",
        password: "",
        propertyName: "",
        propertyAddress: "",
        city: "",
        propertyDescription: "",
        latitude: "",
        longitude: "",
        documentType: "",
        documentUrl: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>Owner Registration</h1>

        <p style={styles.subtitle}>
          Create your property owner account
        </p>

        <h2 style={styles.sectionTitle}>Personal Information</h2>

        <label>Full Name *</label>
        <input
          style={styles.input}
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Enter your full name"
          required
        />

        <label>Email *</label>
        <input
          style={styles.input}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />

        <label>Mobile *</label>
        <input
          style={styles.input}
          type="tel"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          placeholder="Enter 10-digit mobile number"
          maxLength={10}
          required
        />

        <label>Password *</label>
        <input
          style={styles.input}
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          minLength={6}
          required
        />

        <h2 style={styles.sectionTitle}>Property Information</h2>

        <label>Property Name *</label>
        <input
          style={styles.input}
          name="propertyName"
          value={formData.propertyName}
          onChange={handleChange}
          placeholder="Enter property name"
          required
        />

        <label>Property Address *</label>
        <input
          style={styles.input}
          name="propertyAddress"
          value={formData.propertyAddress}
          onChange={handleChange}
          placeholder="Enter property address"
          required
        />

        <label>City</label>
        <input
          style={styles.input}
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="Enter city"
        />

        <label>Property Description</label>
        <textarea
          style={styles.textarea}
          name="propertyDescription"
          value={formData.propertyDescription}
          onChange={handleChange}
          placeholder="Describe your property"
          rows={4}
        />

        <div style={styles.row}>
          <div style={styles.field}>
            <label>Latitude</label>
            <input
              style={styles.input}
              type="number"
              step="any"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              placeholder="6.9271"
            />
          </div>

          <div style={styles.field}>
            <label>Longitude</label>
            <input
              style={styles.input}
              type="number"
              step="any"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              placeholder="79.8612"
            />
          </div>
        </div>

        <h2 style={styles.sectionTitle}>Verification Document</h2>

        <label>Document Type *</label>
        <input
          style={styles.input}
          name="documentType"
          value={formData.documentType}
          onChange={handleChange}
          placeholder="e.g. Ownership Proof"
          required
        />

        <label>Document URL *</label>
        <input
          style={styles.input}
          type="url"
          name="documentUrl"
          value={formData.documentUrl}
          onChange={handleChange}
          placeholder="Enter document URL"
          required
        />

        {error && <p style={styles.error}>{error}</p>}

        {success && (
          <div style={styles.successBox}>
            <p style={styles.success}>{success}</p>

            <p style={styles.successInfo}>
              Your account is now pending verification by an administrator.
            </p>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        )}

        {!success && (
          <button
            style={styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Register as Property Owner"}
          </button>
        )}

        <button
          type="button"
          style={styles.linkButton}
          onClick={() => navigate("/login")}
        >
          Already have an account? Login
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
    justifyContent: "center",
    padding: "clamp(20px, 4vw, 40px)",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1f2933",
  },

  card: {
    width: "600px",
    maxWidth: "100%",
    backgroundColor: "#ffffff",
    padding: "clamp(22px, 4vw, 34px)",
    border: "1px solid #e2e7e9",
    borderTop: "3px solid #0f766e",
    borderRadius: "12px",
    boxShadow: "0 12px 32px rgba(22, 34, 42, 0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  title: {
    margin: 0,
    color: "#172033",
    fontSize: "clamp(23px, 3vw, 30px)",
    fontWeight: 750,
  },

  subtitle: {
    marginTop: 0,
    color: "#64748b",
  },

  sectionTitle: {
    marginTop: "20px",
    marginBottom: "5px",
    color: "#172033",
    fontSize: "18px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    color: "#1f2933",
    fontFamily: "inherit",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    resize: "vertical",
    color: "#1f2933",
    fontFamily: "inherit",
  },

  row: {
    display: "flex",
    gap: "12px",
  },

  field: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  button: {
    marginTop: "20px",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#0f766e",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 650,
  },

  secondaryButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#334155",
    color: "#FFFFFF",
    cursor: "pointer",
  },

  linkButton: {
    marginTop: "5px",
    padding: "8px",
    border: "none",
    backgroundColor: "transparent",
    color: "#0f766e",
    cursor: "pointer",
  },

  error: {
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: 0,
  },

  successBox: {
    marginTop: "15px",
    padding: "15px",
    borderRadius: "8px",
    backgroundColor: "#fffbeb",
    border: "1px solid #fcd34d",
  },

  success: {
    color: "#92400e",
    fontWeight: "bold",
    marginTop: 0,
  },

  successInfo: {
    color: "#334155",
  },
};

export default OwnerRegisterPage;