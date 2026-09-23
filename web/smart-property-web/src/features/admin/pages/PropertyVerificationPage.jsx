import { useEffect, useState } from "react";
import {
  approveProperty,
  getAllProperties,
  rejectProperty,
} from "../../../api/propertyVerificationAdminApi.js";

export default function PropertyVerificationPage() {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadProperties() {
    try {
      setLoading(true);
      setError("");
      setProperties(await getAllProperties());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  async function handleApprove() {
    if (!selectedProperty) return;
    try {
      setError("");
      setMessage("");
      await approveProperty(selectedProperty.propertyId);
      setMessage(`Property approved successfully.`);
      setSelectedProperty(null);
      await loadProperties();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReject() {
    if (!selectedProperty) return;
    if (!rejectionReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    try {
      setError("");
      setMessage("");
      await rejectProperty(selectedProperty.propertyId, rejectionReason.trim());
      setMessage(`Property rejected successfully.`);
      setSelectedProperty(null);
      setRejectionReason("");
      await loadProperties();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      !search ||
      property.name?.toLowerCase().includes(search.toLowerCase()) ||
      property.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      property.ownerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      property.address?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "UnderReview" && (property.status === "UnderReview" || property.status === "PendingVerification")) ||
      (statusFilter === "Approved" && (property.status === "Approved" || property.status === "Verified")) ||
      (statusFilter === "Rejected" && property.status === "Rejected");

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Admin workspace</p>
          <h1 style={styles.title}>Property Verification</h1>
          <p style={styles.muted}>Review and manage property verification records before properties become active.</p>
        </div>
      </div>

      <div style={styles.filters}>
        <input
          style={styles.input}
          placeholder="Search property, owner or address"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          style={styles.input}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="UnderReview">Under Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}

      {loading ? (
        <p>Loading property verification applications...</p>
      ) : filteredProperties.length === 0 ? (
        <p style={styles.empty}>No property verification records match these filters.</p>
      ) : (
        <div style={styles.cardList}>
          {filteredProperties.map((property) => (
            <div key={property.propertyId} style={styles.cardItem}>
              <div style={styles.cardMain}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <strong style={styles.cardTitle}>{property.name}</strong>
                  <p style={styles.cardSub}>
                    Owner: {property.ownerName} ({property.ownerEmail})
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <span style={{ fontSize: "13px", color: "#475569" }}>
                    📍 {property.address}
                  </span>
                </div>
                <div style={styles.cardMeta}>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    Submitted: {new Date(property.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div style={styles.cardRight}>
                <span style={statusStyle(property.status)}>{formatStatus(property.status)}</span>
                <button
                  style={styles.secondaryButton}
                  onClick={() => {
                    setSelectedProperty(property);
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

      {selectedProperty && (
        <div style={styles.overlay}>
          <section style={styles.modal}>
            <button style={styles.close} onClick={() => setSelectedProperty(null)}>
              ✕
            </button>
            <p style={styles.eyebrow}>Property Record #{selectedProperty.propertyId}</p>
            <h2 style={styles.modalTitle}>{selectedProperty.name}</h2>
            <p style={{ margin: "4px 0 16px", color: "#6b7280" }}>
              Owner: {selectedProperty.ownerName} ({selectedProperty.ownerEmail})
            </p>

            <div style={styles.infoGrid}>
              <div>
                <strong>Status:</strong>{" "}
                <span style={statusStyle(selectedProperty.status)}>
                  {formatStatus(selectedProperty.status)}
                </span>
              </div>
              <div>
                <strong>Address:</strong> {selectedProperty.address} {selectedProperty.city ? `, ${selectedProperty.city}` : ""}
              </div>
              <div>
                <strong>Submitted Date:</strong> {new Date(selectedProperty.submittedAt).toLocaleString()}
              </div>
              {selectedProperty.verifiedAt && (
                <div>
                  <strong>Verified Date:</strong> {new Date(selectedProperty.verifiedAt).toLocaleString()}
                </div>
              )}
            </div>

            {selectedProperty.description && (
              <p style={{ margin: "8px 0", color: "#475569", fontSize: "14px" }}>
                <strong>Description:</strong> {selectedProperty.description}
              </p>
            )}

            {selectedProperty.status === "Rejected" && selectedProperty.rejectionReason && (
              <div style={styles.rejectionNote}>
                <strong>Rejection Reason:</strong> {selectedProperty.rejectionReason}
              </div>
            )}

            {selectedProperty.documents && selectedProperty.documents.length > 0 && (
              <div style={styles.docBox}>
                <strong style={{ fontSize: "12px", color: "#0369a1", textTransform: "uppercase" }}>
                  📄 Ownership Verification Document
                </strong>
                {selectedProperty.documents.map((doc) => (
                  <div key={doc.id} style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Document Type: {doc.documentType || "Deed / Ownership Proof"}</span>
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

            {(selectedProperty.status === "UnderReview" || selectedProperty.status === "PendingVerification") && (
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
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                  >
                    Reject
                  </button>
                  <button style={styles.primaryButton} onClick={handleApprove}>
                    Approve Property
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
  if (status === "UnderReview" || status === "PendingVerification") return "Under Review";
  if (status === "Approved" || status === "Verified") return "Approved";
  if (status === "Rejected") return "Rejected";
  return status;
}

function statusStyle(status) {
  const colors = {
    UnderReview: ["#fff7e6", "#b56b00"],
    PendingVerification: ["#fff7e6", "#b56b00"],
    Approved: ["#e8f7ef", "#16804a"],
    Verified: ["#e8f7ef", "#16804a"],
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
