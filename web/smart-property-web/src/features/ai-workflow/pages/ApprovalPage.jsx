import { useEffect, useState } from "react";
import { getApprovalRequest, submitApprovalDecision } from "../../workers/services/workerService.js";

function ApprovalPage() {
	const [request, setRequest] = useState(null);
	const [decision, setDecision] = useState("");
	const [note, setNote] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getApprovalRequest().then(setRequest).finally(() => setLoading(false));
	}, []);

	async function handleDecision(nextDecision) {
		const result = await submitApprovalDecision(nextDecision, note);
		setDecision(result.decision);
		setMessage(result.createdWorkOrder ? "Approved. A work order would now be created." : `${nextDecision} recorded for review.`);
	}

	if (loading) return <main style={styles.page}><p>Loading recommendation...</p></main>;

	return <main style={styles.page}><header style={styles.header}><div><p style={styles.eyebrow}>Owner approval</p><h1 style={styles.title}>Review technician recommendation</h1><p style={styles.muted}>The recommendation is not an assignment until you approve it.</p></div><a href="/owner/work-orders" style={styles.link}>View work orders</a></header><section style={styles.grid}><article style={styles.card}><p style={styles.label}>Maintenance request</p><h2>{request.title}</h2><p>{request.property} · Unit {request.unit}</p><p>{request.description}</p><p><strong>Priority:</strong> {request.priority}</p></article><article style={styles.card}><p style={styles.label}>Recommended worker</p><h2>{request.recommendedWorker}</h2><p><strong>Skill:</strong> {request.workerSkill}</p><p><strong>Service area:</strong> {request.serviceArea}</p><p><strong>Proposed time:</strong> {new Date(request.proposedTime).toLocaleString()}</p><span style={styles.badge}>{request.validationStatus}</span></article></section><section style={styles.card}><label style={styles.field}>Decision note<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a reason for rejection or revision" /></label><div style={styles.actions}><button style={styles.reject} onClick={() => handleDecision("Reject")}>Reject</button><button style={styles.revise} onClick={() => handleDecision("Request Revision")}>Request revision</button><button style={styles.primary} onClick={() => handleDecision("Approve")}>Approve and create work order</button></div>{message && <p style={styles.success}>{message}</p>}{decision && <p style={styles.muted}>Recorded decision: {decision}</p>}</section></main>;
}

const styles = { page: { minHeight: "100vh", padding: "42px 5vw", background: "#f5f7fa", color: "#25313c" }, header: { display: "flex", justifyContent: "space-between", gap: "20px", marginBottom: "28px" }, eyebrow: { color: "#1f8a8a", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }, title: { color: "#17324d", margin: "8px 0" }, muted: { color: "#6b7280", lineHeight: 1.5 }, link: { color: "#1f8a8a", fontWeight: 700 }, grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px", marginBottom: "18px" }, card: { background: "#fff", border: "1px solid #dde3e9", borderRadius: "8px", padding: "24px" }, label: { color: "#6b7280", textTransform: "uppercase", fontSize: "12px", fontWeight: 700, letterSpacing: "1px" }, badge: { display: "inline-block", padding: "7px 10px", borderRadius: "999px", background: "#d9f0ee", color: "#17324d", fontSize: "12px", fontWeight: 700 }, field: { display: "grid", gap: "8px", fontWeight: 700 }, actions: { display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "10px", marginTop: "20px" }, primary: { padding: "11px 16px", border: 0, borderRadius: "6px", background: "#1f8a8a", color: "#fff", cursor: "pointer", fontWeight: 700 }, reject: { padding: "11px 16px", border: 0, borderRadius: "6px", background: "#d64545", color: "#fff", cursor: "pointer", fontWeight: 700 }, revise: { padding: "11px 16px", border: "1px solid #f59e0b", borderRadius: "6px", background: "#fff", color: "#a15c00", cursor: "pointer", fontWeight: 700 }, success: { padding: "12px", color: "#16804a", background: "#e8f7ef", borderRadius: "6px" } };

export default ApprovalPage;
