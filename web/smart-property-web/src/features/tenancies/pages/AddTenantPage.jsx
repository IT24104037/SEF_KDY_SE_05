import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TenantForm from "../components/TenantForm";
import tenancyService from "../services/tenancyService";

export default function AddTenantPage() {
  const navigate = useNavigate();
  const [created, setCreated] = useState(null); // holds the CreateTenantResponseDto

  const handleCreate = async (payload) => {
    const result = await tenancyService.createTenant(payload);
    setCreated(result); // includes activationPin + pinExpiresAt
  };

  // ---- Success view: show the one-time PIN clearly ----
  if (created) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #DDE3E9",
            borderRadius: 8,
            padding: 24,
            maxWidth: 420,
          }}
        >
          <h2 style={{ color: "#22A06B" }}>Tenant Added Successfully</h2>
          <p style={{ color: "#25313C" }}>
            Share this one-time Activation PIN with <strong>{created.fullName}</strong>{" "}
            outside the app (SMS, call, or in person). It will not be shown again.
          </p>

          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: 4,
              textAlign: "center",
              padding: "16px 0",
              color: "#17324D",
              background: "#F5F7FA",
              borderRadius: 6,
              margin: "16px 0",
            }}
          >
            {created.activationPin}
          </div>

          <p style={{ color: "#6B7280", fontSize: 13 }}>
            Expires: {new Date(created.pinExpiresAt).toLocaleString()}
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button onClick={() => navigate(`/owner/tenants/${created.id}`)} style={buttonStyle}>
              View Tenant
            </button>
            <button onClick={() => setCreated(null)} style={{ ...buttonStyle, background: "#6B7280" }}>
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Form view ----
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#17324D" }}>Add Tenant</h2>
      <TenantForm mode="create" onSubmit={handleCreate} submitLabel="Add Tenant" />
    </div>
  );
}

const buttonStyle = {
  background: "#1F8A8A",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "10px 16px",
  cursor: "pointer",
};