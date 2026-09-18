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
    <div>
      <div style={styles.heading}>
        <div>
          <h1>Emergency Requests</h1>

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
                        {request.priority || "Critical"}
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
  heading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },

  subtitle: {
    color: "#6b7280",
  },

  total: {
    backgroundColor: "#ffffff",
    padding: "12px 18px",
    borderRadius: "8px",
    fontWeight: "600",
  },

  filters: {
    marginTop: "20px",
    marginBottom: "20px",
  },

  input: {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
  },

  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    padding: "14px",
    textAlign: "left",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #e5e7eb",
  },

  empty: {
    textAlign: "center",
    padding: "35px",
  },

  button: {
    padding: "7px 12px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#17324d",
    color: "#ffffff",
    cursor: "pointer",
  },

  pagination: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "15px",
    marginTop: "20px",
  },

  error: {
    color: "red",
  },
};

export default EmergencyRequestsPage;