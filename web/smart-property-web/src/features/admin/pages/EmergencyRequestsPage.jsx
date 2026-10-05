import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function EmergencyRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("token");

      const params = new URLSearchParams({
        requestType: "EMERGENCY",
        page: "1",
        pageSize: "50",
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `http://localhost:5144/api/maintenance-requests?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message || "Could not load emergency requests."
        );
      }

      const data = await response.json();

      setRequests(
        data.requests ||
          data.items ||
          data.data ||
          []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load emergency requests."
      );
    } finally {
      setLoading(false);
    }
  };

  function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString();
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Emergency Requests</h1>

      <p style={styles.subtitle}>
        View emergency maintenance requests from all properties.
      </p>

      <div style={styles.filters}>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          style={styles.select}
        >
          <option value="">All Statuses</option>
          <option value="Emergency">Emergency</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          onClick={loadRequests}
          style={styles.refreshButton}
        >
          Refresh
        </button>
      </div>

      {loading && (
        <p>Loading emergency requests...</p>
      )}

      {error && (
        <p style={styles.error}>
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        requests.length === 0 && (
          <div style={styles.empty}>
            No emergency requests found.
          </div>
        )}

      {!loading &&
        !error &&
        requests.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Property</th>
                  <th style={styles.th}>Unit</th>
                  <th style={styles.th}>
                    Emergency Type
                  </th>
                  <th style={styles.th}>
                    Description
                  </th>
                  <th style={styles.th}>
                    Priority
                  </th>
                  <th style={styles.th}>
                    Status
                  </th>
                  <th style={styles.th}>
                    Created
                  </th>
                  <th style={styles.th}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td style={styles.td}>
                      #{request.id}
                    </td>

                    <td style={styles.td}>
                      {request.propertyName ||
                        `#${request.propertyId}`}
                    </td>

                    <td style={styles.td}>
                      {request.unitName ||
                        `#${request.unitId}`}
                    </td>

                    <td style={styles.td}>
                      {request.emergencyType || "-"}
                    </td>

                    <td style={styles.td}>
                      {request.description}
                    </td>

                    <td style={styles.td}>
                      <span style={styles.criticalBadge}>
                        {request.priority || "Critical"}
                      </span>
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
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

const styles = {
  page: { color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  title: { margin: "0 0 6px", color: "#172033", fontSize: "clamp(23px, 3vw, 30px)", fontWeight: 750 },
  subtitle: { margin: "0 0 20px", color: "#64748b", fontSize: 14, lineHeight: 1.6 },
  filters: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  select: {
    padding: "9px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    color: "#1f2933",
    background: "#ffffff",
    fontFamily: "inherit",
  },

  refreshButton: {
    backgroundColor: "#5145cd",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: 650,
  },

  tableWrapper: {
    overflowX: "auto",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    border: "1px solid #e2e7e9",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.04)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "13px 14px",
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
    verticalAlign: "top",
  },

  criticalBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontWeight: "600",
  },

  viewButton: {
    backgroundColor: "#5145cd",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "7px 10px",
    cursor: "pointer",
  },

  error: {
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "12px 16px",
  },

  empty: {
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "8px",
    border: "1px solid #DDE3E9",
  },
};

export default EmergencyRequestsPage;