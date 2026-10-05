import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TenantForm from "../components/TenantForm";
import tenancyService from "../services/tenancyService";

export default function TenantDetailsPage() {
  const { id } = useParams();
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

  if (loading) return <p style={{ padding: 24, color: "#6B7280" }}>Loading...</p>;
  if (errorMessage) return <p style={{ padding: 24, color: "#D64545" }}>{errorMessage}</p>;
  if (!tenant) return null;

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h2 style={{ color: "#17324D" }}>Tenant Details</h2>

      {successMessage && <p style={{ color: "#22A06B", fontWeight: 600 }}>{successMessage}</p>}

      {!editing ? (
        <div style={{ background: "#fff", border: "1px solid #DDE3E9", borderRadius: 8, padding: 16 }}>
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
        </div>
      ) : (
        <TenantForm
          mode="edit"
          initialValues={{ fullName: tenant.fullName, email: tenant.email }}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
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
  background: "#1F8A8A",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: 14,
  marginTop: 8,
};