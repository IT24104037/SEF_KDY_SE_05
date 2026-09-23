import React, { useEffect, useState } from "react";

function MaintenanceCategoriesPage() {
  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const API_URL =
    "http://localhost:5144/api/maintenance-categories";

  useEffect(() => {
    loadCategories();
  }, []);

  const getToken = () => {
    return sessionStorage.getItem("token");
  };

  // ---------------------------------------------------------
  // LOAD CATEGORIES
  // ---------------------------------------------------------

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}?includeInactive=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          text || "Could not load maintenance categories."
        );
      }

      const data = await response.json();

      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load maintenance categories."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // CREATE CATEGORY
  // ---------------------------------------------------------

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const token = getToken();

      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        let errorMessage =
          "Could not create maintenance category.";

        try {
          const data = await response.json();

          if (data?.message) {
            errorMessage = data.message;
          }
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(errorMessage);
      }

      setName("");
      setDescription("");

      setMessage(
        "Maintenance category created successfully."
      );

      await loadCategories();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to create maintenance category."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // START EDIT
  // ---------------------------------------------------------

  const handleEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name || "");
    setEditDescription(category.description || "");

    setError("");
    setMessage("");
  };

  // ---------------------------------------------------------
  // CANCEL EDIT
  // ---------------------------------------------------------

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  // ---------------------------------------------------------
  // SAVE EDIT
  // ---------------------------------------------------------

  const handleSaveEdit = async (category) => {
    if (!editName.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/${category.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: editName.trim(),
            description:
              editDescription.trim() || null,
            isActive: category.isActive,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Could not update maintenance category.";

        try {
          const data = await response.json();

          if (data?.message) {
            errorMessage = data.message;
          }
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(errorMessage);
      }

      setEditingId(null);
      setEditName("");
      setEditDescription("");

      setMessage(
        "Maintenance category updated successfully."
      );

      await loadCategories();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to update maintenance category."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // ENABLE / DISABLE CATEGORY
  // ---------------------------------------------------------

  const handleToggleStatus = async (category) => {
    const newStatus = !category.isActive;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/${category.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: category.name,
            description: category.description || null,
            isActive: newStatus,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Could not update category status.";

        try {
          const data = await response.json();

          if (data?.message) {
            errorMessage = data.message;
          }
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(errorMessage);
      }

      setMessage(
        newStatus
          ? "Maintenance category enabled successfully."
          : "Maintenance category disabled successfully."
      );

      await loadCategories();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to update category status."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div>
      <h1>Maintenance Categories</h1>

      <p>
        Create and manage maintenance categories used by
        the maintenance system.
      </p>

      {message && (
        <div style={styles.successMessage}>
          {message}
        </div>
      )}

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* CREATE CATEGORY */}

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          Create Maintenance Category
        </h2>

        <form onSubmit={handleCreate}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Category Name
            </label>

            <input
              type="text"
              value={name}
              maxLength={100}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Example: Plumbing"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Description
            </label>

            <textarea
              value={description}
              maxLength={500}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Example: Plumbing and water-related maintenance issues"
              rows={4}
              style={styles.textarea}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.createButton,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving
              ? "Saving..."
              : "Create Category"}
          </button>
        </form>
      </div>

      {/* CATEGORY LIST */}

      <div style={styles.card}>
        <div style={styles.listHeader}>
          <h2 style={styles.cardTitle}>
            Existing Categories
          </h2>

          <button
            onClick={loadCategories}
            style={styles.refreshButton}
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p>Loading maintenance categories...</p>
        )}

        {!loading &&
          categories.length === 0 && (
            <p>
              No maintenance categories found.
            </p>
          )}

        {!loading &&
          categories.length > 0 && (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      ID
                    </th>

                    <th style={styles.th}>
                      Name
                    </th>

                    <th style={styles.th}>
                      Description
                    </th>

                    <th style={styles.th}>
                      Status
                    </th>

                    <th style={styles.th}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map(
                    (category) => {
                      const isEditing =
                        editingId === category.id;

                      return (
                        <tr key={category.id}>
                          <td style={styles.td}>
                            #{category.id}
                          </td>

                          <td style={styles.td}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editName}
                                maxLength={100}
                                onChange={(e) =>
                                  setEditName(
                                    e.target.value
                                  )
                                }
                                style={styles.editInput}
                              />
                            ) : (
                              category.name
                            )}
                          </td>

                          <td style={styles.td}>
                            {isEditing ? (
                              <textarea
                                value={
                                  editDescription
                                }
                                maxLength={500}
                                onChange={(e) =>
                                  setEditDescription(
                                    e.target.value
                                  )
                                }
                                rows={3}
                                style={
                                  styles.editTextarea
                                }
                              />
                            ) : (
                              category.description ||
                              "-"
                            )}
                          </td>

                          <td style={styles.td}>
                            <span
                              style={
                                category.isActive
                                  ? styles.activeBadge
                                  : styles.inactiveBadge
                              }
                            >
                              {category.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td style={styles.td}>
                            {isEditing ? (
                              <div
                                style={
                                  styles.actionButtons
                                }
                              >
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    handleSaveEdit(
                                      category
                                    )
                                  }
                                  style={
                                    styles.saveButton
                                  }
                                >
                                  Save
                                </button>

                                <button
                                  type="button"
                                  onClick={
                                    handleCancelEdit
                                  }
                                  style={
                                    styles.cancelButton
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div
                                style={
                                  styles.actionButtons
                                }
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEdit(
                                      category
                                    )
                                  }
                                  style={
                                    styles.editButton
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    handleToggleStatus(
                                      category
                                    )
                                  }
                                  style={
                                    category.isActive
                                      ? styles.disableButton
                                      : styles.enableButton
                                  }
                                >
                                  {category.isActive
                                    ? "Disable"
                                    : "Enable"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#FFFFFF",
    border: "1px solid #DDE3E9",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "22px",
  },

  cardTitle: {
    color: "#17324D",
    marginTop: 0,
  },

  formGroup: {
    marginBottom: "16px",
  },

  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: "600",
    color: "#25313C",
  },

  input: {
    width: "100%",
    maxWidth: "600px",
    padding: "10px",
    border: "1px solid #DDE3E9",
    borderRadius: "6px",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    maxWidth: "600px",
    padding: "10px",
    border: "1px solid #DDE3E9",
    borderRadius: "6px",
    resize: "vertical",
    boxSizing: "border-box",
  },

  createButton: {
    background: "#1F8A8A",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: "600",
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  refreshButton: {
    background: "#17324D",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    padding: "8px 14px",
    cursor: "pointer",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    background: "#F5F7FA",
    borderBottom: "1px solid #DDE3E9",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #DDE3E9",
    verticalAlign: "top",
  },

  activeBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "12px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: "600",
  },

  inactiveBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "12px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: "600",
  },

  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  editButton: {
    background: "#3478F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    padding: "7px 12px",
    cursor: "pointer",
  },

  saveButton: {
    background: "#22A06B",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    padding: "7px 12px",
    cursor: "pointer",
  },

  cancelButton: {
    background: "#6B7280",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    padding: "7px 12px",
    cursor: "pointer",
  },

  disableButton: {
    background: "#D64545",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    padding: "7px 12px",
    cursor: "pointer",
  },

  enableButton: {
    background: "#22A06B",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    padding: "7px 12px",
    cursor: "pointer",
  },

  editInput: {
    width: "100%",
    padding: "8px",
    border: "1px solid #DDE3E9",
    borderRadius: "6px",
    boxSizing: "border-box",
  },

  editTextarea: {
    width: "100%",
    padding: "8px",
    border: "1px solid #DDE3E9",
    borderRadius: "6px",
    resize: "vertical",
    boxSizing: "border-box",
  },

  successMessage: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "16px",
  },

  errorMessage: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "16px",
  },
};

export default MaintenanceCategoriesPage;