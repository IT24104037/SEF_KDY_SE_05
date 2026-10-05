import { useEffect, useState } from "react";

import {
  createMaintenanceRequest,
  uploadMaintenanceImage,
  startMaintenanceWorkflow,
  getAgent2SafetyConcern,
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

// Immediately run the AI workflow so Agent 2
// can return the safety instructions.
let workflow = null;

try {
  workflow =
    await startMaintenanceWorkflow(
      createdRequest.id
    );
} catch (workflowError) {
  console.error(
    "Emergency request was created, but AI analysis could not start:",
    workflowError
  );
}

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
    borderTop: "3px solid #b91c1c",
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

  warning: {
    backgroundColor: "#fffbeb",
    border: "1px solid #fcd34d",
    color: "#92400e",
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

  input: {
    width: "100%",
    padding: "11px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    boxSizing: "border-box",
    color: "#1f2933",
    fontSize: "14px",
    fontFamily: "inherit",
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
    backgroundColor: "#b91c1c",
    color: "#ffffff",
    fontWeight: 700,
    boxShadow: "0 4px 12px rgba(153, 27, 27, 0.16)",
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

export default ReportEmergencyPage;