import { useEffect, useState } from "react";
import { getWorkers, updateWorkerVerification } from "../services/workerService.js";

function WorkersPage() {
	const [workers, setWorkers] = useState([]);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("PendingVerification");
	const [selectedWorker, setSelectedWorker] = useState(null);
	const [rejectionReason, setRejectionReason] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	async function loadWorkers() {
		setLoading(true);
		setError("");
		try {
			const result = await getWorkers({ search, status });
			setWorkers(result.workers);
		} catch (loadError) {
			setError(loadError.message);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		let active = true;

		getWorkers({ status })
			.then((result) => {
				if (active) setWorkers(result.workers);
			})
			.catch((loadError) => {
				if (active) setError(loadError.message);
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [status]);

	async function handleSearch(event) {
		event.preventDefault();
		await loadWorkers();
	}

	async function handleDecision(decision) {
		try {
			setError("");
			await updateWorkerVerification(selectedWorker.id, decision, rejectionReason);
			setMessage(`Worker ${decision === "Verified" ? "approved" : "rejected"} successfully.`);
			setSelectedWorker(null);
			setRejectionReason("");
			await loadWorkers();
		} catch (decisionError) {
			setError(decisionError.message);
		}
	}

	return (
		<div>
			<div style={styles.header}>
				<div><p style={styles.eyebrow}>Admin workspace</p><h1 style={styles.title}>Worker verification</h1><p style={styles.muted}>Review trade proof before workers can receive official jobs.</p></div>
				<a href="/register-worker" style={styles.link}>Open registration preview</a>
			</div>

			<form style={styles.filters} onSubmit={handleSearch}>
				<input style={styles.input} placeholder="Search name, email or mobile" value={search} onChange={(event) => setSearch(event.target.value)} />
				<select style={styles.input} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="PendingVerification">Pending verification</option><option value="Verified">Verified</option><option value="Rejected">Rejected</option></select>
				<button style={styles.primaryButton}>Search</button>
			</form>

			{message && <p style={styles.success}>{message}</p>}
			{error && <p style={styles.error}>{error}</p>}
			{loading ? <p>Loading worker applications...</p> : workers.length === 0 ? <p style={styles.empty}>No worker applications match these filters.</p> : (
				<div style={styles.tableWrap}><table style={styles.table}><thead><tr><th>Name</th><th>Skills</th><th>Service area</th><th>Status</th><th /></tr></thead><tbody>{workers.map((worker) => <tr key={worker.id}><td><strong>{worker.fullName}</strong><small>{worker.email}<br />{worker.mobile}</small></td><td>{worker.skills.join(", ")}</td><td>{worker.serviceArea}</td><td><span style={statusStyle(worker.verificationStatus)}>{worker.verificationStatus}</span></td><td><button style={styles.secondaryButton} onClick={() => setSelectedWorker(worker)}>Review</button></td></tr>)}</tbody></table></div>
			)}

			{selectedWorker && <div style={styles.overlay}><section style={styles.modal}><button style={styles.close} onClick={() => setSelectedWorker(null)}>Close</button><p style={styles.eyebrow}>Application #{selectedWorker.id}</p><h2 style={styles.modalTitle}>{selectedWorker.fullName}</h2><p>{selectedWorker.email} · {selectedWorker.mobile}</p><p><strong>Skills:</strong> {selectedWorker.skills.join(", ")}</p><p><strong>Service area:</strong> {selectedWorker.serviceArea}</p><p><strong>Proof document:</strong> {selectedWorker.proofDocumentName}</p>{selectedWorker.verificationStatus === "PendingVerification" && <><label style={styles.field}>Rejection reason<textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Required only when rejecting" /></label><div style={styles.actions}><button style={styles.rejectButton} onClick={() => handleDecision("Rejected")}>Reject</button><button style={styles.primaryButton} onClick={() => handleDecision("Verified")}>Approve worker</button></div></>}</section></div>}
		</div>
	);
}

function statusStyle(status) {
	const colors = { PendingVerification: ["#fff7e6", "#b56b00"], Verified: ["#e8f7ef", "#16804a"], Rejected: ["#fff1f1", "#b42318"] };
	const [background, color] = colors[status] || ["#f5f7fa", "#25313c"];
	return { padding: "5px 8px", borderRadius: "999px", background, color, fontSize: "12px", fontWeight: 700 };
}

const styles = { header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", marginBottom: "24px" }, eyebrow: { margin: 0, color: "#1f8a8a", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }, title: { margin: "8px 0", color: "#17324d" }, modalTitle: { marginBottom: "8px", color: "#17324d" }, muted: { color: "#6b7280" }, link: { color: "#1f8a8a", fontWeight: 700 }, filters: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "22px" }, input: { minWidth: "220px", padding: "11px", border: "1px solid #dde3e9", borderRadius: "6px" }, primaryButton: { padding: "11px 16px", border: 0, borderRadius: "6px", background: "#1f8a8a", color: "#fff", cursor: "pointer", fontWeight: 700 }, secondaryButton: { padding: "9px 13px", border: "1px solid #1f8a8a", borderRadius: "6px", background: "#fff", color: "#1f8a8a", cursor: "pointer", fontWeight: 700 }, rejectButton: { padding: "11px 16px", border: 0, borderRadius: "6px", background: "#d64545", color: "#fff", cursor: "pointer", fontWeight: 700 }, tableWrap: { overflowX: "auto", background: "#fff", border: "1px solid #dde3e9", borderRadius: "8px" }, table: { width: "100%", borderCollapse: "collapse", textAlign: "left" }, empty: { padding: "24px", color: "#6b7280" }, success: { color: "#16804a", background: "#e8f7ef", padding: "12px", borderRadius: "6px" }, error: { color: "#b42318", background: "#fff1f1", padding: "12px", borderRadius: "6px" }, overlay: { position: "fixed", inset: 0, background: "rgba(23,50,77,.42)", display: "grid", placeItems: "center", padding: "24px", zIndex: 5 }, modal: { position: "relative", width: "min(560px, 100%)", padding: "30px", background: "#fff", borderRadius: "8px", boxShadow: "0 24px 80px rgba(0,0,0,.2)" }, close: { position: "absolute", top: "18px", right: "18px", border: 0, background: "transparent", color: "#6b7280", cursor: "pointer" }, field: { display: "grid", gap: "8px", marginTop: "20px", fontWeight: 700 }, actions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" } };

export default WorkersPage;
