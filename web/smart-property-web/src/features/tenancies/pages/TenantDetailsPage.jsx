import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TenantForm from "../components/TenantForm";
import tenancyService from "../services/tenancyService";

export default function TenantDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTenant = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await tenancyService.getTenantById(id);
      setTenant(data);
    } catch (err) {
      if (err?.response?.status === 404) {
        setErrorMessage("Tenant not found.");
      } else {
        setErrorMessage("Could not load tenant details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (payload) => {
    const updated = await tenancyService.updateTenant(id, payload);
    setTenant(updated);
    setEditing(false);
    setSuccessMessage("Tenant updated successfully.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  if (loading) return <p style={styles.loading}>Loading...</p>;
  if (errorMessage) return <p style={styles.error}>{errorMessage}</p>;
  if (!tenant) return null;

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Tenant Details</h2>

      {successMessage && <p style={styles.success}>{successMessage}</p>}

      {!editing ? (
        <div style={styles.card}>
          <Row label="Full Name" value={tenant.fullName} />
          <Row label="Mobile Number" value={tenant.mobileNumber} />
          <Row label="Email" value={tenant.email || "—"} />
          <Row label="Property" value={tenant.propertyName} />
          <Row label="Unit" value={tenant.unitName} />
          <Row
            label="Account Status"
            value={tenant.isActive ? "Active" : "Pending Activation"}
          />
          <Row label="Created" value={new Date(tenant.createdAt).toLocaleString()} />
          <Row label="Last Updated" value={new Date(tenant.updatedAt).toLocaleString()} />

          <button onClick={() => setEditing(true)} style={buttonStyle}>
            Edit Tenant
          </button>
          <button onClick={() => navigate(`/owner/tenants/${id}/tenancies`)} style={secondaryButtonStyle}>
            Manage Tenancies
          </button>
        </div>
      ) : (
        <div style={styles.editCard}>
          <TenantForm
            mode="edit"
            initialValues={{ fullName: tenant.fullName, email: tenant.email }}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
          />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "#6B7280" }}>{label}</div>
      <div style={{ fontSize: 15 }}>{value}</div>
    </div>
  );
}

const buttonStyle = {
  background: "#0f766e",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: 14,
  marginTop: 8,
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#ffffff",
  color: "#334155",
  border: "1px solid #d8e0eb",
  marginLeft: 8,
};

const styles = {
  page: { padding: "clamp(18px, 3vw, 30px)", maxWidth: 640, color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  title: { margin: "0 0 18px", color: "#172033", fontSize: 22, fontWeight: 700 },
  card: { background: "#ffffff", border: "1px solid #e2e7e9", borderTop: "3px solid #0f766e", borderRadius: 12, padding: 22, boxShadow: "0 8px 24px rgba(22, 34, 42, 0.045)" },
  editCard: { background: "#ffffff", border: "1px solid #e2e7e9", borderTop: "3px solid #0f766e", borderRadius: 12, padding: "clamp(16px, 3vw, 22px)", boxShadow: "0 8px 24px rgba(22, 34, 42, 0.045)" },
  loading: { padding: 24, color: "#64748b" },
  error: { padding: "12px 16px", color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 },
  success: { color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "11px 14px", fontWeight: 600 },
};