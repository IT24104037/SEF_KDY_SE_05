import { useEffect, useState } from "react";
import {
  getAllOwners,
  updateOwnerVerification,
} from "../../../api/ownerVerificationAdminApi.js";

export default function OwnerVerificationPage() {
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadOwners() {
    try {
      setLoading(true);
      setError("");
      setOwners(await getAllOwners());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOwners();
  }, []);

  async function handleDecision(decision) {
    if (!selectedOwner) return;
    try {
      setError("");
      setMessage("");
      await updateOwnerVerification(selectedOwner.ownerId, decision, rejectionReason);
      setMessage(`Owner ${decision === "Verified" ? "approved" : "rejected"} successfully.`);
      setSelectedOwner(null);
      setRejectionReason("");
      await loadOwners();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredOwners = owners.filter((owner) => {
    const matchesSearch =
      !search ||
      owner.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      owner.email?.toLowerCase().includes(search.toLowerCase()) ||
      (owner.mobile && owner.mobile.includes(search));

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "PendingVerification" && (owner.status === "PendingVerification" || owner.status === "UnderReview")) ||
      (statusFilter === "Verified" && (owner.status === "Verified" || owner.status === "Approved")) ||
      (statusFilter === "Rejected" && owner.status === "Rejected");

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Admin workspace</p>
          <h1 style={styles.title}>Owner Verification</h1>
          <p style={styles.muted}>Review and manage Property Owner account verification records.</p>
        </div>
      </div>

      <div style={styles.filters}>
        <input
          style={styles.input}
          placeholder="Search name, email or mobile"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          style={styles.input}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="PendingVerification">Under Review</option>
          <option value="Verified">Approved / Verified</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}

      {loading ? (
        <p>Loading owner applications...</p>
      ) : filteredOwners.length === 0 ? (
        <p style={styles.empty}>No owner verification records match these filters.</p>
      ) : (
        <div style={styles.cardList}>
          {filteredOwners.map((owner) => (
            <div key={owner.ownerId} style={styles.cardItem}>
              <div style={styles.cardMain}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <strong style={styles.cardTitle}>{owner.fullName}</strong>
                  <p style={styles.cardSub}>
                    {owner.email} {owner.mobile ? `· ${owner.mobile}` : ""}
                  </p>
                </div>
                <div style={styles.cardMeta}>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    Submitted: {new Date(owner.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div style={styles.cardRight}>
                <span style={statusStyle(owner.status)}>{formatStatus(owner.status)}</span>
                <button
                  style={styles.secondaryButton}
                  onClick={() => {
                    setSelectedOwner(owner);
                    setRejectionReason("");
                    setError("");
                  }}
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOwner && (
        <div style={styles.overlay}>
          <section style={styles.modal}>
            <button style={styles.close} onClick={() => setSelectedOwner(null)}>
              ✕
            </button>
            <p style={styles.eyebrow}>Owner Record #{selectedOwner.ownerId}</p>
            <h2 style={styles.modalTitle}>{selectedOwner.fullName}</h2>
            <p style={{ margin: "4px 0 16px", color: "#6b7280" }}>
              {selectedOwner.email} · {selectedOwner.mobile || "No mobile number"}
            </p>

            <div style={styles.infoGrid}>
              <div>
                <strong>Status:</strong>{" "}
                <span style={statusStyle(selectedOwner.status)}>
                  {formatStatus(selectedOwner.status)}
                </span>
              </div>
              <div>
                <strong>Submitted:</strong> {new Date(selectedOwner.createdAt).toLocaleString()}
              </div>
              {selectedOwner.verifiedAt && (
                <div>
                  <strong>Verified Date:</strong> {new Date(selectedOwner.verifiedAt).toLocaleString()}
                </div>
              )}
            </div>

            {selectedOwner.status === "Rejected" && selectedOwner.rejectionReason && (
              <div style={styles.rejectionNote}>
                <strong>Rejection Reason:</strong> {selectedOwner.rejectionReason}
              </div>
            )}

            {selectedOwner.documents && selectedOwner.documents.length > 0 && (
              <div style={styles.docBox}>
                <strong style={{ fontSize: "12px", color: "#0369a1", textTransform: "uppercase" }}>
                  📄 Verification Documents
                </strong>
                {selectedOwner.documents.map((doc) => (
                  <div key={doc.id} style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{doc.documentType || "Proof Document"}</span>
                    <a
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.viewDocButton}
                    >
                      ↗ Open Document
                    </a>
                  </div>
                ))}
              </div>
            )}

            {(selectedOwner.status === "PendingVerification" || selectedOwner.status === "UnderReview") && (
              <>
                <label style={styles.field}>
                  Rejection reason
                  <textarea
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="Required only when rejecting..."
                    rows={3}
                    style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </label>
                <div style={styles.actions}>
                  <button
                    style={styles.rejectButton}
                    onClick={() => handleDecision("Rejected")}
                    disabled={!rejectionReason.trim()}
                  >
                    Reject
                  </button>
                  <button style={styles.primaryButton} onClick={() => handleDecision("Verified")}>
                    Approve Owner
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function formatStatus(status) {
  if (status === "PendingVerification" || status === "UnderReview") return "Under Review";
  if (status === "Verified" || status === "Approved") return "Approved";
  if (status === "Rejected") return "Rejected";
  return status;
}

function statusStyle(status) {
  const colors = {
    PendingVerification: ["#fff7e6", "#b56b00"],
    UnderReview: ["#fff7e6", "#b56b00"],
    Verified: ["#e8f7ef", "#16804a"],
    Approved: ["#e8f7ef", "#16804a"],
    Rejected: ["#fff1f1", "#b42318"],
  };
  const [background, color] = colors[status] || ["#f5f7fa", "#25313c"];
  return { padding: "4px 8px", borderRadius: "999px", background, color, fontSize: "12px", fontWeight: 700 };
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", marginBottom: "24px" },
  eyebrow: { margin: 0, color: "#1f8a8a", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" },
  title: { margin: "8px 0", color: "#17324d" },
  modalTitle: { margin: "0 0 4px", color: "#17324d" },
  muted: { color: "#6b7280" },
  filters: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "22px" },
  input: { minWidth: "220px", padding: "11px", border: "1px solid #dde3e9", borderRadius: "6px" },
  primaryButton: { padding: "11px 16px", border: 0, borderRadius: "6px", background: "#1f8a8a", color: "#fff", cursor: "pointer", fontWeight: 700 },
  secondaryButton: { padding: "7px 12px", border: "1px solid #1f8a8a", borderRadius: "6px", background: "#fff", color: "#1f8a8a", cursor: "pointer", fontWeight: 700 },
  rejectButton: { padding: "11px 16px", border: 0, borderRadius: "6px", background: "#d64545", color: "#fff", cursor: "pointer", fontWeight: 700 },
  viewDocButton: { padding: "5px 10px", border: "1px solid #0284c7", borderRadius: "6px", background: "#e0f2fe", color: "#0369a1", textDecoration: "none", fontWeight: 700, fontSize: "12px" },
  docBox: { margin: "16px 0", padding: "14px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px" },
  cardList: { display: "flex", flexDirection: "column", gap: "12px" },
  cardItem: {
    background: "#fff",
    border: "1px solid #dde3e9",
    borderRadius: "8px",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  },
  cardMain: { display: "flex", alignItems: "center", gap: "24px", flex: 1, flexWrap: "wrap" },
  cardTitle: { fontSize: "15px", color: "#17324d" },
  cardSub: { margin: "3px 0 0", color: "#6b7280", fontSize: "13px" },
  cardMeta: { minWidth: "130px" },
  cardRight: { display: "flex", alignItems: "center", gap: "14px" },
  empty: { padding: "24px", color: "#6b7280" },
  success: { color: "#16804a", background: "#e8f7ef", padding: "12px", borderRadius: "6px" },
  error: { color: "#b42318", background: "#fff1f1", padding: "12px", borderRadius: "6px" },
  rejectionNote: { marginTop: "12px", padding: "12px", background: "#fff1f1", color: "#b42318", borderRadius: "6px", fontSize: "14px" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "14px 0", fontSize: "14px" },
  overlay: { position: "fixed", inset: 0, background: "rgba(23,50,77,.42)", display: "grid", placeItems: "center", padding: "24px", zIndex: 100 },
  modal: { position: "relative", width: "min(600px, 100%)", maxHeight: "90vh", overflowY: "auto", padding: "30px", background: "#fff", borderRadius: "8px", boxShadow: "0 24px 80px rgba(0,0,0,.2)" },
  close: { position: "absolute", top: "18px", right: "18px", border: 0, background: "transparent", color: "#6b7280", cursor: "pointer", fontSize: "18px", fontWeight: "bold" },
  field: { display: "grid", gap: "8px", marginTop: "16px", fontWeight: 700 },
  actions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" },
};
