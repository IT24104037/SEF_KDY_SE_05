import { useEffect, useState } from "react";

import {
  createMaintenanceRequest,
  uploadMaintenanceImage,
  startMaintenanceWorkflow,
  getAgent2SafetyConcern,
} from "../services/maintenanceApi.js";

function ReportMaintenancePage() {
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

    if (!description.trim()) {
      setError("Please enter a description of the problem.");
      return;
    }

    if (!photo) {
      setError(
        "A photo is required for a normal maintenance request."
      );
      return;
    }

    try {
      setLoading(true);

      // Step 1: upload the selected photo.
      const imageUrl =
        await uploadMaintenanceImage(photo);

      // Step 2: create the maintenance request.
      // Property, unit and tenancy are NOT sent by the tenant.
      // Backend gets them from the active tenancy.
      const createdRequest =
  await createMaintenanceRequest({
    description: description.trim(),
    requestType: "NORMAL",
    emergencyType: null,
    imageUrl,
  });

// Start the AI workflow immediately after
// successfully creating the maintenance request.
const workflow =
  await startMaintenanceWorkflow(
    createdRequest.id
  );

console.log(
  "AI WORKFLOW RESULT:",
  workflow
);
// Show Agent 2 safety concern immediately.
const safetyConcern =
  getAgent2SafetyConcern(workflow);

if (safetyConcern) {
  const isLifeSafetyEmergency =
    workflow?.approvalStatus ===
    "EmergencyServicesRequired";

  if (isLifeSafetyEmergency) {
    window.alert(
      `🚨 CRITICAL EMERGENCY\n\n${safetyConcern}`
    );
  } else {
    window.alert(
      `⚠️ SAFETY WARNING\n\n${safetyConcern}`
    );
  }
}

setMessage(
  `Maintenance request #${createdRequest.id} submitted successfully.`
);

      setDescription("");
      setPhoto(null);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl("");

      const fileInput =
        document.getElementById("maintenance-photo");

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
          Report Maintenance
        </h1>

        <p style={styles.subtitle}>
          Describe the maintenance problem and provide a
          clear photo.
        </p>

        <div style={styles.infoBox}>
          Your property and unit will be identified
          automatically from your active tenancy.
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
              Problem Description *
            </label>

            <textarea
              style={styles.textarea}
              placeholder="Example: Water is leaking under the kitchen sink."
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
              Photo *
            </label>

            <input
              id="maintenance-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              required
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
                alt="Maintenance preview"
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
              : "Submit Maintenance Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f5f6",
    padding: "clamp(20px, 4vw, 40px)",
    color: "#1f2933",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  card: {
    maxWidth: "700px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    padding: "clamp(20px, 4vw, 34px)",
    border: "1px solid #e2e7e9",
    borderTop: "3px solid #0369a1",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(22, 34, 42, 0.045)",
  },

  title: {
    marginTop: 0,
    marginBottom: "8px",
    color: "#172033",
    fontSize: "clamp(22px, 3vw, 28px)",
    fontWeight: 700,
  },

  subtitle: {
    color: "#64748b",
    marginBottom: "20px",
    lineHeight: 1.6,
  },

  infoBox: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e40af",
    padding: "12px 14px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  field: {
    marginBottom: "22px",
  },

  label: {
    display: "block",
    fontWeight: 650,
    marginBottom: "8px",
    color: "#334155",
  },

  textarea: {
    width: "100%",
    minHeight: "140px",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    resize: "vertical",
    boxSizing: "border-box",
    color: "#1f2933",
    fontSize: "14px",
    lineHeight: 1.5,
    fontFamily: "inherit",
  },

  counter: {
    display: "block",
    textAlign: "right",
    color: "#64748b",
    marginTop: "5px",
  },

  help: {
    display: "block",
    color: "#64748b",
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
    border: "1px solid #e2e7e9",
    borderRadius: "10px",
  },

  button: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#0369a1",
    color: "#ffffff",
    fontWeight: 650,
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12)",
  },

  success: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "12px 14px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  error: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
};

export default ReportMaintenancePage;