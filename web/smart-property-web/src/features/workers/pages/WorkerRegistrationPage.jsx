import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerWorker } from "../services/workerService.js";

const skillOptions = [
  "Plumbing",
  "Electrical",
  "Structural / Building",
  "Doors / Windows / Locks",
  "Drainage / Water Damage",
  "Other",
];

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

    const docUrl = form.proofDocumentUrl?.trim();
    if (!docUrl) {
      setError("Please provide a link to your trade license or certificate (e.g. Google Drive link).");
      return;
    }

    if (!docUrl.startsWith("http://") && !docUrl.startsWith("https://")) {
      setError("Document link must be a valid web URL starting with https:// (e.g. Google Drive or OneDrive link).");
      return;
    }

    setLoading(true);
    try {
      await registerWorker({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
        skills: form.skills,
        serviceArea: form.serviceArea.trim(),
        proofDocumentName: form.proofDocumentName?.trim() || "Trade Proof Document",
        proofDocumentUrl: docUrl,
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
          <label style={styles.field}>Full name<input style={styles.input} name="fullName" value={form.fullName} onChange={updateField} required /></label>
          <label style={styles.field}>Email<input style={styles.input} name="email" type="email" value={form.email} onChange={updateField} required /></label>
          <label style={styles.field}>Mobile number<input style={styles.input} name="mobile" value={form.mobile} onChange={updateField} required /></label>
          <label style={styles.field}>Password<input style={styles.input} name="password" type="password" value={form.password} onChange={updateField} placeholder="Min 6 characters" required /></label>
          <label style={styles.field}>Confirm password<input style={styles.input} name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} required /></label>
          <label style={styles.field}>Service area<input style={styles.input} name="serviceArea" value={form.serviceArea} onChange={updateField} placeholder="e.g. Colombo" required /></label>
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

        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>
            Trade License or Proof Document (Google Drive / Cloud Link)
          </legend>
          <div style={{ display: "grid", gap: "14px", marginTop: "8px" }}>
            <label style={styles.field}>
              Document title / certificate name
              <input
                style={styles.input}
                name="proofDocumentName"
                value={form.proofDocumentName}
                onChange={updateField}
                placeholder="e.g. NVQ Level 4 Plumbing Certificate / Electrical License"
              />
            </label>

            <label style={styles.field}>
              Public document link (Google Drive, OneDrive, Dropbox, etc.) *
              <input
                style={styles.input}
                type="url"
                name="proofDocumentUrl"
                value={form.proofDocumentUrl}
                onChange={updateField}
                placeholder="https://drive.google.com/file/d/... or any cloud document link"
                required
              />
            </label>

            <div style={styles.infoBox}>
              💡 <strong>Google Drive Tip:</strong> Upload your certificate to Google Drive, right-click the file, click <strong>Share</strong>, set General Access to <strong>"Anyone with the link can view"</strong>, copy the link, and paste it above so the Admin can inspect it.
            </div>

            {form.proofDocumentUrl && (form.proofDocumentUrl.startsWith("http://") || form.proofDocumentUrl.startsWith("https://")) && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <a
                  href={form.proofDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.documentLink}
                >
                  🔗 Test link in new tab before submitting
                </a>
              </div>
            )}
          </div>
        </fieldset>

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
  page: { minHeight: "100vh", padding: "clamp(20px, 4vw, 40px)", background: "#f3f5f6", color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  card: { maxWidth: "800px", margin: "0 auto", padding: "clamp(22px, 4vw, 34px)", background: "#fff", border: "1px solid #e2e7e9", borderTop: "3px solid #b45309", borderRadius: "12px", boxShadow: "0 12px 32px rgba(22, 34, 42, 0.06)" },
  eyebrow: { color: "#b45309", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" },
  title: { margin: "10px 0 8px", color: "#172033", fontSize: "clamp(23px, 3vw, 30px)", fontWeight: 750 },
  muted: { color: "#64748b", lineHeight: 1.6 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px", marginTop: "26px" },
  field: { display: "grid", gap: "7px", fontWeight: 600, fontSize: "14px" },
  input: { padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", width: "100%", boxSizing: "border-box", color: "#1f2933", fontFamily: "inherit" },
  fieldset: { margin: "26px 0 20px", padding: "18px", border: "1px solid #e2e7e9", borderRadius: "10px" },
  skillGrid: { display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "10px" },
  checkboxLabel: { display: "flex", gap: "8px", alignItems: "center", fontWeight: 400 },
  uploadField: { display: "grid", gap: "8px", fontWeight: 600, fontSize: "14px" },
  fileName: { color: "#3478f6", fontSize: "14px" },
  actions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "28px" },
  primaryButton: { padding: "12px 18px", border: 0, borderRadius: "8px", background: "#b45309", color: "#fff", cursor: "pointer", fontWeight: 700 },
  secondaryButton: { padding: "12px 18px", border: "1px solid #d8e0eb", borderRadius: "8px", background: "#fff", color: "#334155", cursor: "pointer", fontWeight: 700 },
  error: { padding: "12px 14px", color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" },
  legend: { fontWeight: 700, color: "#172033", padding: "0 6px" },
  infoBox: { background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#92400e", lineHeight: 1.5 },
  documentLink: { color: "#b45309", fontSize: "13px", fontWeight: 700, textDecoration: "underline" },
};

export default WorkerRegistrationPage;
