import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMaintenanceRequests } from "../services/maintenanceApi.js";

function MaintenanceRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [requestType, setRequestType] = useState("");
  const [priority, setPriority] = useState("");

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

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
        requestType,
        priority,
        sortBy,
        sortDirection,
        page,
        pageSize: 10,
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
  }, [
    page,
    status,
    requestType,
    priority,
    sortBy,
    sortDirection,
  ]);

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
    setRequestType("");
    setPriority("");
    setSortBy("createdAt");
    setSortDirection("desc");
    setPage(1);
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString();
  }

  return (
    <div>
      <div style={styles.headingRow}>
        <div>
          <h1 style={{ marginBottom: "5px" }}>
            Maintenance Requests
          </h1>

          <p style={styles.subtitle}>
            View and manage maintenance requests submitted by tenants.
          </p>
        </div>

        <div style={styles.totalBox}>
          Total Requests: {totalCount}
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <form style={styles.filters} onSubmit={handleSearch}>
        <input
          style={styles.input}
          type="text"
          placeholder="Search description, category..."
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
          <option value="Emergency">Emergency</option>
          <option value="Analysing">Analysing</option>
          <option value="NeedsMoreInfo">Needs More Info</option>
          <option value="Assigned">Assigned</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
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
          <option value="EMERGENCY">Emergency</option>
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

        <select
          style={styles.input}
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
        >
          <option value="createdAt">Created Date</option>
          <option value="updatedAt">Updated Date</option>
          <option value="status">Status</option>
          <option value="priority">Priority</option>
        </select>

        <select
          style={styles.input}
          value={sortDirection}
          onChange={(e) => {
            setSortDirection(e.target.value);
            setPage(1);
          }}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>

        <button style={styles.searchButton} type="submit">
          Search
        </button>

        <button
          style={styles.clearButton}
          type="button"
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
      ) : (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
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
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={styles.empty}>
                      No maintenance requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id}>
                      <td style={styles.td}>
                        #{request.id}
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
  headingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: 0,
  },

  totalBox: {
    backgroundColor: "#ffffff",
    padding: "12px 18px",
    borderRadius: "8px",
    fontWeight: "600",
  },

  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "25px",
    marginBottom: "20px",
  },

  input: {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    minWidth: "150px",
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
    color: "#6b7280",
  },

  viewButton: {
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
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "15px",
  },
};

export default MaintenanceRequestsPage;