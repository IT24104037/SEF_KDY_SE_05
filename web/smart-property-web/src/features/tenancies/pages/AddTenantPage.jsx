import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TenantForm from "../components/TenantForm";
import tenancyService from "../services/tenancyService";

export default function AddTenantPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [created, setCreated] = useState(null); // holds the CreateTenantResponseDto

  const initialPropertyId = searchParams.get("propertyId") || "";
  const initialUnitId = searchParams.get("unitId") || "";
  const isContextAware = Boolean(initialPropertyId && initialUnitId);

  const handleCreate = async (payload) => {
    const result = await tenancyService.createTenant(payload);
    setCreated(result); // includes activationPin + pinExpiresAt
  };

  // ---- Success view: show the one-time PIN clearly ----
  if (created) {
    return (
      <div style={styles.page}>
        <div
          style={styles.successCard}
        >
          <h2 style={styles.successTitle}>Tenant Added Successfully</h2>
          <p style={styles.successText}>
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
              color: "#172033",
              background: "#f3f5f6",
              border: "1px solid #e2e7e9",
              borderRadius: 8,
              margin: "16px 0",
            }}
          >
            {created.activationPin}
          </div>

          <p style={styles.expires}>
            Expires: {new Date(created.pinExpiresAt).toLocaleString()}
          </p>

          <div style={styles.actions}>
            <button onClick={() => navigate(`/owner/tenants/${created.id}`)} style={buttonStyle}>
              View Tenant
            </button>
            <button onClick={() => setCreated(null)} style={secondaryButtonStyle}>
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Form view ----
  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Add Tenant</h2>
      <div style={styles.formCard}>
        <TenantForm
          mode="create"
          initialValues={{ propertyId: initialPropertyId, unitId: initialUnitId }}
          isContextAware={isContextAware}
          onSubmit={handleCreate}
          submitLabel="Add Tenant"
        />
      </div>
    </div>
  );
}

const buttonStyle = {
  background: "#0f766e",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 650,
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#ffffff",
  border: "1px solid #d8e0eb",
  color: "#334155",
};

const styles = {
  page: { padding: "clamp(18px, 3vw, 30px)", color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  title: { margin: "0 0 18px", color: "#172033", fontSize: 22, fontWeight: 700 },
  successCard: { background: "#ffffff", border: "1px solid #bbf7d0", borderTop: "3px solid #15803d", borderRadius: 12, padding: "clamp(20px, 3vw, 28px)", maxWidth: 520, boxShadow: "0 8px 24px rgba(22, 34, 42, 0.045)" },
  formCard: { maxWidth: 580, padding: "4px", background: "#ffffff", border: "1px solid #e2e7e9", borderTop: "3px solid #0f766e", borderRadius: 12, boxShadow: "0 8px 24px rgba(22, 34, 42, 0.04)" },
  successTitle: { color: "#166534", margin: "0 0 8px", fontSize: 20 },
  successText: { color: "#334155", lineHeight: 1.6 },
  expires: { color: "#64748b", fontSize: 13 },
  actions: { display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" },
};