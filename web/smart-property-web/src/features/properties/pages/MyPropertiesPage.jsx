import { useEffect, useState } from "react";
import {
  getMyProperties,
  createProperty,
  updateProperty,
  archiveProperty,
} from "../services/propertyService.js";

const emptyForm = {
  name: "",
  address: "",
  city: "",
  description: "",
  latitude: "",
  longitude: "",
};

function MyPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadProperties() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyProperties();
      setProperties(data);
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
  }

  function startEdit(property) {
    setEditingId(property.id);

    setForm({
      name: property.name || "",
      address: property.address || "",
      city: property.city || "",
      description: property.description || "",
      latitude: property.latitude ?? "",
      longitude: property.longitude ?? "",
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

      const propertyData = {
        name: form.name,
        address: form.address,
        city: form.city || null,
        description: form.description || null,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude:
          form.longitude === "" ? null : Number(form.longitude),
      };

      if (editingId) {
        await updateProperty(editingId, propertyData);
      } else {
        await createProperty(propertyData);
      }

      resetForm();
      await loadProperties();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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

      await archiveProperty(id);
      await loadProperties();

      if (editingId === id) {
        resetForm();
      }
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
      <h1>My Properties</h1>

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

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <h2>{editingId ? "Edit Property" : "Add Property"}</h2>

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
                style={{ width: "100%", padding: "8px" }}
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
                style={{ width: "100%", padding: "8px" }}
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
                style={{ width: "100%", padding: "8px" }}
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
                style={{ width: "100%", padding: "8px" }}
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
                style={{ width: "100%", padding: "8px" }}
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
                style={{ width: "100%", padding: "8px" }}
              />
            </label>
          </div>

          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingId
                ? "Update Property"
                : "Add Property"}
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
                  <strong>Status:</strong>{" "}
                  {property.isArchived ? "Archived" : "Active"}
                </p>

                <div style={{ marginTop: "15px" }}>
                  {!property.isArchived && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(property)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleArchive(property.id)}
                        style={{ marginLeft: "10px" }}
                      >
                        Archive
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default MyPropertiesPage;