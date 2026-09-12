import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TenantForm from "../components/TenantForm";
import tenancyService from "../services/tenancyService";

export default function AddTenantPage() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");

  const handleCreate = async (payload) => {
    const created = await tenancyService.createTenant(payload);
    setSuccessMessage(`Tenant "${created.fullName}" was added successfully.`);

    // Give the success message a moment to be seen, then go to their details.
    setTimeout(() => {
      navigate(`/owner/tenants/${created.id}`);
    }, 1200);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#17324D" }}>Add Tenant</h2>

      {successMessage && (
        <p style={{ color: "#22A06B", fontWeight: 600 }}>{successMessage}</p>
      )}

      <TenantForm mode="create" onSubmit={handleCreate} submitLabel="Add Tenant" />
    </div>
  );
}