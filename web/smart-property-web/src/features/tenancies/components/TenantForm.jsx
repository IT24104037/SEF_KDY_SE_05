import React, { useEffect, useState } from "react";
import { isValidMobileNumber, isValidEmail, isRequired } from "../../../utils/validators";
import tenancyService from "../services/tenancyService";

// Reusable form for both creating and editing a Tenant.
// mode="create": shows FullName + MobileNumber + Email, calls onSubmit with all 3.
// mode="edit": hides MobileNumber (not editable), calls onSubmit with FullName + Email only.
export default function TenantForm({ mode = "create", initialValues = {}, onSubmit, submitLabel }) {
  const [fullName, setFullName] = useState(initialValues.fullName || "");
  const [mobileNumber, setMobileNumber] = useState(initialValues.mobileNumber || "");
  const [email, setEmail] = useState(initialValues.email || "");
  const [propertyId, setPropertyId] = useState(initialValues.propertyId || "");
  const [unitId, setUnitId] = useState(initialValues.unitId || "");
  const [options, setOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (mode === "create") {
      tenancyService.getOptions().then(setOptions).catch(() => setSubmitError("Could not load properties."));
    }
  }, [mode]);

  const validate = () => {
    const next = {};
    if (!isRequired(fullName)) next.fullName = "Full name is required.";
    if (mode === "create" && !isValidMobileNumber(mobileNumber)) {
      next.mobileNumber = "Enter a valid mobile number (7-15 digits).";
    }
    if (!isValidEmail(email)) next.email = "Enter a valid email address.";
    if (mode === "create" && !propertyId) next.propertyId = "Select a property.";
    if (mode === "create" && !unitId) next.unitId = "Select a unit.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload =
        mode === "create"
          ? { fullName: fullName.trim(), mobileNumber: mobileNumber.trim(), email: email.trim() || null, propertyId: Number(propertyId), unitId: Number(unitId) }
          : { fullName: fullName.trim(), email: email.trim() || null };

      await onSubmit(payload);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
      <Field label="Full Name" error={errors.fullName}>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={inputStyle}
        />
      </Field>

      {mode === "create" && (
        <Field label="Registered Mobile Number" error={errors.mobileNumber}>
          <input
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="e.g. 0771234567"
            style={inputStyle}
          />
        </Field>
      )}

      {mode === "create" && (
        <>
          <Field label="Property" error={errors.propertyId}>
            <select value={propertyId} onChange={(e) => { setPropertyId(e.target.value); setUnitId(""); }} style={inputStyle}>
              <option value="">Select property</option>
              {options.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
            </select>
          </Field>
          <Field label="Unit" error={errors.unitId}>
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)} style={inputStyle}>
              <option value="">Select unit</option>
              {(options.find((property) => String(property.id) === String(propertyId))?.units || []).map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </Field>
        </>
      )}

      <Field label="Email (optional)" error={errors.email}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
      </Field>

      {submitError && (
        <p style={{ color: "#D64545", fontSize: 14 }}>{submitError}</p>
      )}

      <button type="submit" disabled={submitting} style={buttonStyle}>
        {submitting ? "Saving..." : submitLabel || "Save"}
      </button>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, color: "#6B7280", marginBottom: 4 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: "#D64545", fontSize: 12, margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #DDE3E9",
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
};

const buttonStyle = {
  background: "#1F8A8A",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "10px 16px",
  cursor: "pointer",
  width: "100%",
};