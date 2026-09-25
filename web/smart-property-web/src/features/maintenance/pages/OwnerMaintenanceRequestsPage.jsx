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
            <h1>Maintenance Requests</h1>

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
    backgroundColor: "#f4f6f8",
    padding: "40px 20px",
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
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "20px",
    marginBottom: "20px",
  },

  input: {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
  },

  searchButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#1f8a8a",
    color: "#ffffff",
    cursor: "pointer",
  },

  clearButton: {
    padding: "10px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    cursor: "pointer",
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
    padding: "13px",
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },

  td: {
    padding: "13px",
    borderBottom: "1px solid #e5e7eb",
  },

  viewButton: {
    padding: "7px 12px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#17324d",
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
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "7px",
    marginBottom: "20px",
  },
};

export default OwnerMaintenanceRequestsPage;