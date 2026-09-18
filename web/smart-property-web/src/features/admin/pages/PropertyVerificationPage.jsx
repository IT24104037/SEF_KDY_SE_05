import { useEffect, useState } from "react";
import {
  approveProperty,
  getPendingProperties,
  rejectProperty,
} from "../../../api/propertyVerificationAdminApi.js";

export default function PropertyVerificationPage() {
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadProperties() {
    try {
      setLoading(true);
      setError("");
      setProperties(await getPendingProperties());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  async function handleApprove(propertyId) {
    try {
      await approveProperty(propertyId);
      await loadProperties();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReject(propertyId) {
    const rejectionReason = window.prompt("Enter a rejection reason:");
    if (!rejectionReason?.trim()) return;

    try {
      await rejectProperty(propertyId, rejectionReason.trim());
      await loadProperties();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Property Verification</h1>
      {loading && <p>Loading pending properties...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loading && !error && properties.length === 0 && (
        <p>No pending properties.</p>
      )}
      {properties.map((property) => (
        <section key={property.propertyId} style={styles.card}>
          <h2>{property.name}</h2>
          <p>Owner: {property.ownerName}</p>
          <p>Address: {property.address}</p>
          <p>Status: {property.status}</p>
          {property.documents.map((document) => (
            <p key={document.id}>
              Proof: <a href={document.documentUrl} target="_blank" rel="noreferrer">
                {document.documentType}
              </a>
            </p>
          ))}
          <button onClick={() => handleApprove(property.propertyId)}>Approve</button>
          <button onClick={() => handleReject(property.propertyId)} style={{ marginLeft: 8 }}>
            Reject
          </button>
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
};
