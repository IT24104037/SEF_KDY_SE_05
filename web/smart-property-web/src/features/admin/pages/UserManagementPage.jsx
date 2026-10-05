import { useEffect, useState } from "react";

import {
  getUsers,
  suspendUser,
  reactivateUser,
} from "../../../api/adminUsersApi.js";

function UserManagementPage() {
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const result = await getUsers({
        search,
        role,
        isActive: status,
        page,
        pageSize: 10,
      });

      setUsers(result.users);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [page, role, status]);

 async function handleSearch(event) {
  event.preventDefault();

  if (page !== 1) {
    setPage(1);
  } else {
    await loadUsers();
  }
}

  async function handleSuspend(id) {
    try {
      setMessage("");
      setError("");

      await suspendUser(id);

      setMessage("User suspended successfully.");

      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReactivate(id) {
    try {
      setMessage("");
      setError("");

      await reactivateUser(id);

      setMessage("User reactivated successfully.");

      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>User Management</h1>

      <p style={styles.subtitle}>
        Search users, filter accounts and manage account status.
      </p>

      <form style={styles.filters} onSubmit={handleSearch}>
        <input
          style={styles.input}
          type="text"
          placeholder="Search name, email or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={styles.input}
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Roles</option>

          <option value="Admin">
            Admin
          </option>

          <option value="PropertyOwner">
            Property Owner
          </option>

          <option value="Tenant">
            Tenant
          </option>

          <option value="MaintenanceWorker">
            Maintenance Worker
          </option>
        </select>

        <select
          style={styles.input}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Suspended</option>
        </select>

        <button style={styles.searchButton}>
          Search
        </button>
      </form>

      {message && (
        <p style={styles.success}>{message}</p>
      )}

      {error && (
        <p style={styles.error}>{error}</p>
      )}

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Mobile</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={styles.empty}
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td style={styles.td}>
                        {user.fullName}
                      </td>

                      <td style={styles.td}>
                        {user.email || "-"}
                      </td>

                      <td style={styles.td}>
                        {user.mobile || "-"}
                      </td>

                      <td style={styles.td}>
                        {user.role}
                      </td>

                      <td style={styles.td}>
                        {user.isActive
                          ? "Active"
                          : "Suspended"}
                      </td>

                      <td style={styles.td}>
                        {user.isActive ? (
                          <button
                            style={styles.suspendButton}
                            onClick={() =>
                              handleSuspend(user.id)
                            }
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            style={styles.activateButton}
                            onClick={() =>
                              handleReactivate(user.id)
                            }
                          >
                            Reactivate
                          </button>
                        )}
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
                page >= totalPages ||
                totalPages === 0
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
  page: {
    color: "#1f2933",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  title: {
    margin: "0 0 6px",
    color: "#172033",
    fontSize: "clamp(23px, 3vw, 30px)",
    fontWeight: 750,
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  filters: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "22px",
    marginBottom: "20px",
  },

  input: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    minWidth: "180px",
    color: "#1f2933",
    backgroundColor: "#ffffff",
    fontSize: "13px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },

  searchButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#5145cd",
    color: "white",
    cursor: "pointer",
    fontWeight: 650,
  },

  tableContainer: {
    backgroundColor: "white",
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
    textAlign: "left",
    padding: "13px 14px",
    borderBottom: "1px solid #e2e7e9",
    backgroundColor: "#f3f5f6",
    color: "#526176",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  td: {
    padding: "13px 14px",
    borderBottom: "1px solid #edf1f3",
    color: "#334155",
    fontSize: "13px",
  },

  empty: {
    textAlign: "center",
    padding: "30px",
  },

  suspendButton: {
    padding: "7px 12px",
    cursor: "pointer",
    border: "1px solid #fecaca",
    borderRadius: "7px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontWeight: 600,
  },

  activateButton: {
    padding: "7px 12px",
    cursor: "pointer",
    border: "1px solid #bbf7d0",
    borderRadius: "7px",
    backgroundColor: "#f0fdf4",
    color: "#15803d",
    fontWeight: 600,
  },

  success: {
    color: "#166534",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "11px 14px",
  },

  error: {
    color: "#991b1b",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "11px 14px",
  },

  pagination: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: "20px",
  },
  pageButton: {
    padding: "8px 13px",
    border: "1px solid #d8e0eb",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    fontWeight: 600,
  },
};

export default UserManagementPage;