import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMaintenanceRequests } from "../services/maintenanceApi.js";

function OwnerMaintenanceRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [priority, setPriority] = useState("");

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
        search,
        status,
        requestType: "NORMAL",
        priority,
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
  }, [page, status, priority]);

  async function handleSearch(event) {
    event.preventDefault();

    if (page !== 1) {
      setPage(1);
    } else {
      await loadRequests();
    }
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPriority("");
    setPage(1);
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.heading}>
          <div>
            <h1 style={styles.title}>Maintenance Requests</h1>

            <p style={styles.subtitle}>
              View maintenance requests from tenants in your properties.
            </p>
          </div>

          <div style={styles.total}>
            Total Requests: {totalCount}
          </div>
        </div>

        <form style={styles.filters} onSubmit={handleSearch}>
          <input
            style={styles.input}
            type="text"
            placeholder="Search description or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

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
            <option value="Analysing">Analysing</option>
            <option value="NeedsMoreInfo">Needs More Info</option>
            <option value="Assigned">Assigned</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

        
          <select
            style={styles.input}
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <button style={styles.searchButton}>
            Search
          </button>

          <button
            type="button"
            style={styles.clearButton}
            onClick={clearFilters}
          >
            Clear
          </button>
        </form>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {loading ? (
          <p>Loading maintenance requests...</p>
        ) : requests.length === 0 ? (
          <div style={styles.empty}>
            No maintenance requests found.
          </div>
        ) : (
          <>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Property</th>
                    <th style={styles.th}>Unit</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Priority</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td style={styles.td}>
                        #{request.id}
                      </td>
                    
                      <td>
                          {request.propertyName || `#${request.propertyId}`}
                        </td>

                        <td>
                          {request.unitName || `#${request.unitId}`}
                        </td>

                      <td style={styles.td}>
                        {request.description}
                      </td>

                      <td style={styles.td}>
                        {request.requestType}
                      </td>

                      <td style={styles.td}>
                        {request.categoryName || "Not analysed"}
                      </td>

                      <td style={styles.td}>
                        {request.priority || "Pending"}
                      </td>

                      <td style={styles.td}>
                        {request.status}
                      </td>

                      <td style={styles.td}>
                        {formatDate(request.createdAt)}
                      </td>

                      <td style={styles.td}>
                        <button
                          style={styles.viewButton}
                          onClick={() =>
                            navigate(
                              `/owner/maintenance/${request.id}`
                            )
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
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
                  totalPages === 0 || page >= totalPages
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
    maxWidth: "1200px",
    margin: "0 auto",
  },

  heading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },

  title: { margin: "0 0 6px", color: "#172033", fontSize: "clamp(23px, 3vw, 30px)", fontWeight: 750 },

  subtitle: {
    color: "#64748b",
    fontSize: "14px",
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
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "20px",
    marginBottom: "20px",
  },

  input: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    color: "#1f2933",
    background: "#fff",
    fontFamily: "inherit",
  },

  searchButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#0f766e",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 650,
  },

  clearButton: {
    padding: "10px 18px",
    border: "1px solid #d8e0eb",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    cursor: "pointer",
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
    borderBottom: "1px solid #e2e7e9",
    backgroundColor: "#f3f5f6",
    color: "#526176",
    fontSize: "12px",
    fontWeight: 700,
  },

  td: {
    padding: "13px 14px",
    borderBottom: "1px solid #edf1f3",
    color: "#334155",
    fontSize: "13px",
  },

  viewButton: {
    padding: "7px 12px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#0f766e",
    color: "#ffffff",
    cursor: "pointer",
  },

  empty: {
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
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
};

export default OwnerMaintenanceRequestsPage;