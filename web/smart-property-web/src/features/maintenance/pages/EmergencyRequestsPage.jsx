import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMaintenanceRequests } from "../services/maintenanceApi.js";

function EmergencyRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEmergencyRequests() {
    try {
      setLoading(true);
      setError("");

      const result = await getMaintenanceRequests({
        requestType: "EMERGENCY",
        status,
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
    loadEmergencyRequests();
  }, [page, status]);

  function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString();
  }

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <div>
          <h1 style={styles.title}>Emergency Requests</h1>

          <p style={styles.subtitle}>
            View and monitor emergency maintenance requests.
          </p>
        </div>

        <div style={styles.total}>
          Total Emergencies: {totalCount}
        </div>
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
          <option value="Emergency">Emergency</option>
          <option value="Analysing">Analysing</option>
          <option value="Assigned">Assigned</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>

          <option value="OwnerArrangingExternalEmergencyService">
            Owner Arranging External Emergency Service
          </option>

          <option value="ExternalEmergencyServiceScheduled">
            External Emergency Service Scheduled
          </option>

          <option value="Cancelled">
            Cancelled
          </option>
        </select>
      </div>

      {error && (
        <p style={styles.error}>{error}</p>
      )}

      {loading ? (
        <p>Loading emergency requests...</p>
      ) : (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Emergency Type</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Priority</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={styles.empty}
                    >
                      No emergency requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id}>
                      <td style={styles.td}>
                        #{request.id}
                      </td>

                      <td style={styles.td}>
                        {request.emergencyType || "-"}
                      </td>

                      <td style={styles.td}>
                        {request.description}
                      </td>

                      <td style={styles.td}>
                        <span style={styles.criticalBadge}>{request.priority || "Critical"}</span>
                      </td>

                      <td style={styles.td}>
                        {request.status}
                      </td>

                      <td style={styles.td}>
                        {formatDate(request.createdAt)}
                      </td>

                      <td style={styles.td}>
                        <button
                          style={styles.button}
                          onClick={() =>
                            navigate(
                              `/admin/maintenance/${request.id}`
                            )
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <button
              style={styles.pageButton}
              disabled={page <= 1}
              onClick={() =>
                setPage((current) => current - 1)
              }
            >
              Previous
            </button>

            <span>
              Page {page} of {totalPages || 1}
            </span>

            <button
              style={styles.pageButton}
              disabled={
                totalPages === 0 ||
                page >= totalPages
              }
              onClick={() =>
                setPage((current) => current + 1)
              }
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: { color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  title: { margin: "0 0 6px", color: "#172033", fontSize: "clamp(23px, 3vw, 30px)", fontWeight: 750 },
  heading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },

  subtitle: {
    color: "#64748b",
    fontSize: 14,
  },

  total: {
    backgroundColor: "#ffffff",
    padding: "12px 18px",
    border: "1px solid #e2e7e9",
    borderRadius: "10px",
    fontWeight: "600",
    boxShadow: "0 4px 14px rgba(22, 34, 42, 0.035)",
  },

  filters: {
    marginTop: "20px",
    marginBottom: "20px",
  },

  input: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    color: "#1f2933",
    background: "#ffffff",
    fontFamily: "inherit",
  },

  tableContainer: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e7e9",
    borderRadius: "10px",
    overflowX: "auto",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.04)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    padding: "13px 14px",
    textAlign: "left",
    backgroundColor: "#f3f5f6",
    borderBottom: "1px solid #e2e7e9",
    color: "#526176",
    fontSize: 12,
    fontWeight: 700,
  },

  td: {
    padding: "13px 14px",
    borderBottom: "1px solid #edf1f3",
    color: "#334155",
    fontSize: 13,
  },

  empty: {
    textAlign: "center",
    padding: "35px",
  },

  button: {
    padding: "7px 12px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#5145cd",
    color: "#ffffff",
    cursor: "pointer",
  },

  criticalBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: 999,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    fontSize: 11,
    fontWeight: 700,
  },

  pageButton: {
    padding: "8px 13px",
    border: "1px solid #d8e0eb",
    borderRadius: 8,
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    fontWeight: 600,
  },

  pagination: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "15px",
    marginTop: "20px",
  },

  error: {
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "12px 16px",
  },
};

export default EmergencyRequestsPage;