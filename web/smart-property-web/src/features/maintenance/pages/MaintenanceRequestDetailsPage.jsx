import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getMaintenanceRequestById,
  getMaintenanceHistory,
  updateMaintenanceStatus,
} from "../services/maintenanceApi.js";

function MaintenanceRequestDetailsPage() {
  const { id } = useParams();

  const [request, setRequest] = useState(null);
  const [history, setHistory] = useState([]);

  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDetails() {
    try {
      setLoading(true);
      setError("");

      const [requestData, historyData] = await Promise.all([
        getMaintenanceRequestById(id),
        getMaintenanceHistory(id),
      ]);

      setRequest(requestData);
      setHistory(historyData);
      setNewStatus(requestData.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [id]);

  async function handleStatusUpdate(event) {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      await updateMaintenanceStatus(
        id,
        newStatus,
        note
      );

      setMessage("Status updated successfully.");
      setNote("");

      await loadDetails();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString();
  }

  if (loading) {
    return <p>Loading maintenance request...</p>;
  }

  if (error && !request) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!request) {
    return <p>Maintenance request not found.</p>;
  }

  return (
    <div>
      <h1>Maintenance Request #{request.id}</h1>

      {message && (
        <p style={styles.success}>{message}</p>
      )}

      {error && (
        <p style={styles.error}>{error}</p>
      )}

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2>Request Details</h2>

          <p>
            <strong>Description:</strong>{" "}
            {request.description}
          </p>

          <p>
            <strong>Type:</strong>{" "}
            {request.requestType}
          </p>

          <p>
            <strong>Emergency Type:</strong>{" "}
            {request.emergencyType || "-"}
          </p>

          <p>
            <strong>Category:</strong>{" "}
            {request.categoryName || "Not analysed"}
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
            <strong>Property ID:</strong>{" "}
            {request.propertyId}
          </p>

          <p>
           <strong>Address:</strong>{" "}
           {request.propertyAddress || "-"}
           </p>
          <p>
            <strong>Unit ID:</strong>{" "}
            {request.unitId}
          </p>

          <p>
            <strong>Created:</strong>{" "}
            {formatDate(request.createdAt)}
          </p>
        </div>

        <div style={styles.card}>
          <h2>Photos</h2>

          {request.imageUrls?.length > 0 ? (
            <div style={styles.images}>
              {request.imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Maintenance ${index + 1}`}
                  style={styles.image}
                />
              ))}
            </div>
          ) : (
            <p>No photo available.</p>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <h2>Update Status</h2>

        <form
          style={styles.statusForm}
          onSubmit={handleStatusUpdate}
        >
          <select
            style={styles.input}
            value={newStatus}
            onChange={(e) =>
              setNewStatus(e.target.value)
            }
          >
            <option value="Submitted">Submitted</option>
            <option value="Emergency">Emergency</option>
            <option value="Analysing">Analysing</option>
            <option value="NeedsMoreInfo">
              Needs More Info
            </option>
            <option value="Assigned">Assigned</option>
            <option value="InProgress">
              In Progress
            </option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="OwnerArrangingExternalMaintenance">
              Owner Arranging External Maintenance
            </option>
            <option value="OwnerArrangingExternalEmergencyService">
              Owner Arranging External Emergency Service
            </option>
            <option value="ExternalMaintenanceScheduled">
              External Maintenance Scheduled
            </option>
            <option value="ExternalEmergencyServiceScheduled">
              External Emergency Service Scheduled
            </option>
          </select>

          <input
            style={styles.input}
            type="text"
            placeholder="Status note (optional)"
            value={note}
            onChange={(e) =>
              setNote(e.target.value)
            }
          />

          <button style={styles.button}>
            Update Status
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <h2>Status History</h2>

        {history.length === 0 ? (
          <p>No status history available.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>From</th>
                <th style={styles.th}>To</th>
                <th style={styles.th}>Note</th>
                <th style={styles.th}>Changed</th>
              </tr>
            </thead>

            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>
                    {item.oldStatus || "-"}
                  </td>

                  <td style={styles.td}>
                    {item.newStatus}
                  </td>

                  <td style={styles.td}>
                    {item.note || "-"}
                  </td>

                  <td style={styles.td}>
                    {formatDate(item.changedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
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
    width: "220px",
    maxHeight: "180px",
    objectFit: "cover",
    borderRadius: "8px",
  },

  statusForm: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  input: {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
  },

  button: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#1f8a8a",
    color: "white",
    cursor: "pointer",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },

  success: {
    color: "green",
  },

  error: {
    color: "red",
  },
};

export default MaintenanceRequestDetailsPage;