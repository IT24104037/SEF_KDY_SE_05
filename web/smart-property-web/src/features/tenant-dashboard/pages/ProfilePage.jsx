import React, { useEffect, useState } from "react";
import tenancyService from "../../tenancies/services/tenancyService";
import {
  isValidEmail,
  isValidMobileNumber,
} from "../../../utils/validators";

const EMPTY_PROFILE = {
  fullName: "",
  mobileNumber: "",
  email: "",
  propertyName: "",
  unitName: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [form, setForm] = useState(EMPTY_PROFILE);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await tenancyService.getMyProfile();

      const nextProfile = {
        fullName: data.fullName ?? "",
        mobileNumber: data.mobileNumber ?? "",
        email: data.email ?? "",
        propertyName: data.propertyName ?? "",
        unitName: data.unitName ?? "",
      };

      setProfile(nextProfile);
      setForm(nextProfile);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message ||
          "Could not load your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleEdit() {
    setForm({ ...profile });
    setValidationError("");
    setErrorMessage("");
    setSuccessMessage("");
    setEditing(true);
  }

  function handleCancel() {
    setForm({ ...profile });
    setValidationError("");
    setErrorMessage("");
    setSuccessMessage("");
    setEditing(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setValidationError("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleUpdate(event) {
    event.preventDefault();

    const mobileNumber = form.mobileNumber.trim();
    const email = form.email.trim();

    if (!isValidMobileNumber(mobileNumber)) {
      setValidationError(
        "Phone number must contain exactly 10 digits."
      );
      return;
    }

    if (!isValidEmail(email)) {
      setValidationError(
        "Please enter a valid email address."
      );
      return;
    }

    setSaving(true);
    setValidationError("");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updated = await tenancyService.updateMyProfile({
        mobileNumber,
        email: email || null,
      });

      const nextProfile = {
        fullName: updated.fullName ?? profile.fullName,
        mobileNumber: updated.mobileNumber ?? mobileNumber,
        email: updated.email ?? "",
        propertyName:
          updated.propertyName ?? profile.propertyName,
        unitName: updated.unitName ?? profile.unitName,
      };

      setProfile(nextProfile);
      setForm(nextProfile);

      setEditing(false);
      setSuccessMessage("Profile updated successfully.");
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message ||
          "Could not update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p style={styles.status}>
        Loading...
      </p>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h2 style={styles.title}>
          Tenant Profile
        </h2>

        {!editing && (
          <button
            type="button"
            style={styles.editButton}
            onClick={handleEdit}
          >
            Edit Profile
          </button>
        )}
      </div>

      {successMessage && (
        <div style={styles.success}>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div style={styles.error}>
          {errorMessage}
        </div>
      )}

      {validationError && (
        <div style={styles.error}>
          {validationError}
        </div>
      )}

      <form
        style={styles.card}
        onSubmit={handleUpdate}
      >
        <ProfileField
          label="Full Name"
          value={
            editing
              ? form.fullName
              : profile.fullName
          }
          readOnly
        />

        <ProfileField
          label="Phone Number"
          name="mobileNumber"
          value={
            editing
              ? form.mobileNumber
              : profile.mobileNumber
          }
          onChange={handleChange}
          readOnly={!editing}
          inputMode="numeric"
          maxLength={10}
        />

        <ProfileField
          label="Email Address"
          name="email"
          type="email"
          value={
            editing
              ? form.email
              : profile.email
          }
          onChange={handleChange}
          readOnly={!editing}
        />

        <ProfileField
          label="Unit Name"
          value={
            editing
              ? form.unitName
              : profile.unitName
          }
          readOnly
        />

        <ProfileField
          label="Property"
          value={
            editing
              ? form.propertyName
              : profile.propertyName
          }
          readOnly
        />

        {editing && (
          <div style={styles.actions}>
            <button
              type="submit"
              style={styles.updateButton}
              disabled={saving}
            >
              {saving ? "Updating..." : "Update"}
            </button>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function ProfileField({
  label,
  value,
  name,
  type = "text",
  onChange,
  readOnly,
  inputMode,
  maxLength,
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
      </label>

      {readOnly ? (
        <div style={styles.readOnlyValue}>
          {value || "-"}
        </div>
      ) : (
        <input
          style={styles.input}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          inputMode={inputMode}
          maxLength={maxLength}
          required={name === "mobileNumber"}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: 24,
    maxWidth: 760,
  },

  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },

  title: {
    margin: 0,
    color: "#17324D",
  },

  card: {
    background: "#FFFFFF",
    border: "1px solid #DDE3E9",
    borderRadius: 8,
    padding: 20,
    maxWidth: 620,
  },

  field: {
    marginBottom: 18,
  },

  label: {
    display: "block",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },

  readOnlyValue: {
    minHeight: 20,
    fontSize: 15,
    color: "#17324D",
    padding: "8px 0",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    fontSize: 15,
    color: "#17324D",
    border: "1px solid #DDE3E9",
    borderRadius: 6,
    outline: "none",
  },

  editButton: {
    padding: "9px 14px",
    border: "none",
    borderRadius: 6,
    background: "#1F8A8A",
    color: "#FFFFFF",
    cursor: "pointer",
  },

  actions: {
    display: "flex",
    gap: 10,
    marginTop: 8,
  },

  updateButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: 6,
    background: "#1F8A8A",
    color: "#FFFFFF",
    cursor: "pointer",
  },

  cancelButton: {
    padding: "10px 16px",
    border: "1px solid #DDE3E9",
    borderRadius: 6,
    background: "#FFFFFF",
    color: "#17324D",
    cursor: "pointer",
  },

  success: {
    marginBottom: 14,
    padding: "10px 12px",
    borderRadius: 6,
    background: "#E8F7F0",
    color: "#16794F",
    border: "1px solid #B7E5D0",
  },

  error: {
    marginBottom: 14,
    padding: "10px 12px",
    borderRadius: 6,
    background: "#FDECEC",
    color: "#B42318",
    border: "1px solid #F5C2C0",
  },

  status: {
    padding: 24,
    color: "#6B7280",
  },
};