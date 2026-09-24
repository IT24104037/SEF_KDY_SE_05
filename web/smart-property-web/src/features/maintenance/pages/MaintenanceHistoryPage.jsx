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
    <div style={{ padding: "24px" }}>
      <h1 style={{ color: "#17324D" }}>
        Maintenance History
      </h1>

      <p style={{ color: "#6B7280" }}>
        Permanent history of normal and emergency
        maintenance requests.
      </p>

      <p>
        Total Records: <strong>{totalCount}</strong>
      </p>

      <form
        onSubmit={handleSearch}
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
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

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
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

        <button type="submit">
          Search
        </button>
      </form>

      {loading && <p>Loading history...</p>}

      {error && (
        <p style={{ color: "#D64545" }}>
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
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
              }}
            >
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
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
          }}
        >
          <button
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
  padding: "12px",
  background: "#F5F7FA",
  borderBottom: "1px solid #DDE3E9",
};

const td = {
  padding: "12px",
  borderBottom: "1px solid #DDE3E9",
  verticalAlign: "top",
};

export default MaintenanceHistoryPage;