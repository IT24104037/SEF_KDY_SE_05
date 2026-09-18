import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getMaintenanceRequestById,
  getMaintenanceHistory,
  updateMaintenanceStatus,
} from "../services/maintenanceApi.js";

function TenantMaintenanceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDetails() {
    try {
      setLoading(true);
      setError("");

      const [requestData, historyData] =
        await Promise.all([
          getMaintenanceRequestById(id),
          getMaintenanceHistory(id),
        ]);

      setRequest(requestData);
      setHistory(historyData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [id]);

  function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString();
  }

  function canCancel() {
    if (!request) return false;

    return [
      "Submitted",
      "NeedsMoreInfo",
      "Emergency",
    ].includes(request.status);
  }

  async function handleCancel() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this maintenance request?"
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setError("");
      setMessage("");

      await updateMaintenanceStatus(
        id,
        "Cancelled",
        "Cancelled by tenant."
      );

      setMessage(
        "Maintenance request cancelled successfully."
      );

      await loadDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <p>Loading maintenance request...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div style={styles.page}>
        <p>
          {error || "Maintenance request not found."}
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button
          style={styles.backButton}
          onClick={() =>
            navigate("/tenant/maintenance/requests")
          }
        >
          ← Back to My Requests
        </button>

        <div style={styles.headingRow}>
          <div>
            <h1>
              Maintenance Request #{request.id}
            </h1>

            <p style={styles.subtitle}>
              Submitted{" "}
              {formatDate(request.createdAt)}
            </p>
          </div>

          <div style={styles.statusBox}>
            {request.status}
          </div>
        </div>

        {message && (
          <div style={styles.success}>
            {message}
          </div>
        )}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2>Request Details</h2>

            <p>
              <strong>Type:</strong>{" "}
              {request.requestType}
            </p>

            {request.requestType ===
              "EMERGENCY" && (
              <p>
                <strong>
                  Emergency Type:
                </strong>{" "}
                {request.emergencyType || "-"}
              </p>
            )}

            <p>
              <strong>Description:</strong>
            </p>

            <p>{request.description}</p>

            <p>
              <strong>Category:</strong>{" "}
              {request.categoryName ||
                "Not analysed yet"}
            </p>

            <p>
              <strong>Priority:</strong>{" "}
              {request.priority || "Pending"}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {request.status}
            </p>

            <p>
              <strong>Updated:</strong>{" "}
              {formatDate(request.updatedAt)}
            </p>
          </div>

          <div style={styles.card}>
            <h2>Photo</h2>

            {request.imageUrls?.length > 0 ? (
              <div style={styles.images}>
                {request.imageUrls.map(
                  (url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Maintenance ${index + 1}`}
                      style={styles.image}
                    />
                  )
                )}
              </div>
            ) : (
              <p>No photo was provided.</p>
            )}
          </div>
        </div>

        {canCancel() && (
          <div style={styles.card}>
            <h2>Request Actions</h2>

            <p style={styles.subtitle}>
              You can cancel this request before
              processing progresses further.
            </p>

            <button
              style={styles.cancelButton}
              disabled={cancelling}
              onClick={handleCancel}
            >
              {cancelling
                ? "Cancelling..."
                : "Cancel Request"}
            </button>
          </div>
        )}

        <div style={styles.card}>
          <h2>Status History</h2>

          {history.length === 0 ? (
            <p>No status history available.</p>
          ) : (
            <div style={styles.historyList}>
              {history.map((item) => (
                <div
                  key={item.id}
                  style={styles.historyItem}
                >
                  <div>
                    <strong>
                      {item.oldStatus || "Created"}
                    </strong>

                    {" → "}

                    <strong>
                      {item.newStatus}
                    </strong>
                  </div>

                  <div style={styles.historyDate}>
                    {formatDate(item.changedAt)}
                  </div>

                  {item.note && (
                    <div style={styles.historyNote}>
                      {item.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f6f8",
    padding: "40px 20px",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  backButton: {
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: 0,
    marginBottom: "18px",
    fontWeight: "600",
  },

  headingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  subtitle: {
    color: "#6b7280",
  },

  statusBox: {
    backgroundColor: "#ffffff",
    padding: "10px 18px",
    borderRadius: "20px",
    fontWeight: "600",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "22px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  images: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  image: {
    width: "100%",
    maxWidth: "350px",
    maxHeight: "280px",
    objectFit: "cover",
    borderRadius: "8px",
  },

  cancelButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#b42318",
    color: "#ffffff",
    cursor: "pointer",
  },

  historyList: {
    display: "grid",
    gap: "12px",
  },

  historyItem: {
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "12px",
  },

  historyDate: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "4px",
  },

  historyNote: {
    marginTop: "5px",
  },

  success: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "12px",
    borderRadius: "7px",
    marginBottom: "20px",
  },

  error: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "7px",
    marginBottom: "20px",
  },
};

export default TenantMaintenanceDetailsPage;