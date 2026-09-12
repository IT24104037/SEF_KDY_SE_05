import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProperty } from "../services/propertyService.js";

const emptyForm = {
  name: "",
  address: "",
  city: "",
  description: "",
  latitude: "",
  longitude: "",
};

function AddPropertyPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
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
        latitude:
          form.latitude === "" ? null : Number(form.latitude),
        longitude:
          form.longitude === "" ? null : Number(form.longitude),
      };

      await createProperty(propertyData);

      navigate("/owner/properties");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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
      <h1>Add Property</h1>

      <p>
        Add a new property to your property portfolio.
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
        }}
      >
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

          <button type="submit" disabled={saving}>
            {saving ? "Adding..." : "Add Property"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/owner/properties")}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        </form>
      </section>
    </div>
  );
}

export default AddPropertyPage;