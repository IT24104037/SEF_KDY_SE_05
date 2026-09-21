import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getOwnerVerificationStatus,
  reapplyOwnerVerification,
} from "../services/ownerVerificationApi.js";
import { getFullName, logout } from "../../../utils/auth.js";

const emptyForm = {
  fullName: "",
  email: "",
  mobile: "",
  propertyName: "",
  propertyAddress: "",
  city: "",
  propertyDescription: "",
  latitude: "",
  longitude: "",
  documentType: "",
  documentUrl: "",
};

function OwnerVerificationPage() {
  const navigate = useNavigate();
  const [verification, setVerification] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    getOwnerVerificationStatus({ signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setVerification(data);
        if (data.status === "Verified") {
          navigate("/owner/dashboard", { replace: true });
          return;
        }
        setFormData({
          fullName: data.fullName || "",
          email: data.email || "",
          mobile: data.mobile || "",
          propertyName: data.property?.name || "",
          propertyAddress: data.property?.address || "",
          city: data.property?.city || "",
          propertyDescription: data.property?.description || "",
          latitude: data.property?.latitude ?? "",
          longitude: data.property?.longitude ?? "",
          documentType: data.document?.documentType || "",
          documentUrl: data.document?.documentUrl || "",
        });
      })
      .catch((err) => {
        if (active && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleReapply(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await reapplyOwnerVerification({
        ...formData,
        latitude: formData.latitude === "" ? null : Number(formData.latitude),
        longitude: formData.longitude === "" ? null : Number(formData.longitude),
      });
      setVerification((current) => ({
        ...current,
        status: result.status,
        rejectionReason: null,
      }));
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (loading) {
    return <div style={styles.page}><div style={styles.card}><p>Loading verification status...</p></div></div>;
  }

  if (error && !verification) {
    return <div style={styles.page}><div style={styles.card}><p style={styles.error}>{error}</p><button onClick={handleLogout}>Logout</button></div></div>;
  }

  const rejected = verification?.status === "Rejected";
  const pending = verification?.status === "PendingVerification";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome {verification?.fullName || getFullName()}</h1>
        <h2 style={styles.subtitle}>Owner registration status</h2>

        {pending && <p>Your account is still under admin review. Your registration will be processed after administrator verification.</p>}
        {rejected && !editing && (
          <>
            <p>Your account registration was rejected.</p>
            <p><strong>Reason:</strong> {verification.rejectionReason}</p>
            <button style={styles.button} onClick={() => setEditing(true)}>Edit and Reapply</button>
          </>
        )}

        {editing && (
          <form onSubmit={handleReapply} style={styles.form}>
            <h2>Update registration</h2>
            <label>Full Name<input name="fullName" value={formData.fullName} onChange={handleChange} required /></label>
            <label>Email<input name="email" type="email" value={formData.email} onChange={handleChange} /></label>
            <label>Mobile<input name="mobile" value={formData.mobile} onChange={handleChange} /></label>
            <label>Property Name<input name="propertyName" value={formData.propertyName} onChange={handleChange} required /></label>
            <label>Property Address<input name="propertyAddress" value={formData.propertyAddress} onChange={handleChange} required /></label>
            <label>City<input name="city" value={formData.city} onChange={handleChange} /></label>
            <label>Description<textarea name="propertyDescription" value={formData.propertyDescription} onChange={handleChange} /></label>
            <label>Document Type<input name="documentType" value={formData.documentType} onChange={handleChange} required /></label>
            <label>Document URL<input name="documentUrl" type="url" value={formData.documentUrl} onChange={handleChange} required /></label>
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.button} disabled={saving}>{saving ? "Resubmitting..." : "Resubmit for Review"}</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </form>
        )}

        <button style={styles.logout} onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#F5F7FA", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "60px 20px" },
  card: { width: "500px", maxWidth: "100%", backgroundColor: "#FFFFFF", padding: "32px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" },
  title: { marginTop: 0, color: "#17324D" },
  subtitle: { color: "#6B7280", marginBottom: "25px" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  button: { marginTop: "12px", padding: "11px", border: "none", borderRadius: "6px", backgroundColor: "#1F8A8A", color: "#fff" },
  logout: { marginTop: "24px", padding: "10px 16px" },
  error: { color: "#D64545" },
};

export default OwnerVerificationPage;