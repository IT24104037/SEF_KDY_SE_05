import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerWorker, uploadWorkerProof } from "../services/workerService.js";

const skillOptions = ["Plumbing", "Electrical", "HVAC", "Carpentry", "Masonry"];

function WorkerRegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    skills: [],
    serviceArea: "",
    proofDocumentName: "",
    proofDocumentUrl: "",
  });
  const [localPreview, setLocalPreview] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function toggleSkill(skill) {
    setForm((current) => ({
      ...current,
      skills: current.skills.includes(skill)
        ? current.skills.filter((item) => item !== skill)
        : [...current.skills, skill],
    }));
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreview(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);

    try {
      setUploadingDoc(true);
      const res = await uploadWorkerProof(file);
      setForm((current) => ({
        ...current,
        proofDocumentName: res.fileName || file.name,
        proofDocumentUrl: res.documentUrl,
      }));
    } catch {
      // If direct upload fails, fallback to Data URL
      reader.onloadend = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        setLocalPreview(dataUrl);
        setForm((current) => ({
          ...current,
          proofDocumentName: file.name,
          proofDocumentUrl: dataUrl,
        }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.skills.length === 0) {
      setError("Select at least one trade or skill.");
      return;
    }

    if (!form.proofDocumentName) {
      setError("Upload a proof document before submitting.");
      return;
    }

    setLoading(true);
    try {
      await registerWorker({
        fullName: form.fullName,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        skills: form.skills,
        serviceArea: form.serviceArea,
        proofDocumentName: form.proofDocumentName,
        proofDocumentUrl: form.proofDocumentUrl,
      });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <span style={styles.eyebrow}>Application submitted</span>
          <h1 style={styles.title}>Your worker profile is under review</h1>
          <p style={styles.muted}>An administrator must verify your details and proof before you can receive jobs.</p>
          <button style={styles.primaryButton} onClick={() => navigate("/login")}>Return to login</button>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <span style={styles.eyebrow}>Maintenance worker onboarding</span>
        <h1 style={styles.title}>Create your worker profile</h1>
        <p style={styles.muted}>Submit your trade details and service area for Admin verification.</p>

        <div style={styles.grid}>
          <label style={styles.field}>Full name<input name="fullName" value={form.fullName} onChange={updateField} required /></label>
          <label style={styles.field}>Email<input name="email" type="email" value={form.email} onChange={updateField} required /></label>
          <label style={styles.field}>Mobile number<input name="mobile" value={form.mobile} onChange={updateField} required /></label>
          <label style={styles.field}>Password<input name="password" type="password" value={form.password} onChange={updateField} placeholder="Min 6 characters" required /></label>
          <label style={styles.field}>Confirm password<input name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} required /></label>
          <label style={styles.field}>Service area<input name="serviceArea" value={form.serviceArea} onChange={updateField} placeholder="e.g. Colombo 05, within 15 km" required /></label>
        </div>

        <fieldset style={styles.fieldset}>
          <legend>Trades and skills</legend>
          <div style={styles.skillGrid}>
            {skillOptions.map((skill) => (
              <label key={skill} style={styles.checkboxLabel}>
                <input type="checkbox" checked={form.skills.includes(skill)} onChange={() => toggleSkill(skill)} />
                {skill}
              </label>
            ))}
          </div>
        </fieldset>

        <label style={styles.uploadField}>
          Trade license or proof document
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} required />
        </label>
        {uploadingDoc && (
          <p style={{ margin: "6px 0", color: "#0284c7", fontSize: "13px" }}>
            ⏳ Uploading proof document to server...
          </p>
        )}
        {form.proofDocumentName && (
          <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", background: "#e0f2fe", color: "#0369a1", padding: "4px 8px", borderRadius: "4px", fontWeight: 700 }}>
              {form.proofDocumentName.split(".").pop()?.toUpperCase()}
            </span>
            <span style={styles.fileName}>{form.proofDocumentName}</span>
            {form.proofDocumentUrl && !uploadingDoc && (
              <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>✓ Attached</span>
            )}
          </div>
        )}
        {localPreview && localPreview.startsWith("data:image/") && (
          <div style={{ marginTop: "10px" }}>
            <img
              src={localPreview}
              alt="Proof Document Preview"
              style={{ maxHeight: "140px", borderRadius: "6px", border: "1px solid #dde3e9" }}
            />
          </div>
        )}
        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.actions}>
          <button type="button" style={styles.secondaryButton} onClick={() => navigate("/login")}>Cancel</button>
          <button type="submit" style={styles.primaryButton} disabled={loading}>{loading ? "Submitting..." : "Submit for verification"}</button>
        </div>
      </form>
    </main>
  );
}

const styles = {
  page: { minHeight: "100vh", padding: "48px 24px", background: "#f5f7fa", color: "#25313c" },
  card: { maxWidth: "760px", margin: "0 auto", padding: "36px", background: "#fff", border: "1px solid #dde3e9", borderRadius: "8px", boxShadow: "0 16px 40px rgba(23,50,77,.08)" },
  eyebrow: { color: "#1f8a8a", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" },
  title: { margin: "10px 0 8px", color: "#17324d" },
  muted: { color: "#6b7280", lineHeight: 1.6 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px", marginTop: "26px" },
  field: { display: "grid", gap: "7px", fontWeight: 600, fontSize: "14px" },
  fieldset: { margin: "26px 0 20px", padding: "18px", border: "1px solid #dde3e9", borderRadius: "6px" },
  skillGrid: { display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "10px" },
  checkboxLabel: { display: "flex", gap: "8px", alignItems: "center", fontWeight: 400 },
  uploadField: { display: "grid", gap: "8px", fontWeight: 600, fontSize: "14px" },
  fileName: { color: "#3478f6", fontSize: "14px" },
  actions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "28px" },
  primaryButton: { padding: "12px 18px", border: 0, borderRadius: "6px", background: "#1f8a8a", color: "#fff", cursor: "pointer", fontWeight: 700 },
  secondaryButton: { padding: "12px 18px", border: "1px solid #1f8a8a", borderRadius: "6px", background: "#fff", color: "#1f8a8a", cursor: "pointer", fontWeight: 700 },
  error: { padding: "12px", color: "#d64545", background: "#fff1f1", borderRadius: "6px" },
};

export default WorkerRegistrationPage;
