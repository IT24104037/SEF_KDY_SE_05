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

    setPage(1);
    await loadUsers();
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
    <div>
      <h1>User Management</h1>

      <p>
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
  filters: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "25px",
    marginBottom: "20px",
  },

  input: {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    minWidth: "180px",
  },

  searchButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#1f8a8a",
    color: "white",
    cursor: "pointer",
  },

  tableContainer: {
    backgroundColor: "white",
    borderRadius: "10px",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "14px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #e5e7eb",
  },

  empty: {
    textAlign: "center",
    padding: "30px",
  },

  suspendButton: {
    padding: "7px 12px",
    cursor: "pointer",
  },

  activateButton: {
    padding: "7px 12px",
    cursor: "pointer",
  },

  success: {
    color: "green",
  },

  error: {
    color: "red",
  },

  pagination: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: "20px",
  },
};

export default UserManagementPage;