import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWorkOrders } from "../services/workerService.js";

function WorkOrdersPage() {
	const [workOrders, setWorkOrders] = useState([]);
	const [filter, setFilter] = useState("");

	useEffect(() => { getWorkOrders().then(setWorkOrders); }, []);

	const visibleOrders = workOrders.filter((workOrder) => !filter || workOrder.status === filter);

	return <main style={styles.page}><header style={styles.header}><div><p style={styles.eyebrow}>Owner workspace</p><h1 style={styles.title}>Work orders</h1><p style={styles.muted}>Track approved assignments and job execution.</p></div><Link to="/owner/approval" style={styles.primary}>Review recommendation</Link></header><div style={styles.filters}><button style={filter === "" ? styles.activeFilter : styles.filter} onClick={() => setFilter("")}>All</button>{["Assigned", "InProgress", "Completed"].map((status) => <button key={status} style={filter === status ? styles.activeFilter : styles.filter} onClick={() => setFilter(status)}>{status}</button>)}</div><section style={styles.list}>{visibleOrders.map((workOrder) => <Link key={workOrder.id} to={`/owner/work-orders/${workOrder.id}`} style={styles.card}><div><span style={styles.priority}>{workOrder.priority}</span><h2 style={styles.cardTitle}>{workOrder.title}</h2><p style={styles.muted}>{workOrder.property} · Unit {workOrder.unit}</p><p>Worker: <strong>{workOrder.worker}</strong></p></div><div style={styles.meta}><span style={statusStyle(workOrder.status)}>{workOrder.status}</span><small>{new Date(workOrder.scheduledAt).toLocaleString()}</small></div></Link>)}</section>{visibleOrders.length === 0 && <p style={styles.empty}>No work orders match this filter.</p>}</main>;
}

function statusStyle(status) { return { padding: "7px 10px", borderRadius: "999px", background: status === "Completed" ? "#e8f7ef" : status === "InProgress" ? "#d9f0ee" : "#fff7e6", color: "#17324d", fontSize: "12px", fontWeight: 700 }; }
const styles = { page: { minHeight: "100vh", padding: "42px 5vw", background: "#f5f7fa", color: "#25313c" }, header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", marginBottom: "24px" }, eyebrow: { color: "#1f8a8a", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }, title: { color: "#17324d", margin: "8px 0" }, muted: { color: "#6b7280" }, primary: { padding: "11px 16px", borderRadius: "6px", background: "#1f8a8a", color: "#fff", textDecoration: "none", fontWeight: 700 }, filters: { display: "flex", gap: "8px", marginBottom: "18px" }, filter: { padding: "9px 14px", border: "1px solid #dde3e9", borderRadius: "6px", background: "#fff", cursor: "pointer" }, activeFilter: { padding: "9px 14px", border: "1px solid #1f8a8a", borderRadius: "6px", background: "#d9f0ee", color: "#17324d", cursor: "pointer", fontWeight: 700 }, list: { display: "grid", gap: "14px" }, card: { display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "center", padding: "22px", background: "#fff", border: "1px solid #dde3e9", borderRadius: "8px", color: "inherit", textDecoration: "none" }, cardTitle: { margin: "10px 0 6px", color: "#17324d" }, priority: { color: "#7557d3", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }, meta: { display: "grid", gap: "12px", justifyItems: "end", color: "#6b7280" }, empty: { padding: "24px", color: "#6b7280" } };

export default WorkOrdersPage;
