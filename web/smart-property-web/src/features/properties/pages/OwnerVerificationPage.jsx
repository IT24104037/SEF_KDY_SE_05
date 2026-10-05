import { useEffect, useState } from "react";

import { getOwnerVerificationStatus } from "../services/ownerVerificationApi.js";

function OwnerVerificationPage() {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVerificationStatus() {
      try {
        const data = await getOwnerVerificationStatus();
        setVerification(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadVerificationStatus();
  }, []);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p>Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Verification Status</h1>
          <p style={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  const status = verification?.status;

  let statusColor = "#D97706";
  let statusBackground = "#FEF3C7";
  let statusMessage =
    "Your verification request is being reviewed by an administrator.";

  if (status === "Verified") {
    statusColor = "#18794E";
    statusBackground = "#EAF7F0";
    statusMessage =
      "Your property owner account has been verified.";
  }

  if (status === "Rejected") {
    statusColor = "#D64545";
    statusBackground = "#FDECEC";
    statusMessage =
      "Your verification request was rejected.";
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Verification Status</h1>

        <p style={styles.subtitle}>
          Property Owner Verification
        </p>

        <div
          style={{
            ...styles.statusBox,
            backgroundColor: statusBackground,
          }}
        >
          <p style={styles.statusLabel}>Current Status</p>

          <p
            style={{
              ...styles.status,
              color: statusColor,
            }}
          >
            {status}
          </p>
        </div>

        <p style={styles.message}>{statusMessage}</p>

        {verification?.verifiedAt && (
          <p style={styles.date}>
            Verified on:{" "}
            {new Date(verification.verifiedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#F5F7FA",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "60px 20px",
  },

  card: {
    width: "500px",
    maxWidth: "100%",
    backgroundColor: "#FFFFFF",
    padding: "32px",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },

  title: {
    marginTop: 0,
    color: "#17324D",
  },

  subtitle: {
    color: "#6B7280",
    marginBottom: "25px",
  },

  statusBox: {
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
  },

  statusLabel: {
    margin: 0,
    color: "#374151",
  },

  status: {
    fontSize: "24px",
    fontWeight: "bold",
    margin: "10px 0 0",
  },

  message: {
    marginTop: "25px",
    color: "#374151",
  },

  date: {
    color: "#6B7280",
    fontSize: "14px",
  },

  error: {
    color: "#D64545",
  },
};

export default OwnerVerificationPage;