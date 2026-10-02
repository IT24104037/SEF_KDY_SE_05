import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProperty } from "../services/propertyService.js";

const emptyForm = {
  name: "",
  address: "",
  city: "",
  description: "",
  latitude: "",
  longitude: "",
  documentType: "",
  documentUrl: "",
};

function AddPropertyPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const propertyData = {
        name: form.name,
        address: form.address,
        city: form.city || null,
        description: form.description || null,
        latitude:
          form.latitude === "" ? null : Number(form.latitude),
        longitude:
          form.longitude === "" ? null : Number(form.longitude),
        documentType: form.documentType,
        documentUrl: form.documentUrl,
      };

      await createProperty(propertyData);

      navigate("/owner/properties");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={styles.page}
    >
      <h1 style={styles.title}>Add Property</h1>

      <p style={styles.subtitle}>
        Add a new property to your property portfolio.
      </p>

      {error && (
        <div
          style={styles.error}
        >
          {error}
        </div>
      )}

      <section
        style={styles.card}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label>
              Property Name
              <br />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={150}
                style={styles.input}
              />
            </label>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              Address
              <br />
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </label>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              City
              <br />
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                style={styles.input}
              />
            </label>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              Description
              <br />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                style={styles.input}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "15px",
            }}
          >
            <label style={{ flex: 1 }}>
              Latitude
              <br />
              <input
                type="number"
                step="any"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                style={styles.input}
              />
            </label>

            <label style={{ flex: 1 }}>
              Longitude
              <br />
              <input
                type="number"
                step="any"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                style={styles.input}
              />
            </label>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              Verification Document Type
              <br />
              <input
                type="text"
                name="documentType"
                value={form.documentType}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </label>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              Verification Document URL
              <br />
              <input
                type="url"
                name="documentUrl"
                value={form.documentUrl}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </label>
          </div>

          <button type="submit" disabled={saving} style={styles.primaryButton}>
            {saving ? "Adding..." : "Add Property"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/owner/properties")}
            style={styles.secondaryButton}
          >
            Cancel
          </button>
        </form>
      </section>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "clamp(18px, 3vw, 34px)",
    color: "#1f2933",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  title: {
    margin: "0 0 6px",
    color: "#172033",
    fontSize: "clamp(23px, 3vw, 30px)",
    fontWeight: 750,
  },
  subtitle: {
    color: "#64748b",
    margin: "0 0 22px",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  error: {
    padding: "12px 16px",
    marginBottom: "20px",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
  },
  card: {
    border: "1px solid #e2e7e9",
    borderRadius: "12px",
    padding: "clamp(18px, 3vw, 28px)",
    backgroundColor: "#ffffff",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.045)",
  },
  primaryButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#0f766e",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 650,
  },
  secondaryButton: {
    marginLeft: "10px",
    padding: "10px 16px",
    border: "1px solid #d8e0eb",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    boxSizing: "border-box",
    color: "#1f2933",
    backgroundColor: "#ffffff",
    fontSize: "14px",
    fontFamily: "inherit",
  },
};

export default AddPropertyPage;