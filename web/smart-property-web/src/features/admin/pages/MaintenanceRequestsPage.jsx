import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { archiveMaintenanceRequest } from "../../maintenance/services/maintenanceApi";

function MaintenanceRequestsPage() {
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
        requestType: "NORMAL",
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
          message || "Could not load maintenance requests."
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
          "Failed to load maintenance requests."
      );
    } finally {
      setLoading(false);
    }
  };

  async function handleArchive(id) {
  const confirmed = window.confirm(
    "Remove this completed request from the active request list? " +
    "It will remain permanently in Maintenance History."
  );

  if (!confirmed) return;

  try {
    await archiveMaintenanceRequest(id);
    await loadRequests();
  } catch (err) {
    setError(err.message);
  }
}

  return (
    <div>
      <h1>Maintenance Requests</h1>

      <p>
        View and manage normal maintenance requests.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          style={styles.select}
        >
          <option value="">All Statuses</option>

          <option value="Submitted">
            Submitted
          </option>

          <option value="Analysing">
            Analysing
          </option>

          <option value="NeedsMoreInfo">
            Needs More Info
          </option>

          <option value="Approved">
            Approved
          </option>

          <option value="Rejected">
            Rejected
          </option>

          <option value="Assigned">
            Assigned
          </option>

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

        <button
          onClick={loadRequests}
          style={styles.refreshButton}
        >
          Refresh
        </button>
      </div>

      {loading && (
        <p>Loading maintenance requests...</p>
      )}

      {error && (
        <p style={{ color: "#D64545" }}>
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        requests.length === 0 && (
          <p>No normal maintenance requests found.</p>
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
                    Description
                  </th>
                  <th style={styles.th}>
                    Category
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
                        request.unitLabel ||
                        `#${request.unitId}`}
                    </td>

                    <td style={styles.td}>
                      {request.description}
                    </td>

                    <td style={styles.td}>
                      {request.categoryName ||
                        "Not analysed"}
                    </td>

                    <td style={styles.td}>
                      {request.priority ||
                        "Pending"}
                    </td>

                    <td style={styles.td}>
                      {request.status}
                    </td>

                    <td style={styles.td}>
                      {request.createdAt
                        ? new Date(
                            request.createdAt
                          ).toLocaleString()
                        : "-"}
                    </td>

                    <td style={styles.td}>
                      <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/maintenance/${request.id}`)
                      }
                    >
                      View Details
                    </button>
                       {request.status === "Completed" && (
                          <button
                            type="button"
                            onClick={() => handleArchive(request.id)}
                            style={{
                              marginLeft: "8px",
                              background: "#D64545",
                              color: "#fff",
                              border: "none",
                              padding: "7px 12px",
                              borderRadius: "5px",
                              cursor: "pointer",
                            }}
                          >
                            Remove
                          </button>
                        )}
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
  select: {
    padding: "9px 12px",
    border: "1px solid #DDE3E9",
    borderRadius: 6,
  },

  refreshButton: {
    background: "#1F8A8A",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "9px 14px",
    cursor: "pointer",
  },

  tableWrapper: {
    overflowX: "auto",
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #DDE3E9",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: 12,
    background: "#F5F7FA",
    borderBottom: "1px solid #DDE3E9",
  },

  td: {
    padding: 12,
    borderBottom: "1px solid #DDE3E9",
    verticalAlign: "top",
  },

  viewButton: {
    background: "#17324D",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "7px 10px",
    cursor: "pointer",
  },
};

export default MaintenanceRequestsPage;