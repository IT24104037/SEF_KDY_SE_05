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
    <div>
      <h1>Maintenance Categories</h1>

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
                      {category.isActive
                        ? "Active"
                        : "Inactive"}
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
  subtitle: {
    color: "#6b7280",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "22px",
    borderRadius: "10px",
    marginTop: "20px",
  },

  form: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  input: {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    minWidth: "220px",
  },

  saveButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#1f8a8a",
    color: "white",
    cursor: "pointer",
  },

  cancelButton: {
    padding: "10px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "white",
    cursor: "pointer",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },

  editButton: {
    marginRight: "8px",
    padding: "7px 12px",
    cursor: "pointer",
  },

  statusButton: {
    padding: "7px 12px",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "25px",
  },

  success: {
    color: "green",
  },

  error: {
    color: "red",
  },
};

export default MaintenanceCategoriesPage;