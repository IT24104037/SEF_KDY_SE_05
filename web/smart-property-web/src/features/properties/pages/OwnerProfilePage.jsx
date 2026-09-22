import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { getOwnerVerificationStatus } from "../services/ownerVerificationApi.js";
import { getCachedVerification } from "../../../routes/OwnerVerificationRoute.jsx";

export default function OwnerProfilePage() {
  const { user } = useAuth();

  // Seed from the route-level cache so navigation to Profile is instant.
  // OwnerVerificationRoute always runs before this page renders, so the cache
  // is already populated. Only falls back to a network fetch if cache is empty
  // (e.g. direct URL access in an unusual session state).
  const cached = getCachedVerification();
  const [profile, setProfile] = useState(cached);
  const [loading, setLoading] = useState(cached === null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Cache hit — nothing to fetch.
    if (cached !== null) return;

    async function loadProfile() {
      try {
        const data = await getOwnerVerificationStatus();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  if (loading) {
    return <p style={{ color: "#6b7280" }}>Loading profile...</p>;
  }

  if (error) {
    return (
      <>
        <h1 style={styles.pageTitle}>Profile</h1>
        <div style={styles.errorBox}>{error}</div>
      </>
    );
  }

  return (
    <div>
      <h1 style={styles.pageTitle}>Profile</h1>
      <p style={styles.pageSubtitle}>Your account information</p>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Account Details</h2>

        <ProfileRow label="Full Name" value={profile?.fullName || user?.fullName || "—"} />
        <ProfileRow label="Email" value={profile?.email || user?.email || "—"} />
        <ProfileRow label="Phone / Mobile" value={profile?.mobile || "—"} />
        <ProfileRow label="Role" value={user?.role || "Property Owner"} />

        <div style={styles.divider} />

        <h2 style={styles.cardTitle}>Verification Status</h2>
        <ProfileRow
          label="Status"
          value={
            <StatusBadge status={profile?.status} />
          }
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

      <div style={styles.infoBox}>
        <span style={styles.infoIcon}>ℹ️</span>
        <span>
          <strong>Profile editing is not currently available.</strong>{" "}
          To update your name, email, or phone, please contact the system administrator.
          (A profile update API endpoint does not currently exist for the PropertyOwner role.)
        </span>
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
  cardTitle: {
    color: "#17324D",
    fontSize: "16px",
    fontWeight: "600",
    marginTop: 0,
    marginBottom: "16px",
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
  divider: {
    borderTop: "1px solid #e5e7eb",
    margin: "20px 0",
  },
  infoBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "14px 16px",
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    color: "#1e40af",
    fontSize: "14px",
    maxWidth: "520px",
  },
  infoIcon: {
    fontSize: "16px",
    flexShrink: 0,
    marginTop: "1px",
  },
  errorBox: {
    padding: "12px 16px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    color: "#b91c1c",
    marginBottom: "20px",
  },
};
