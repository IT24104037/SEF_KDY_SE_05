import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyProperties,
  updateProperty,
  resubmitProperty,
  archiveProperty,
  getArchivedProperties,
  restoreProperty,
} from "../services/propertyService.js";

const emptyForm = {
  name: "",
  address: "",
  city: "",
  description: "",
  latitude: "",
  longitude: "",
};

const emptyNewDocEntry = { documentType: "", documentUrl: "" };

function MyPropertiesPage() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [archivedProperties, setArchivedProperties] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  // Verification document state for Edit & Resubmit
  const [existingDocuments, setExistingDocuments] = useState([]);   // loaded from backend
  const [removedDocumentIds, setRemovedDocumentIds] = useState([]); // IDs the owner clicked Remove on
  const [newDocuments, setNewDocuments] = useState([]);             // brand-new docs added in the form
  const [newDocEntry, setNewDocEntry] = useState(emptyNewDocEntry); // current "add" inputs
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProperties() {
    try {
      setLoading(true);
      setError("");

      const [activeData, archivedData] = await Promise.all([
        getMyProperties(),
        getArchivedProperties(),
      ]);

      setProperties(activeData);
      setArchivedProperties(archivedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

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
    setEditingStatus(null);
    setExistingDocuments([]);
    setRemovedDocumentIds([]);
    setNewDocuments([]);
    setNewDocEntry(emptyNewDocEntry);
  }

  function startEdit(property) {
    setEditingId(property.id);
    setEditingStatus(property.verificationStatus);

    setForm({
      name: property.name || "",
      address: property.address || "",
      city: property.city || "",
      description: property.description || "",
      latitude: property.latitude ?? "",
      longitude: property.longitude ?? "",
    });

    // Load existing verification documents so the owner can manage them.
    setExistingDocuments(property.documents ?? []);
    setRemovedDocumentIds([]);
    setNewDocuments([]);
    setNewDocEntry(emptyNewDocEntry);

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
      setSuccess("");

      const isResubmission = editingStatus === "Rejected";

      const propertyData = {
        name: form.name,
        address: form.address,
        city: form.city || null,
        description: form.description || null,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude:
          form.longitude === "" ? null : Number(form.longitude),
      };

      if (isResubmission) {
        propertyData.removedDocumentIds = removedDocumentIds;
        propertyData.newDocuments = newDocuments;
      }

      if (isResubmission) {
        await resubmitProperty(editingId, propertyData);
      } else {
        await updateProperty(editingId, propertyData);
      }

      resetForm();
      await loadProperties();
      setSuccess(
        isResubmission
          ? "Property resubmitted for review."
          : "Property updated successfully."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Document management helpers ─────────────────────────────────────

  function handleRemoveExistingDoc(docId) {
    setRemovedDocumentIds((prev) => [...prev, docId]);
  }

  function handleUndoRemoveExistingDoc(docId) {
    setRemovedDocumentIds((prev) => prev.filter((id) => id !== docId));
  }

  function handleNewDocEntryChange(event) {
    const { name, value } = event.target;
    setNewDocEntry((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddNewDoc() {
    const type = newDocEntry.documentType.trim();
    const url = newDocEntry.documentUrl.trim();
    if (!type || !url) return;
    setNewDocuments((prev) => [...prev, { documentType: type, documentUrl: url }]);
    setNewDocEntry(emptyNewDocEntry);
  }

  function handleRemoveNewDoc(index) {
    setNewDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleArchive(id) {
    const confirmed = window.confirm(
      "Are you sure you want to archive this property?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await archiveProperty(id);
      await loadProperties();

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
      setSuccess("");

      await restoreProperty(id);
      await loadProperties();
    } catch (err) {
      setError(err.message);
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
        <h1>My Properties</h1>

        <button
          type="button"
          onClick={() => navigate("/owner/properties/add")}
        >
          + Add Property
        </button>
      </div>

      <p>
        Manage your properties and keep their information up to date.
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

      {editingId && (
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2>
            {editingStatus === "Rejected"
              ? "Edit and Resubmit Property"
              : "Edit Property"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label>
                Property Name
                <br />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  maxLength={150}
                  style={{
                    width: "100%",
                    padding: "8px",
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label>
                Address
                <br />
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label>
                City
                <br />
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
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

            <div
              style={{
                display: "flex",
                gap: "15px",
                marginBottom: "15px",
              }}
            >
              <label style={{ flex: 1 }}>
                Latitude
                <br />
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "8px",
                  }}
                />
              </label>

              <label style={{ flex: 1 }}>
                Longitude
                <br />
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "8px",
                  }}
                />
              </label>
            </div>

            {editingStatus === "Rejected" && (
              <>
                <hr style={{ margin: "20px 0" }} />
                <h3 style={{ marginBottom: "12px" }}>Verification Documents</h3>

                {/* ── Existing documents ── */}
                {existingDocuments.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    {existingDocuments.map((doc) => {
                      const isRemoved = removedDocumentIds.includes(doc.id);
                      return (
                        <div
                          key={doc.id}
                          style={{
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            padding: "10px 14px",
                            marginBottom: "8px",
                            background: isRemoved ? "#fef2f2" : "#f9fafb",
                            opacity: isRemoved ? 0.7 : 1,
                          }}
                        >
                          <p style={{ margin: "0 0 2px" }}>
                            <strong>Type:</strong> {doc.documentType}
                          </p>
                          <p style={{ margin: "0 0 8px", wordBreak: "break-all" }}>
                            <strong>URL:</strong>{" "}
                            <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                              {doc.documentUrl}
                            </a>
                          </p>
                          {isRemoved ? (
                            <button
                              type="button"
                              onClick={() => handleUndoRemoveExistingDoc(doc.id)}
                              style={{ fontSize: "13px" }}
                            >
                              Undo Remove
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingDoc(doc.id)}
                              style={{ fontSize: "13px", color: "#b91c1c" }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {existingDocuments.length === 0 && (
                  <p style={{ color: "#6b7280", marginBottom: "12px" }}>
                    No existing verification documents.
                  </p>
                )}

                {/* ── Pending new documents ── */}
                {newDocuments.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <p style={{ fontWeight: 600, marginBottom: "6px" }}>Documents to add:</p>
                    {newDocuments.map((doc, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: "1px solid #bbf7d0",
                          borderRadius: "6px",
                          padding: "10px 14px",
                          marginBottom: "6px",
                          background: "#f0fdf4",
                        }}
                      >
                        <p style={{ margin: "0 0 2px" }}>
                          <strong>Type:</strong> {doc.documentType}
                        </p>
                        <p style={{ margin: "0 0 8px", wordBreak: "break-all" }}>
                          <strong>URL:</strong> {doc.documentUrl}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewDoc(idx)}
                          style={{ fontSize: "13px", color: "#b91c1c" }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Add a new document ── */}
                <div
                  style={{
                    border: "1px dashed #94a3b8",
                    borderRadius: "6px",
                    padding: "14px",
                    marginBottom: "16px",
                    background: "#f8fafc",
                  }}
                >
                  <p style={{ fontWeight: 600, marginBottom: "10px" }}>Add Verification Document</p>
                  <div style={{ marginBottom: "10px" }}>
                    <label>
                      Document Type
                      <br />
                      <input
                        type="text"
                        name="documentType"
                        value={newDocEntry.documentType}
                        onChange={handleNewDocEntryChange}
                        maxLength={100}
                        style={{ width: "100%", padding: "8px" }}
                      />
                    </label>
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <label>
                      Document URL
                      <br />
                      <input
                        type="url"
                        name="documentUrl"
                        value={newDocEntry.documentUrl}
                        onChange={handleNewDocEntryChange}
                        style={{ width: "100%", padding: "8px" }}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNewDoc}
                    disabled={!newDocEntry.documentType.trim() || !newDocEntry.documentUrl.trim()}
                  >
                    Add Document
                  </button>
                </div>
              </>
            )}

            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingStatus === "Rejected"
                  ? "Resubmit for Review"
                  : "Update Property"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      {/* Active Properties */}
      <section>
        <h2>Property List</h2>

        {loading ? (
          <p>Loading properties...</p>
        ) : properties.length === 0 ? (
          <p>No properties found.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {properties.map((property) => (
              <div
                key={property.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <h3>{property.name}</h3>

                <p>
                  <strong>Address:</strong> {property.address}
                </p>

                {property.city && (
                  <p>
                    <strong>City:</strong> {property.city}
                  </p>
                )}

                {property.description && (
                  <p>
                    <strong>Description:</strong>{" "}
                    {property.description}
                  </p>
                )}

                <p>
                  <strong>Status:</strong> {formatVerificationStatus(property.verificationStatus)}
                </p>
                {property.verificationStatus === "Rejected" && (
                  <p>
                    <strong>Rejection reason:</strong> {property.rejectionReason}
                  </p>
                )}

                <div style={{ marginTop: "15px" }}>
                  {property.verificationStatus === "Rejected" && (
                    <button
                      type="button"
                      onClick={() => startEdit(property)}
                    >
                      Edit / Resubmit
                    </button>
                  )}

                  {property.verificationStatus === "Approved" && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/owner/properties/${property.id}/units`
                        )
                      }
                    >
                      Manage Units
                    </button>
                  )}

                  {property.verificationStatus === "Approved" && (
                    <button
                      type="button"
                      onClick={() => startEdit(property)}
                      style={{ marginLeft: "10px" }}
                    >
                      Edit
                    </button>
                  )}

                  {property.verificationStatus === "Approved" && (
                    <button
                      type="button"
                      onClick={() => handleArchive(property.id)}
                      style={{ marginLeft: "10px" }}
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Archived Properties */}
      <section style={{ marginTop: "40px" }}>
        <h2>Archived Properties</h2>

        {loading ? (
          <p>Loading archived properties...</p>
        ) : archivedProperties.length === 0 ? (
          <p>No archived properties.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {archivedProperties.map((property) => (
              <div
                key={property.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <h3>{property.name}</h3>

                <p>
                  <strong>Address:</strong> {property.address}
                </p>

                {property.city && (
                  <p>
                    <strong>City:</strong> {property.city}
                  </p>
                )}

                {property.description && (
                  <p>
                    <strong>Description:</strong>{" "}
                    {property.description}
                  </p>
                )}

                <p>
                  <strong>Status:</strong> Archived
                </p>

                <button
                  type="button"
                  onClick={() => handleRestore(property.id)}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default MyPropertiesPage;

function formatVerificationStatus(status) {
  return status === "UnderReview" ? "Under Review" : status;
}