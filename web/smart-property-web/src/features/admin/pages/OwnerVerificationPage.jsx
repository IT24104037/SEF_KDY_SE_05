import { useEffect, useState } from "react";
import {
  getPendingOwners,
  updateOwnerVerification,
} from "../../../api/ownerVerificationAdminApi.js";

export default function OwnerVerificationPage() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rejectingOwner, setRejectingOwner] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  async function loadOwners() {
    try {
      setLoading(true);
      setError("");
      setOwners(await getPendingOwners());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOwners();
  }, []);

  async function handleDecision(ownerId, status, reason = "") {
    try {
      setError("");
      setMessage("");
      await updateOwnerVerification(ownerId, status, reason);
      setMessage(`Owner ${status.toLowerCase()} successfully.`);
      setRejectingOwner(null);
      setRejectionReason("");
      await loadOwners();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Owner Verification</h1>
      <p>Review pending Property Owner accounts before they manage properties and units.</p>

      {loading && <p>Loading pending owners...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {message && <p style={{ color: "#18794e" }}>{message}</p>}
      {!loading && !error && owners.length === 0 && <p>No pending owners.</p>}

      {owners.map((owner) => (
        <section key={owner.ownerId} style={styles.card}>
          <h2>{owner.fullName}</h2>
          <p>{owner.email}</p>
          <p>{owner.mobile || "No mobile number"}</p>
          <p>Submitted: {new Date(owner.createdAt).toLocaleString()}</p>
          <button onClick={() => handleDecision(owner.ownerId, "Verified")}>
            Approve
          </button>
          <button
            onClick={() => {
              setRejectingOwner(owner);
              setRejectionReason("");
              setError("");
            }}
            style={{ marginLeft: 8 }}
          >
            Reject
          </button>
          {rejectingOwner?.ownerId === owner.ownerId && (
            <div style={styles.rejectionBox}>
              <h3>Reject Owner Verification</h3>
              <label>
                Reason for rejection:
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  rows={4}
                  required
                />
              </label>
              <button
                onClick={() => handleDecision(owner.ownerId, "Rejected", rejectionReason)}
                disabled={!rejectionReason.trim()}
              >
                Reject
              </button>
              <button onClick={() => setRejectingOwner(null)} style={{ marginLeft: 8 }}>
                Cancel
              </button>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: 20,
    marginTop: 16,
  },
  rejectionBox: {
    marginTop: 16,
    padding: 16,
    border: "1px solid #fca5a5",
    background: "#fff7f7",
  },
};
