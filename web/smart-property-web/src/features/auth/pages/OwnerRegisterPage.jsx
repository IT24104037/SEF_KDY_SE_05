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

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const ownerData = {
        ...formData,
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

        <label>Email</label>
        <input
          style={styles.input}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
        />

        <label>Mobile</label>
        <input
          style={styles.input}
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          placeholder="Enter your mobile number"
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
    backgroundColor: "#F5F7FA",
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
  },

  card: {
    width: "600px",
    maxWidth: "100%",
    backgroundColor: "#FFFFFF",
    padding: "32px",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  title: {
    margin: 0,
    color: "#17324D",
  },

  subtitle: {
    marginTop: 0,
    color: "#6B7280",
  },

  sectionTitle: {
    marginTop: "20px",
    marginBottom: "5px",
    color: "#17324D",
    fontSize: "18px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    border: "1px solid #DDE3E9",
    borderRadius: "6px",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    border: "1px solid #DDE3E9",
    borderRadius: "6px",
    resize: "vertical",
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
    borderRadius: "6px",
    backgroundColor: "#1F8A8A",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: "15px",
  },

  secondaryButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#17324D",
    color: "#FFFFFF",
    cursor: "pointer",
  },

  linkButton: {
    marginTop: "5px",
    padding: "8px",
    border: "none",
    backgroundColor: "transparent",
    color: "#1F8A8A",
    cursor: "pointer",
  },

  error: {
    color: "#D64545",
    marginBottom: 0,
  },

  successBox: {
    marginTop: "15px",
    padding: "15px",
    borderRadius: "6px",
    backgroundColor: "#EAF7F0",
  },

  success: {
    color: "#18794E",
    fontWeight: "bold",
    marginTop: 0,
  },

  successInfo: {
    color: "#374151",
  },
};

export default OwnerRegisterPage;