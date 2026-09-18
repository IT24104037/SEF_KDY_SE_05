import { useEffect, useState } from "react";

import {
  createMaintenanceRequest,
  uploadMaintenanceImage,
} from "../services/maintenanceApi.js";

function ReportEmergencyPage() {
  const [emergencyType, setEmergencyType] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    setError("");
    setMessage("");

    if (!file) {
      setPhoto(null);
      setPreviewUrl("");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!emergencyType.trim()) {
      setError("Please select an emergency type.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the emergency.");
      return;
    }

    try {
      setLoading(true);

      let imageUrl = null;

      // Photo is optional for emergency requests.
      if (photo) {
        imageUrl = await uploadMaintenanceImage(photo);
      }

      const createdRequest =
        await createMaintenanceRequest({
          description: description.trim(),
          requestType: "EMERGENCY",
          emergencyType,
          imageUrl,
        });

      setMessage(
        `Emergency request #${createdRequest.id} submitted successfully.`
      );

      setEmergencyType("");
      setDescription("");
      setPhoto(null);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl("");

      const fileInput =
        document.getElementById("emergency-photo");

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          Report Emergency
        </h1>

        <p style={styles.subtitle}>
          Report an urgent maintenance emergency.
        </p>

        <div style={styles.warning}>
          Emergency requests are marked as Critical and
          handled with priority.
        </div>

        {message && (
          <div style={styles.success}>
            {message}
          </div>
        )}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>
              Emergency Type *
            </label>

            <select
              style={styles.input}
              value={emergencyType}
              onChange={(e) =>
                setEmergencyType(e.target.value)
              }
              required
            >
              <option value="">
                Select emergency type
              </option>

              <option value="Major Water Leak">
                Major Water Leak
              </option>

              <option value="Electrical Hazard">
                Electrical Hazard
              </option>

              <option value="Fire or Smoke">
                Fire or Smoke
              </option>

              <option value="Gas Leak">
                Gas Leak
              </option>

              <option value="Security Issue">
                Security Issue
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Description *
            </label>

            <textarea
              style={styles.textarea}
              placeholder="Describe what is happening and where the emergency is located."
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              maxLength={1000}
              required
            />

            <small style={styles.counter}>
              {description.length}/1000
            </small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Photo (Optional)
            </label>

            <input
              id="emergency-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
            />

            <small style={styles.help}>
              JPG, PNG or WEBP. Maximum 5 MB.
            </small>
          </div>

          {previewUrl && (
            <div style={styles.previewSection}>
              <p style={styles.label}>
                Photo Preview
              </p>

              <img
                src={previewUrl}
                alt="Emergency preview"
                style={styles.preview}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor:
                loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Submitting..."
              : "Submit Emergency Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f6f8",
    padding: "40px 20px",
  },

  card: {
    maxWidth: "700px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "12px",
  },

  title: {
    marginTop: 0,
    marginBottom: "8px",
  },

  subtitle: {
    color: "#6b7280",
    marginBottom: "20px",
  },

  warning: {
    backgroundColor: "#fff3cd",
    padding: "12px",
    borderRadius: "7px",
    marginBottom: "20px",
  },

  field: {
    marginBottom: "22px",
  },

  label: {
    display: "block",
    fontWeight: "600",
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    padding: "11px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: "140px",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    resize: "vertical",
    boxSizing: "border-box",
  },

  counter: {
    display: "block",
    textAlign: "right",
    color: "#6b7280",
    marginTop: "5px",
  },

  help: {
    display: "block",
    color: "#6b7280",
    marginTop: "7px",
  },

  previewSection: {
    marginBottom: "22px",
  },

  preview: {
    width: "100%",
    maxWidth: "350px",
    maxHeight: "280px",
    objectFit: "cover",
    borderRadius: "8px",
  },

  button: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "7px",
    backgroundColor: "#b42318",
    color: "#ffffff",
    fontWeight: "600",
  },

  success: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "12px",
    borderRadius: "7px",
    marginBottom: "20px",
  },

  error: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "7px",
    marginBottom: "20px",
  },
};

export default ReportEmergencyPage;