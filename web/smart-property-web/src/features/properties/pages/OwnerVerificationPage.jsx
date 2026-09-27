import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getOwnerVerificationStatus,
  reapplyOwnerVerification,
} from "../services/ownerVerificationApi.js";
import { getFullName, logout } from "../../../utils/auth.js";

const emptyForm = {
  fullName: "",
  email: "",
  mobile: "",
  propertyName: "",
  propertyAddress: "",
  city: "",
  propertyDescription: "",
  latitude: "",
  longitude: "",
  documentType: "",
  documentUrl: "",
};

function OwnerVerificationPage() {
  const navigate = useNavigate();
  const [verification, setVerification] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    getOwnerVerificationStatus({ signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setVerification(data);
        if (data.status === "Verified") {
          navigate("/owner/dashboard", { replace: true });
          return;
        }
        setFormData({
          fullName: data.fullName || "",
          email: data.email || "",
          mobile: data.mobile || "",
          propertyName: data.property?.name || "",
          propertyAddress: data.property?.address || "",
          city: data.property?.city || "",
          propertyDescription: data.property?.description || "",
          latitude: data.property?.latitude ?? "",
          longitude: data.property?.longitude ?? "",
          documentType: data.document?.documentType || "",
          documentUrl: data.document?.documentUrl || "",
        });
      })
      .catch((err) => {
        if (active && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "mobile") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((current) => ({ ...current, mobile: numericValue }));
      return;
    }

    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleReapply(event) {
    event.preventDefault();

    setError("");

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

    setSaving(true);
    try {
      const result = await reapplyOwnerVerification({
        fullName: formData.fullName.trim(),
        email: emailTrimmed,
        mobile: mobileTrimmed,
        propertyName: formData.propertyName.trim(),
        propertyAddress: formData.propertyAddress.trim(),
        city: formData.city ? formData.city.trim() : null,
        propertyDescription: formData.propertyDescription
          ? formData.propertyDescription.trim()
          : null,
        latitude:
          formData.latitude === "" || formData.latitude === null
            ? null
            : Number(formData.latitude),
        longitude:
          formData.longitude === "" || formData.longitude === null
            ? null
            : Number(formData.longitude),
        documentType: formData.documentType.trim(),
        documentUrl: formData.documentUrl.trim(),
      });
      setVerification((current) => ({
        ...current,
        status: result.status,
        rejectionReason: null,
      }));
      setEditing(false);
    } catch (err) {
      setError(err.message || "Failed to resubmit application.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.subtitle}>Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (error && !verification) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.error}>{error}</p>
          <button style={styles.secondaryButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  const rejected = verification?.status === "Rejected";
  const pending = verification?.status === "PendingVerification";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          Welcome {verification?.fullName || getFullName()}
        </h1>

        <p style={styles.subtitle}>
          {editing
            ? "Update Registration Details & Reapply"
            : "Owner registration verification status"}
        </p>

        {pending && (
          <div style={styles.infoBox}>
            <p style={{ margin: 0 }}>
              Your account is currently under administrator review. Your registration details will be processed shortly.
            </p>
          </div>
        )}

        {rejected && (
          <div style={styles.rejectedBanner}>
            <h3 style={styles.rejectedTitle}>⚠️ Application Rejected</h3>

            <p style={styles.rejectedReason}>
              <strong>Reason for Rejection:</strong>{" "}
              {verification.rejectionReason || "No reason provided."}
            </p>

            {!editing && (
              <button
                style={styles.button}
                onClick={() => {
                  setError("");
                  setEditing(true);
                }}
              >
                Edit & Reapply
              </button>
            )}
          </div>
        )}

        {editing && (
          <form style={styles.form} onSubmit={handleReapply}>
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

            <button style={styles.button} type="submit" disabled={saving}>
              {saving ? "Resubmitting..." : "Resubmit for Review"}
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                setError("");
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </form>
        )}

        <button style={styles.logout} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#F5F7FA",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
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
    marginBottom: "15px",
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

  form: {
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
    marginTop: "10px",
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#17324D",
    color: "#FFFFFF",
    cursor: "pointer",
  },

  logout: {
    marginTop: "20px",
    padding: "10px 16px",
    border: "1px solid #DDE3E9",
    borderRadius: "6px",
    backgroundColor: "#F3F4F6",
    color: "#374151",
    cursor: "pointer",
    alignSelf: "flex-start",
  },

  error: {
    color: "#D64545",
    margin: "10px 0 0 0",
  },

  infoBox: {
    padding: "15px",
    borderRadius: "6px",
    backgroundColor: "#EBF8FF",
    border: "1px solid #BEE3F8",
    color: "#2B6CB0",
    marginBottom: "15px",
  },

  rejectedBanner: {
    padding: "16px",
    borderRadius: "8px",
    backgroundColor: "#FEF2F2",
    border: "1px solid #FCA5A5",
    color: "#991B1B",
    marginBottom: "15px",
  },

  rejectedTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "bold",
  },

  rejectedReason: {
    marginTop: "6px",
    marginBottom: "10px",
    fontSize: "14px",
  },
};

export default OwnerVerificationPage;