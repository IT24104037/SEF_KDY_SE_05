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

const styles = {
	page: { minHeight: "100vh", padding: "clamp(20px, 4vw, 44px)", background: "#f3f5f6", color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
	card: { maxWidth: "600px", margin: "0 auto", padding: "clamp(22px, 4vw, 34px)", background: "#fff", border: "1px solid #e2e7e9", borderTop: "3px solid #b45309", borderRadius: "12px", boxShadow: "0 10px 30px rgba(22, 34, 42, 0.05)" },
	eyebrow: { color: "#b45309", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" },
	title: { color: "#172033", fontSize: "clamp(23px, 3vw, 30px)" },
	status: { display: "inline-block", padding: "8px 12px", borderRadius: "999px", background: "#fef3c7", color: "#92400e", fontWeight: 700 },
	muted: { color: "#64748b", lineHeight: 1.6 },
	error: { padding: "12px 14px", color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" },
	link: { color: "#b45309", fontWeight: 700 },
};

export default WorkerVerificationPage;
