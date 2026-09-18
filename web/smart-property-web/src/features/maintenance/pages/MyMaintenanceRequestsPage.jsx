import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMaintenanceRequests } from "../services/maintenanceApi.js";

function MyMaintenanceRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("");
  const [requestType, setRequestType] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const result = await getMaintenanceRequests({
        status,
        requestType,
        page,
        pageSize: 10,
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      setRequests(result.requests || []);
      setTotalPages(result.totalPages || 0);
      setTotalCount(result.totalCount || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [page, status, requestType]);

  function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headingRow}>
          <div>
            <h1 style={styles.title}>My Maintenance Requests</h1>

            <p style={styles.subtitle}>
              View the maintenance and emergency requests you have submitted.
            </p>
          </div>

          <div style={styles.totalBox}>
            Total Requests: {totalCount}
          </div>
        </div>

        <div style={styles.actions}>
          <button
            style={styles.normalButton}
            onClick={() =>
              navigate("/tenant/maintenance/report")
            }
          >
            Report Maintenance
          </button>

          <button
            style={styles.emergencyButton}
            onClick={() =>
              navigate("/tenant/maintenance/emergency")
            }
          >
            Report Emergency
          </button>
        </div>

        <div style={styles.filters}>
          <select
            style={styles.input}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
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
            <option value="Completed">
              Completed
            </option>
            <option value="Cancelled">
              Cancelled
            </option>
          </select>

          <select
            style={styles.input}
            value={requestType}
            onChange={(e) => {
              setRequestType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            <option value="NORMAL">Normal</option>
            <option value="EMERGENCY">
              Emergency
            </option>
          </select>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {loading ? (
          <p>Loading your maintenance requests...</p>
        ) : requests.length === 0 ? (
          <div style={styles.emptyCard}>
            <h3>No requests found</h3>

            <p>
              You have not submitted any matching
              maintenance requests yet.
            </p>
          </div>
        ) : (
          <>
            <div style={styles.requestList}>
              {requests.map((request) => (
                <div
                  key={request.id}
                  style={styles.card}
                >
                  <div style={styles.cardTop}>
                    <div>
                      <h3 style={styles.cardTitle}>
                        Request #{request.id}
                      </h3>

                      <span>
                        {request.requestType}
                      </span>
                    </div>

                    <strong>
                      {request.status}
                    </strong>
                  </div>

                  <p>
                    {request.description}
                  </p>

                  <div style={styles.details}>
                    <span>
                      <strong>Category:</strong>{" "}
                      {request.categoryName ||
                        "Not analysed"}
                    </span>

                    <span>
                      <strong>Priority:</strong>{" "}
                      {request.priority ||
                        "Pending"}
                    </span>

                    <span>
                      <strong>Submitted:</strong>{" "}
                      {formatDate(
                        request.createdAt
                      )}
                    </span>
                  </div>

                  <button
                    style={styles.viewButton}
                    onClick={() =>
                      navigate(
                        `/tenant/maintenance/requests/${request.id}`
                      )
                    }
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.pagination}>
              <button
                disabled={page <= 1}
                onClick={() =>
                  setPage(
                    (current) =>
                      current - 1
                  )
                }
              >
                Previous
              </button>

              <span>
                Page {page} of{" "}
                {totalPages || 1}
              </span>

              <button
                disabled={
                  totalPages === 0 ||
                  page >= totalPages
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      current + 1
                  )
                }
              >
                Next
              </button>
            </div>
          </>
        )}
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

  headingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },

  title: {
    marginBottom: "6px",
  },

  subtitle: {
    color: "#6b7280",
  },

  totalBox: {
    backgroundColor: "#ffffff",
    padding: "12px 18px",
    borderRadius: "8px",
    fontWeight: "600",
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  normalButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "7px",
    backgroundColor: "#1f8a8a",
    color: "#ffffff",
    cursor: "pointer",
  },

  emergencyButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "7px",
    backgroundColor: "#b42318",
    color: "#ffffff",
    cursor: "pointer",
  },

  filters: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  input: {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
  },

  requestList: {
    display: "grid",
    gap: "15px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "10px",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: "5px",
  },

  details: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    color: "#4b5563",
    marginBottom: "15px",
  },

  viewButton: {
    padding: "8px 14px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#17324d",
    color: "#ffffff",
    cursor: "pointer",
  },

  emptyCard: {
    backgroundColor: "#ffffff",
    padding: "35px",
    borderRadius: "10px",
    textAlign: "center",
  },

  pagination: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "15px",
    marginTop: "20px",
  },

  error: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "7px",
    marginBottom: "20px",
  },
};

export default MyMaintenanceRequestsPage;