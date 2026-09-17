import { useEffect, useState } from "react";
import { getWorkerStatus } from "../services/workerService.js";

function WorkerVerificationPage() {
	const [worker, setWorker] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getWorkerStatus().then(setWorker).finally(() => setLoading(false));
	}, []);

	if (loading) return <main style={styles.page}><p>Loading verification status...</p></main>;

	return (
		<main style={styles.page}>
			<section style={styles.card}>
				<p style={styles.eyebrow}>Worker account</p>
				<h1 style={styles.title}>Verification status</h1>
				<div style={styles.status}>{worker?.verificationStatus || "PendingVerification"}</div>
				<p style={styles.muted}>{worker?.verificationStatus === "Verified" ? "Your profile is verified and can be considered for official work orders." : "Your details and proof document are waiting for Admin review."}</p>
				{worker?.rejectionReason && <p style={styles.error}>Review note: {worker.rejectionReason}</p>}
				<a href="/worker" style={styles.link}>Go to Worker Dashboard</a>
			</section>
		</main>
	);
}

const styles = { page: { minHeight: "100vh", padding: "48px 24px", background: "#f5f7fa", color: "#25313c" }, card: { maxWidth: "560px", margin: "0 auto", padding: "36px", background: "#fff", border: "1px solid #dde3e9", borderRadius: "8px" }, eyebrow: { color: "#1f8a8a", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }, title: { color: "#17324d" }, status: { display: "inline-block", padding: "8px 12px", borderRadius: "999px", background: "#fff7e6", color: "#b56b00", fontWeight: 700 }, muted: { color: "#6b7280", lineHeight: 1.6 }, error: { padding: "12px", color: "#b42318", background: "#fff1f1", borderRadius: "6px" }, link: { color: "#1f8a8a", fontWeight: 700 } };

export default WorkerVerificationPage;
