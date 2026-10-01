import React, { useEffect, useState } from "react";
import { isValidMobileNumber, isValidEmail, isRequired } from "../../../utils/validators";
import tenancyService from "../services/tenancyService";

// Reusable form for both creating and editing a Tenant.
// mode="create": shows FullName + MobileNumber + Email, calls onSubmit with all 3.
// mode="edit": hides MobileNumber (not editable), calls onSubmit with FullName + Email only.
export default function TenantForm({ mode = "create", initialValues = {}, isContextAware = false, onSubmit, submitLabel }) {
  const [fullName, setFullName] = useState(initialValues.fullName || "");
  const [mobileNumber, setMobileNumber] = useState(initialValues.mobileNumber || "");
  const [email, setEmail] = useState(initialValues.email || "");
  const [propertyId, setPropertyId] = useState(initialValues.propertyId || "");
  const [unitId, setUnitId] = useState(initialValues.unitId || "");
  const [options, setOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selectedProperty = options.find(
    (property) => String(property.id) === String(propertyId)
  );
  const availableUnits = (selectedProperty?.units || []).filter(
    (unit) => !unit.isArchived && !unit.isDeleted
  );

  useEffect(() => {
    if (mode === "create") {
      tenancyService.getOptions().then(setOptions).catch(() => setSubmitError("Could not load properties."));
    }
  }, [mode]);

  useEffect(() => {
    if (initialValues.propertyId) setPropertyId(String(initialValues.propertyId));
    if (initialValues.unitId) setUnitId(String(initialValues.unitId));
  }, [initialValues.propertyId, initialValues.unitId]);

  const validate = () => {
    const next = {};
    if (!isRequired(fullName)) next.fullName = "Full name is required.";
    if (mode === "create" && !isValidMobileNumber(mobileNumber)) {
      next.mobileNumber = "Enter a valid mobile number (exactly 10 digits).";
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
    <form onSubmit={handleSubmit} style={styles.form}>
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
            placeholder="e.g. 0771234567 (10 digits)"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            style={inputStyle}
          />
        </Field>
      )}

      {mode === "create" && (
        <>
          <Field label="Property" error={errors.propertyId}>
            <select
              value={propertyId}
              onChange={(e) => {
                if (!isContextAware) {
                  setPropertyId(e.target.value);
                  setUnitId("");
                }
              }}
              disabled={isContextAware}
              style={{
                ...inputStyle,
                backgroundColor: isContextAware ? "#F3F4F6" : "#ffffff",
                cursor: isContextAware ? "not-allowed" : "default",
              }}
            >
              <option value="">Select property</option>
              {options.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unit" error={errors.unitId}>
            <select
              value={unitId}
              onChange={(e) => {
                if (!isContextAware) {
                  setUnitId(e.target.value);
                }
              }}
              disabled={isContextAware || !propertyId || availableUnits.length === 0}
              style={{
                ...inputStyle,
                backgroundColor: isContextAware ? "#F3F4F6" : "#ffffff",
                cursor: isContextAware ? "not-allowed" : "default",
              }}
            >
              <option value="">
                {!propertyId
                  ? "Select a property first"
                  : availableUnits.length === 0
                  ? "No vacant units available"
                  : "Select unit"}
              </option>
              {availableUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unitLabel}
                </option>
              ))}
            </select>
            {!isContextAware && propertyId && availableUnits.length === 0 && (
              <p style={styles.helpText}>
                This property has no vacant units. <a href="/owner/properties">Manage properties and units</a>.
              </p>
            )}
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
        <p style={styles.submitError}>{submitError}</p>
      )}

      <button type="submit" disabled={submitting} style={buttonStyle}>
        {submitting ? "Saving..." : submitLabel || "Save"}
      </button>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
      </label>
      {children}
      {error && <p style={styles.fieldError}>{error}</p>}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
  color: "#1f2933",
  fontFamily: "inherit",
};

const buttonStyle = {
  background: "#0f766e",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  cursor: "pointer",
  width: "100%",
  fontWeight: 650,
};

const styles = {
  form: { maxWidth: 520, display: "grid", gap: 2, padding: "clamp(18px, 3vw, 26px)", background: "#ffffff", border: "1px solid #e2e7e9", borderRadius: 12, boxShadow: "0 8px 24px rgba(22, 34, 42, 0.04)" },
  field: { marginBottom: 14 },
  label: { display: "block", fontSize: 13, color: "#334155", fontWeight: 600, marginBottom: 5 },
  fieldError: { color: "#991b1b", fontSize: 12, margin: "4px 0 0" },
  submitError: { color: "#991b1b", fontSize: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px" },
  helpText: { color: "#64748b", fontSize: 12, margin: "4px 0 0" },
};