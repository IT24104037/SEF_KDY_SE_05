import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getUnits,
  getArchivedUnits,
  createUnit,
  updateUnit,
  archiveUnit,
  restoreUnit,
  softDeleteUnit,
  createBulkUnits,
  downloadUnitTenancyHistory,
} from "../services/unitService.js";
import { getProperty } from "../services/propertyService.js";
import tenancyService from "../../tenancies/services/tenancyService.js";

const emptyForm = {
  unitLabel: "",
  description: "",
};

function UnitsPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [archivedUnits, setArchivedUnits] = useState([]);
  const [selectedHistoryUnitId, setSelectedHistoryUnitId] = useState("");
  const [downloadingHistory, setDownloadingHistory] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [bulkCount, setBulkCount] = useState("");
  const [bulkPrefix, setBulkPrefix] = useState("");

  // Search, Filter, Sort, Pagination state
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("label");
  const [sortDirection, setSortDirection] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUnits() {
    try {
      setLoading(true);
      setError("");

      const [propertyData, unitsData, archivedUnitsData] =
        await Promise.all([
          getProperty(propertyId),
          getUnits(propertyId, {
            search: searchQuery,
            status: statusFilter,
            sortBy,
            sortDirection,
            page,
            pageSize,
          }),
          getArchivedUnits(propertyId),
        ]);

      setProperty(propertyData);
      setUnits(unitsData.items || []);
      setTotalCount(unitsData.totalCount || 0);
      setArchivedUnits(archivedUnitsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUnits();
  }, [propertyId, searchQuery, statusFilter, sortBy, sortDirection, page, pageSize]);

  function handleFilterSubmit(event) {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput);
  }

  function handleResetFilters() {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("");
    setSortBy("label");
    setSortDirection("asc");
    setPage(1);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(unit) {
    setEditingId(unit.id);

    setForm({
      unitLabel: unit.unitLabel || "",
      description: unit.description || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const unitData = {
        unitLabel: form.unitLabel,
        description: form.description || null,
      };

      if (editingId) {
        await updateUnit(propertyId, editingId, unitData);
      } else {
        await createUnit(propertyId, unitData);
      }

      resetForm();
      await loadUnits();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id) {
    const confirmed = window.confirm(
      "Are you sure you want to archive this unit?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await archiveUnit(propertyId, id);
      await loadUnits();

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRestore(id) {
    try {
      setError("");

      await restoreUnit(propertyId, id);
      await loadUnits();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently remove this archived unit from your unit lists? Its historical records will be preserved."
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await softDeleteUnit(propertyId, id);
      await loadUnits();
      setSuccess("Archived unit deleted. Its historical records have been preserved.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEndTenancy(tenancyId) {
    if (!tenancyId) return;

    const confirmed = window.confirm(
      "Are you sure you want to end this tenancy? The unit will become vacant."
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await tenancyService.endTenancy(tenancyId);
      await loadUnits();
      setSuccess("Tenancy ended successfully. Unit is now vacant.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDownloadHistory() {
    if (!selectedHistoryUnitId) return;

    const allUnitsList = [...units, ...archivedUnits];
    const targetUnit = allUnitsList.find(
      (u) => String(u.id) === String(selectedHistoryUnitId)
    );

    if (!targetUnit) return;

    try {
      setDownloadingHistory(true);
      setError("");
      setSuccess("");

      await downloadUnitTenancyHistory(
        propertyId,
        targetUnit.id,
        targetUnit.unitLabel
      );

      setSuccess(`Downloaded tenancy history for Unit ${targetUnit.unitLabel}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingHistory(false);
    }
  }

  async function handleBulkCreate(event) {
    event.preventDefault();

    const count = Number(bulkCount);

    if (!count || count < 1) {
      setError("Please enter a valid number of units.");
      return;
    }

    if (!bulkPrefix.trim()) {
      setError("Please enter a unit prefix.");
      return;
    }

    try {
      setBulkSaving(true);
      setError("");

      const bulkUnits = Array.from(
        { length: count },
        (_, index) => ({
          unitLabel: `${bulkPrefix.trim()}${index + 1}`,
          description: null,
        })
      );

      await createBulkUnits(propertyId, bulkUnits);

      setBulkCount("");
      setBulkPrefix("");

      await loadUnits();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkSaving(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "30px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <h1>Unit Management</h1>

        <button
          type="button"
          onClick={() => navigate("/owner/properties")}
        >
          Back to Properties
        </button>
      </div>

      <p>
        Manage the units belonging to property{" "}
        {property ? property.name : `#${propertyId}`}.
      </p>

      {error && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            border: "1px solid #dc2626",
            borderRadius: "6px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            border: "1px solid #16a34a",
            borderRadius: "6px",
          }}
        >
          {success}
        </div>
      )}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <h2>{editingId ? "Edit Unit" : "Add Unit"}</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label>
              Unit Label
              <br />
              <input
                type="text"
                name="unitLabel"
                value={form.unitLabel}
                onChange={handleChange}
                required
                maxLength={50}
                style={{
                  width: "100%",
                  padding: "8px",
                }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              Description
              <br />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                style={{
                  width: "100%",
                  padding: "8px",
                }}
              />
            </label>
          </div>

          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingId
              ? "Update Unit"
              : "Add Unit"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </button>
          )}
        </form>
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <h2>Bulk Create Units</h2>

        <p>
          Example: prefix "A-" and count 5 creates A-1, A-2,
          A-3, A-4 and A-5.
        </p>

        <form onSubmit={handleBulkCreate}>
          <div style={{ marginBottom: "15px" }}>
            <label>
              Unit Prefix
              <br />
              <input
                type="text"
                value={bulkPrefix}
                onChange={(event) =>
                  setBulkPrefix(event.target.value)
                }
                placeholder="A-"
                style={{
                  padding: "8px",
                }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              Number of Units
              <br />
              <input
                type="number"
                min="1"
                value={bulkCount}
                onChange={(event) =>
                  setBulkCount(event.target.value)
                }
                style={{
                  padding: "8px",
                }}
              />
            </label>
          </div>

          <button type="submit" disabled={bulkSaving}>
            {bulkSaving ? "Creating..." : "Create Units"}
          </button>
        </form>
      </section>

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <h2 style={{ margin: 0 }}>Unit List</h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <select
              value={selectedHistoryUnitId}
              onChange={(e) => setSelectedHistoryUnitId(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              <option value="">Select unit for history</option>
              {units.concat(archivedUnits).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unitLabel} {u.isArchived ? "(Archived)" : ""}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={!selectedHistoryUnitId || downloadingHistory}
              onClick={handleDownloadHistory}
              style={{
                padding: "8px 16px",
                backgroundColor: selectedHistoryUnitId
                  ? "#1F8A8A"
                  : "#9ca3af",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: selectedHistoryUnitId ? "pointer" : "not-allowed",
              }}
            >
              {downloadingHistory ? "Downloading..." : "Download History"}
            </button>
          </div>
        </div>

        {/* Search, Filter, and Sort Controls */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "24px",
            backgroundColor: "#ffffff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <form onSubmit={handleFilterSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 180px", minWidth: "150px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
                Search
              </label>
              <input
                type="text"
                placeholder="Label, description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  boxSizing: "border-box",
                  backgroundColor: "#ffffff",
                }}
              />
            </div>

            <div style={{ flex: "1 1 140px", minWidth: "130px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  boxSizing: "border-box",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="">All Statuses</option>
                <option value="Occupied">Occupied</option>
                <option value="Vacant">Vacant</option>
              </select>
            </div>

            <div style={{ flex: "1 1 130px", minWidth: "120px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  boxSizing: "border-box",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="label">Unit Label</option>
                <option value="status">Status</option>
                <option value="createdAt">Created Date</option>
              </select>
            </div>

            <div style={{ flex: "1 1 110px", minWidth: "100px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
                Order
              </label>
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  boxSizing: "border-box",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="submit"
                style={{
                  height: "38px",
                  padding: "0 16px",
                  backgroundColor: "#17324D",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  height: "38px",
                  padding: "0 16px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <p>Loading units...</p>
        ) : units.length === 0 ? (
          <p>No units found.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {units.map((unit) => (
              <div
                key={unit.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <h3>{unit.unitLabel}</h3>

                {unit.description && (
                  <p>
                    <strong>Description:</strong>{" "}
                    {unit.description}
                  </p>
                )}

                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      backgroundColor:
                        unit.occupancyStatus === "Occupied"
                          ? "#fee2e2"
                          : "#dcfce7",
                      color:
                        unit.occupancyStatus === "Occupied"
                          ? "#991b1b"
                          : "#166534",
                    }}
                  >
                    {unit.occupancyStatus === "Occupied"
                      ? "OCCUPIED"
                      : "VACANT"}
                  </span>
                </p>

                {unit.occupancyStatus === "Occupied" && unit.currentTenantName && (
                  <p>
                    <strong>Current Tenant:</strong> {unit.currentTenantName}
                  </p>
                )}

                <div style={{ marginTop: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => startEdit(unit)}
                  >
                    Edit
                  </button>

                  {unit.occupancyStatus === "Occupied" ? (
                    <button
                      type="button"
                      onClick={() => handleEndTenancy(unit.activeTenancyId)}
                      style={{
                        backgroundColor: "#dc2626",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      End Tenancy
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/owner/tenants/add?propertyId=${propertyId}&unitId=${unit.id}`
                        )
                      }
                      style={{
                        backgroundColor: "#16a34a",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Assign Tenant
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleArchive(unit.id)}
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalCount > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "20px",
              padding: "12px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
            }}
          >
            <span style={{ fontSize: "14px", color: "#4b5563" }}>
              Showing page <strong>{page}</strong> of <strong>{Math.ceil(totalCount / pageSize) || 1}</strong> ({totalCount} total units)
            </span>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: page <= 1 ? "#f3f4f6" : "#ffffff",
                  color: page <= 1 ? "#9ca3af" : "#374151",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(totalCount / pageSize)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: page >= Math.ceil(totalCount / pageSize) ? "#f3f4f6" : "#ffffff",
                  color: page >= Math.ceil(totalCount / pageSize) ? "#9ca3af" : "#374151",
                  cursor: page >= Math.ceil(totalCount / pageSize) ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      <section style={{ marginTop: "40px" }}>
        <h2>Archived Units</h2>

        {loading ? (
          <p>Loading archived units...</p>
        ) : archivedUnits.length === 0 ? (
          <p>No archived units.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {archivedUnits.map((unit) => (
              <div
                key={unit.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <h3>{unit.unitLabel}</h3>

                {unit.description && (
                  <p>
                    <strong>Description:</strong>{" "}
                    {unit.description}
                  </p>
                )}

                <p>
                  <strong>Status:</strong> Archived
                </p>

                <button
                  type="button"
                  onClick={() => handleRestore(unit.id)}
                >
                  Restore
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(unit.id)}
                  style={{ marginLeft: "10px" }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default UnitsPage;
