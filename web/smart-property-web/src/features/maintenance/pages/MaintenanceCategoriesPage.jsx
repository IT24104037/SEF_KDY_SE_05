import { useEffect, useState } from "react";

import {
  getMaintenanceCategories,
  createMaintenanceCategory,
  updateMaintenanceCategory,
} from "../services/maintenanceCategoryApi.js";

function MaintenanceCategoriesPage() {
  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const result =
        await getMaintenanceCategories(true);

      setCategories(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function clearForm() {
    setName("");
    setDescription("");
    setEditingId(null);
  }

  function handleEdit(category) {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description || "");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      if (editingId) {
        const currentCategory =
          categories.find(
            (item) => item.id === editingId
          );

        await updateMaintenanceCategory(
          editingId,
          {
            name,
            description,
            isActive:
              currentCategory?.isActive ?? true,
          }
        );

        setMessage(
          "Maintenance category updated successfully."
        );
      } else {
        await createMaintenanceCategory({
          name,
          description,
        });

        setMessage(
          "Maintenance category created successfully."
        );
      }

      clearForm();
      await loadCategories();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(category) {
    try {
      setError("");
      setMessage("");

      await updateMaintenanceCategory(
        category.id,
        {
          name: category.name,
          description: category.description,
          isActive: !category.isActive,
        }
      );

      setMessage(
        category.isActive
          ? "Category deactivated successfully."
          : "Category activated successfully."
      );

      await loadCategories();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ ...styles.page, "--role-accent": sessionStorage.getItem("role") === "Admin" ? "#5145cd" : "#0f766e" }}>
      <h1 style={styles.title}>Maintenance Categories</h1>

      <p style={styles.subtitle}>
        Create and manage maintenance categories used by
        the system.
      </p>

      {message && (
        <p style={styles.success}>{message}</p>
      )}

      {error && (
        <p style={styles.error}>{error}</p>
      )}

      <div style={styles.card}>
        <h2>
          {editingId
            ? "Edit Category"
            : "Add Category"}
        </h2>

        <form
          style={styles.form}
          onSubmit={handleSubmit}
        >
          <input
            style={styles.input}
            type="text"
            placeholder="Category name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />

          <input
            style={styles.input}
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />

          <button style={styles.saveButton}>
            {editingId
              ? "Update Category"
              : "Add Category"}
          </button>

          {editingId && (
            <button
              style={styles.cancelButton}
              type="button"
              onClick={clearForm}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div style={styles.card}>
        <h2>Category List</h2>

        {loading ? (
          <p>Loading categories...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>
                  Description
                </th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={styles.empty}
                  >
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id}>
                    <td style={styles.td}>
                      {category.name}
                    </td>

                    <td style={styles.td}>
                      {category.description || "-"}
                    </td>

                    <td style={styles.td}>
                      <span style={category.isActive ? styles.activeBadge : styles.inactiveBadge}>
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <button
                        style={styles.editButton}
                        onClick={() =>
                          handleEdit(category)
                        }
                      >
                        Edit
                      </button>

                      <button
                        style={styles.statusButton}
                        onClick={() =>
                          handleStatusChange(
                            category
                          )
                        }
                      >
                        {category.isActive
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  title: { margin: "0 0 6px", color: "#172033", fontSize: "clamp(23px, 3vw, 30px)", fontWeight: 750 },
  subtitle: {
    color: "#64748b",
    margin: "0 0 20px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "clamp(18px, 3vw, 26px)",
    border: "1px solid #e2e7e9",
    borderRadius: "12px",
    marginTop: "20px",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.04)",
  },

  form: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  input: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    minWidth: "220px",
    color: "#1f2933",
    background: "#ffffff",
    fontFamily: "inherit",
  },

  saveButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "var(--role-accent, #0f766e)",
    color: "white",
    cursor: "pointer",
  },

  cancelButton: {
    padding: "10px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "white",
    cursor: "pointer",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "13px 14px",
    borderBottom: "1px solid #e2e7e9",
    background: "#f3f5f6",
    color: "#526176",
    fontSize: 12,
    fontWeight: 700,
  },

  td: {
    padding: "13px 14px",
    borderBottom: "1px solid #edf1f3",
    color: "#334155",
    fontSize: 13,
  },

  editButton: {
    marginRight: "8px",
    padding: "7px 12px",
    border: "1px solid #d8e0eb",
    borderRadius: 8,
    background: "#ffffff",
    color: "var(--role-accent, #0f766e)",
    fontWeight: 600,
    cursor: "pointer",
  },

  statusButton: {
    padding: "7px 12px",
    border: "1px solid #d8e0eb",
    borderRadius: 8,
    background: "#ffffff",
    color: "var(--role-accent, #0f766e)",
    fontWeight: 600,
    cursor: "pointer",
  },

  activeBadge: { display: "inline-block", padding: "5px 10px", borderRadius: 999, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700 },
  inactiveBadge: { display: "inline-block", padding: "5px 10px", borderRadius: 999, background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 700 },

  empty: {
    textAlign: "center",
    padding: "25px",
  },

  success: {
    color: "#166534",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 8,
    padding: "10px 12px",
  },

  error: {
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "10px 12px",
  },
};

export default MaintenanceCategoriesPage;