import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createExternalArrangement, getWorkOrder, updateWorkOrderStatus } from "../services/workerService.js";

function WorkOrderDetailsPage() {
	const { id } = useParams();
	const [workOrder, setWorkOrder] = useState(null);
	const [message, setMessage] = useState("");
	const [external, setExternal] = useState({ providerName: "", contact: "", eta: "", note: "" });

	useEffect(() => { getWorkOrder(id).then(setWorkOrder); }, [id]);

	async function updateStatus(status) {
		const updated = await updateWorkOrderStatus(id, status);
		setWorkOrder(updated);
		setMessage(`Work order marked ${status}.`);
	}

	async function handleExternal(event) {
		event.preventDefault();
		await createExternalArrangement({ maintenanceRequestId: workOrder.requestId, ...external });
		setMessage("External maintenance arrangement saved for owner follow-up.");
	}

	if (!workOrder) return <main style={styles.page}><p>Loading work order...</p></main>;

	return <main style={styles.page}><Link to="/owner/work-orders" style={styles.back}>Back to work orders</Link><header style={styles.header}><div><p style={styles.eyebrow}>Work order #{workOrder.id}</p><h1 style={styles.title}>{workOrder.title}</h1><p style={styles.muted}>{workOrder.property} · Unit {workOrder.unit}</p></div><span style={statusStyle(workOrder.status)}>{workOrder.status}</span></header><section style={styles.grid}><article style={styles.card}><p style={styles.label}>Job details</p><p>{workOrder.description}</p><p><strong>Worker:</strong> {workOrder.worker}</p><p><strong>Scheduled:</strong> {new Date(workOrder.scheduledAt).toLocaleString()}</p></article><article style={styles.card}><p style={styles.label}>Execution</p><p style={styles.muted}>Status transitions are mock-backed until the work-order API is connected.</p><div style={styles.actions}>{workOrder.status === "Assigned" && <button style={styles.primary} onClick={() => updateStatus("InProgress")}>Start job</button>}{workOrder.status === "InProgress" && <button style={styles.primary} onClick={() => updateStatus("Completed")}>Complete job</button>}</div></article></section><section style={styles.card}><p style={styles.label}>External fallback preview</p><p style={styles.muted}>Use this path when no suitable internal worker is available.</p><form onSubmit={handleExternal} style={styles.form}>{Object.entries({ providerName: "Provider name", contact: "Contact", eta: "ETA or scheduled time", note: "Notes" }).map(([name, label]) => <label key={name} style={styles.field}>{label}{name === "note" ? <textarea name={name} value={external[name]} onChange={(event) => setExternal({ ...external, [name]: event.target.value })} required={name === "providerName"} /> : <input name={name} value={external[name]} onChange={(event) => setExternal({ ...external, [name]: event.target.value })} required={name === "providerName"} />}</label>)}<button style={styles.secondary} type="submit">Save external arrangement</button></form></section>{message && <p style={styles.success}>{message}</p>}</main>;
}

function statusStyle(status) { return { padding: "8px 11px", borderRadius: "999px", background: status === "Completed" ? "#e8f7ef" : "#fff7e6", color: "#17324d", fontSize: "12px", fontWeight: 700 }; }
const styles = { page: { minHeight: "100vh", padding: "42px 5vw", background: "#f5f7fa", color: "#25313c" }, back: { color: "#1f8a8a", fontWeight: 700 }, header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", margin: "22px 0" }, eyebrow: { color: "#1f8a8a", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }, title: { color: "#17324d", margin: "8px 0" }, muted: { color: "#6b7280", lineHeight: 1.5 }, grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px", marginBottom: "18px" }, card: { padding: "24px", background: "#fff", border: "1px solid #dde3e9", borderRadius: "8px", marginBottom: "18px" }, label: { color: "#6b7280", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }, actions: { display: "flex", gap: "10px", marginTop: "20px" }, primary: { padding: "11px 16px", border: 0, borderRadius: "6px", background: "#1f8a8a", color: "#fff", cursor: "pointer", fontWeight: 700 }, secondary: { padding: "11px 16px", border: "1px solid #1f8a8a", borderRadius: "6px", background: "#fff", color: "#1f8a8a", cursor: "pointer", fontWeight: 700 }, form: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }, field: { display: "grid", gap: "7px", fontWeight: 700 }, success: { padding: "12px", color: "#16804a", background: "#e8f7ef", borderRadius: "6px" } };

export default WorkOrderDetailsPage;
