import { useEffect, useState } from "react";
import {
  getMaintenanceHistoryRequests,
} from "../services/maintenanceApi";

function MaintenanceHistoryPage() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [requestType, setRequestType] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHistory() {
    try {
      setLoading(true);
      setError("");

      const result =
        await getMaintenanceHistoryRequests({
          search,
          requestType,
          status,
          page,
          pageSize: 20,
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
    loadHistory();
  }, [page, requestType, status]);

  function handleSearch(event) {
    event.preventDefault();

    if (page !== 1) {
      setPage(1);
    } else {
      loadHistory();
    }
  }

  function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString();
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>
        Maintenance History
      </h1>

      <p style={styles.subtitle}>
        Permanent history of normal and emergency
        maintenance requests.
      </p>

      <p style={styles.total}>
        Total Records: <strong>{totalCount}</strong>
      </p>

      <form
        onSubmit={handleSearch}
        style={styles.filters}
      >
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={styles.input}
        />

        <select
          value={requestType}
          onChange={(e) => {
            setRequestType(e.target.value);
            setPage(1);
          }}
          style={styles.input}
        >
          <option value="">All Types</option>
          <option value="NORMAL">Normal</option>
          <option value="EMERGENCY">
            Emergency
          </option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={styles.input}
        >
          <option value="">All Status</option>
          <option value="Submitted">Submitted</option>
          <option value="Emergency">Emergency</option>
          <option value="Approved">Approved</option>
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

        <button type="submit" style={styles.searchButton}>
          Search
        </button>
      </form>

      {loading && <p>Loading history...</p>}

      {error && (
        <p style={styles.error}>
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        requests.length === 0 && (
          <p>No maintenance history found.</p>
        )}

      {!loading &&
        !error &&
        requests.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={th}>ID</th>
                  <th style={th}>Type</th>
                  <th style={th}>Property</th>
                  <th style={th}>Unit</th>
                  <th style={th}>Description</th>
                  <th style={th}>Category</th>
                  <th style={th}>Priority</th>
                  <th style={th}>Status</th>
                  <th style={th}>Created</th>
                  <th style={th}>Last Updated</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td style={td}>
                      #{request.id}
                    </td>

                    <td style={td}>
                      {request.requestType}
                    </td>

                    <td style={td}>
                      {request.propertyName || "-"}
                    </td>

                    <td style={td}>
                      {request.unitName || "-"}
                    </td>

                    <td style={td}>
                      {request.description}
                    </td>

                    <td style={td}>
                      {request.categoryName || "-"}
                    </td>

                    <td style={td}>
                      {request.priority || "-"}
                    </td>

                    <td style={td}>
                      {request.status}
                    </td>

                    <td style={td}>
                      {formatDate(request.createdAt)}
                    </td>

                    <td style={td}>
                      {formatDate(request.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {totalPages > 1 && (
        <div
          style={styles.pagination}
        >
          <button
            style={styles.pageButton}
            disabled={page <= 1}
            onClick={() =>
              setPage((p) => p - 1)
            }
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            style={styles.pageButton}
            disabled={page >= totalPages}
            onClick={() =>
              setPage((p) => p + 1)
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "13px 14px",
  background: "#f3f5f6",
  borderBottom: "1px solid #e2e7e9",
  color: "#526176",
  fontSize: 12,
  fontWeight: 700,
};

const td = {
  padding: "13px 14px",
  borderBottom: "1px solid #edf1f3",
  color: "#334155",
  fontSize: 13,
  verticalAlign: "top",
};

const styles = {
  page: { padding: "clamp(18px, 3vw, 30px)", color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  title: { color: "#172033", margin: "0 0 8px", fontSize: "clamp(23px, 3vw, 30px)", fontWeight: 750 },
  subtitle: { color: "#64748b", margin: "0 0 14px", fontSize: 14 },
  total: { margin: "0 0 16px", color: "#334155", fontSize: 14 },
  filters: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  input: { padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#1f2933", fontSize: 13, fontFamily: "inherit" },
  searchButton: { padding: "10px 16px", border: 0, borderRadius: 8, background: "#5145cd", color: "#fff", cursor: "pointer", fontWeight: 650 },
  error: { color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px" },
  tableWrapper: { overflowX: "auto", background: "#fff", border: "1px solid #e2e7e9", borderRadius: 10, boxShadow: "0 8px 24px rgba(22, 34, 42, 0.04)" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  pagination: { marginTop: 20, display: "flex", gap: 10, alignItems: "center" },
  pageButton: { padding: "8px 13px", border: "1px solid #d8e0eb", borderRadius: 8, background: "#fff", color: "#334155", cursor: "pointer", fontWeight: 600 },
};

export default MaintenanceHistoryPage;