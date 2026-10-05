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
                style={styles.paginationButton}
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
                style={styles.paginationButton}
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
    backgroundColor: "#f3f5f6",
    padding: "clamp(20px, 4vw, 40px)",
    color: "#1f2933",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  container: {
    maxWidth: "1100px",
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
    margin: "0 0 6px",
    color: "#172033",
    fontSize: "clamp(23px, 3vw, 30px)",
    fontWeight: 750,
  },

  subtitle: {
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  totalBox: {
    backgroundColor: "#ffffff",
    padding: "12px 18px",
    border: "1px solid #e2e7e9",
    borderRadius: "10px",
    fontWeight: "600",
    boxShadow: "0 4px 14px rgba(22, 34, 42, 0.035)",
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
    borderRadius: "8px",
    backgroundColor: "#0369a1",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 650,
  },

  emergencyButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#b91c1c",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
  },

  filters: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  input: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    color: "#1f2933",
    backgroundColor: "#ffffff",
    fontFamily: "inherit",
  },

  requestList: {
    display: "grid",
    gap: "15px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "22px",
    border: "1px solid #e2e7e9",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.045)",
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
    borderRadius: "8px",
    backgroundColor: "#0369a1",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 650,
  },

  emptyCard: {
    backgroundColor: "#ffffff",
    padding: "35px",
    border: "1px solid #e2e7e9",
    borderRadius: "12px",
    textAlign: "center",
    color: "#64748b",
  },

  pagination: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "15px",
    marginTop: "20px",
  },

  paginationButton: {
    padding: "8px 13px",
    border: "1px solid #d8e0eb",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    fontWeight: 600,
  },

  error: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
};

export default MyMaintenanceRequestsPage;