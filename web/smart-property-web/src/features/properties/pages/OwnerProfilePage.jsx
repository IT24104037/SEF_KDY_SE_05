import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { getOwnerVerificationStatus } from "../services/ownerVerificationApi.js";
import { getCachedVerification } from "../../../routes/OwnerVerificationRoute.jsx";
import { getMyProfileChangeRequest, submitProfileChangeRequest } from "../../../api/ownerProfileApi.js";

export default function OwnerProfilePage() {
  const { user } = useAuth();

  const cached = getCachedVerification();
  const [profile, setProfile] = useState(cached);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        let verificationData = cached;
        if (!verificationData) {
          verificationData = await getOwnerVerificationStatus();
        }
        setProfile(verificationData);

        const initialName = verificationData?.fullName || user?.fullName || "";
        const initialEmail = verificationData?.email || user?.email || "";
        const initialMobile = verificationData?.mobile || "";
        setFormData({
          fullName: initialName,
          email: initialEmail,
          mobile: initialMobile,
        });

        try {
          const changeReq = await getMyProfileChangeRequest();
          if (changeReq && changeReq.id) {
            setPendingRequest(changeReq);
          }
        } catch {
          setPendingRequest(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPendingRequest = pendingRequest?.status === "Pending";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!formData.fullName.trim()) {
      setError("Full Name is required.");
      return;
    }

    try {
      setSubmitting(true);
      const newRequest = await submitProfileChangeRequest({
        fullName: formData.fullName.trim(),
        email: formData.email ? formData.email.trim() : null,
        mobile: formData.mobile ? formData.mobile.trim() : null,
      });

      setPendingRequest(newRequest);
      setIsEditing(false);
      setSuccessMessage(
        "Profile change request submitted successfully and is awaiting admin approval."
      );
    } catch (err) {
      setError(err.message || "Failed to submit profile change request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p style={{ color: "#6b7280" }}>Loading profile...</p>;
  }

  return (
    <div>
      <h1 style={styles.pageTitle}>Profile</h1>
      <p style={styles.pageSubtitle}>Your account information and settings</p>

      {error && <div style={styles.errorBox}>{error}</div>}
      {successMessage && <div style={styles.successBox}>{successMessage}</div>}

      {/* Pending Request Banner */}
      {hasPendingRequest && (
        <div style={styles.pendingBanner}>
          <div style={styles.pendingHeader}>
            <span style={styles.infoIcon}>⏳</span>
            <strong>Profile Change Request Pending Admin Approval</strong>
          </div>
          <p style={{ margin: "8px 0 6px 0", fontSize: "14px" }}>
            You have requested updates to your profile. Your current account details remain active until an admin approves the changes.
          </p>
          <div style={styles.pendingDetails}>
            <div><strong>Requested Name:</strong> {pendingRequest.requestedFullName}</div>
            {pendingRequest.requestedEmail && (
              <div><strong>Requested Email:</strong> {pendingRequest.requestedEmail}</div>
            )}
            {pendingRequest.requestedMobile && (
              <div><strong>Requested Mobile:</strong> {pendingRequest.requestedMobile}</div>
            )}
            <div style={{ fontSize: "12px", color: "#854d0e", marginTop: "6px" }}>
              Submitted: {new Date(pendingRequest.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Rejected Request Banner */}
      {pendingRequest?.status === "Rejected" && (
        <div style={styles.rejectedBanner}>
          <div style={styles.pendingHeader}>
            <span style={styles.infoIcon}>❌</span>
            <strong>Previous Profile Change Request Rejected</strong>
          </div>
          {pendingRequest.rejectionReason && (
            <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
              <strong>Reason:</strong> {pendingRequest.rejectionReason}
            </p>
          )}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Account Details</h2>
          {!isEditing && (
            <button
              style={hasPendingRequest ? styles.editButtonDisabled : styles.editButton}
              disabled={hasPendingRequest}
              onClick={() => {
                setError("");
                setSuccessMessage("");
                setIsEditing(true);
              }}
              title={hasPendingRequest ? "A profile change request is already pending." : "Request Profile Change"}
            >
              {hasPendingRequest ? "Change Request Pending" : "Edit Profile"}
            </button>
          )}
        </div>

        {!isEditing ? (
          <>
            <ProfileRow label="Full Name" value={profile?.fullName || user?.fullName || "—"} />
            <ProfileRow label="Email" value={profile?.email || user?.email || "—"} />
            <ProfileRow label="Phone / Mobile" value={profile?.mobile || "—"} />
            <ProfileRow label="Role" value={user?.role || "Property Owner"} />
          </>
        ) : (
          <form onSubmit={handleSubmitRequest} style={{ marginTop: "12px" }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone / Mobile</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Role (Read-Only)</label>
              <input
                type="text"
                value={user?.role || "Property Owner"}
                style={styles.inputReadOnly}
                disabled
              />
            </div>

            <div style={styles.buttonGroup}>
              <button
                type="submit"
                disabled={submitting}
                style={submitting ? styles.submitButtonDisabled : styles.submitButton}
              >
                {submitting ? "Submitting..." : "Submit Change Request"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div style={styles.divider} />

        <h2 style={styles.cardTitle}>Verification Status</h2>
        <ProfileRow
          label="Status"
          value={<StatusBadge status={profile?.status || "Verified"} />}
        />
        {profile?.rejectionReason && (
          <ProfileRow label="Rejection Reason" value={profile.rejectionReason} />
        )}
        {profile?.verifiedAt && (
          <ProfileRow
            label="Verified At"
            value={new Date(profile.verifiedAt).toLocaleDateString()}
          />
        )}
      </div>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const colorMap = {
    Verified: { bg: "#d1fae5", color: "#065f46" },
    PendingVerification: { bg: "#fef9c3", color: "#92400e" },
    Rejected: { bg: "#fee2e2", color: "#991b1b" },
  };
  const colors = colorMap[status] || { bg: "#f3f4f6", color: "#374151" };
  const label =
    status === "PendingVerification"
      ? "Pending Verification"
      : status || "Unknown";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "12px",
        fontSize: "13px",
        fontWeight: "600",
        backgroundColor: colors.bg,
        color: colors.color,
      }}
    >
      {label}
    </span>
  );
}

const styles = {
  pageTitle: {
    marginTop: 0,
    color: "#17324D",
    fontSize: "24px",
    fontWeight: "700",
  },
  pageSubtitle: {
    color: "#6B7280",
    marginBottom: "24px",
    marginTop: "4px",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    maxWidth: "520px",
    marginBottom: "24px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  cardTitle: {
    color: "#17324D",
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
  },
  editButton: {
    backgroundColor: "#17324D",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  editButtonDisabled: {
    backgroundColor: "#9ca3af",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "not-allowed",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  rowLabel: {
    color: "#6B7280",
    fontSize: "14px",
    fontWeight: "500",
    minWidth: "140px",
  },
  rowValue: {
    color: "#111827",
    fontSize: "14px",
    textAlign: "right",
  },
  formGroup: {
    marginBottom: "14px",
  },
  label: {
    display: "block",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "4px",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  inputReadOnly: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "#f9fafb",
    color: "#6b7280",
    boxSizing: "border-box",
    cursor: "not-allowed",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
  },
  submitButton: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  submitButtonDisabled: {
    backgroundColor: "#6ee7b7",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "not-allowed",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "14px",
    cursor: "pointer",
  },
  divider: {
    borderTop: "1px solid #e5e7eb",
    margin: "20px 0",
  },
  pendingBanner: {
    backgroundColor: "#fefce8",
    border: "1px solid #fef08a",
    color: "#854d0e",
    padding: "16px",
    borderRadius: "8px",
    maxWidth: "520px",
    marginBottom: "20px",
  },
  rejectedBanner: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#991b1b",
    padding: "16px",
    borderRadius: "8px",
    maxWidth: "520px",
    marginBottom: "20px",
  },
  pendingHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  },
  pendingDetails: {
    marginTop: "8px",
    paddingTop: "8px",
    borderTop: "1px solid #fef08a",
    fontSize: "13px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  infoIcon: {
    fontSize: "16px",
    flexShrink: 0,
  },
  errorBox: {
    padding: "12px 16px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    color: "#b91c1c",
    marginBottom: "20px",
    maxWidth: "520px",
  },
  successBox: {
    padding: "12px 16px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    color: "#166534",
    marginBottom: "20px",
    maxWidth: "520px",
  },
};
