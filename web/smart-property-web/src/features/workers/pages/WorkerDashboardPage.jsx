import { useEffect, useState } from "react";
import { getWorkerStatus } from "../services/workerService.js";

function WorkerDashboardPage() {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkerStatus().then(setWorker).finally(() => setLoading(false));
  }, []);

  return (
    <main style={styles.page}>
      <header style={styles.header}><div><p style={styles.eyebrow}>Maintenance Worker</p><h1 style={styles.title}>Worker Dashboard</h1><p style={styles.muted}>Your jobs, availability, and verification status in one place.</p></div><a href="/worker/verification" style={styles.link}>Verification status</a></header>
      {loading ? <p>Loading dashboard...</p> : <section style={styles.grid}><article style={styles.card}><p style={styles.label}>Profile</p><h2>{worker?.fullName || "Worker profile"}</h2><p style={styles.muted}>{worker?.skills?.join(" · ") || "Skills will appear here"}</p></article><article style={styles.card}><p style={styles.label}>Availability</p><h2>Not configured</h2><p style={styles.muted}>Availability management will be connected in the next UI phase.</p></article><article style={styles.card}><p style={styles.label}>My jobs</p><h2>0 active</h2><p style={styles.muted}>Approved work orders will appear here.</p></article></section>}
    </main>
  );
}

const styles = { page: { minHeight: "100vh", padding: "42px 5vw", background: "#f5f7fa", color: "#25313c" }, header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", marginBottom: "28px" }, eyebrow: { color: "#1f8a8a", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }, title: { color: "#17324d", margin: "8px 0" }, muted: { color: "#6b7280", lineHeight: 1.5 }, link: { color: "#1f8a8a", fontWeight: 700 }, grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }, card: { background: "#fff", border: "1px solid #dde3e9", borderRadius: "8px", padding: "24px" }, label: { color: "#6b7280", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 } };
export default WorkerDashboardPage;
