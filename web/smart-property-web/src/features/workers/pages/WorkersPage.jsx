import { useEffect, useState } from "react";
import { getWorkers, updateWorkerVerification } from "../services/workerService.js";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5144"
).replace(/\/+$/, "");

function WorkersPage() {
	const [workers, setWorkers] = useState([]);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("PendingVerification");
	const [selectedWorker, setSelectedWorker] = useState(null);
	const [rejectionReason, setRejectionReason] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [showPreview, setShowPreview] = useState(true);

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

	function resolveDocumentUrl(url) {
		if (!url) return "";
		if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
			return encodeURI(url);
		}
		if (url.startsWith("/uploads/")) {
			return encodeURI(`${API_BASE_URL}${url}`);
		}
		return encodeURI(`${API_BASE_URL}/${url.replace(/^\/+/, "")}`);
	}

	function isImageDoc(url, name) {
		if (!url && !name) return false;
		if (url?.startsWith("data:image/")) return true;
		const target = (name || url || "").toLowerCase();
		return /\.(jpe?g|png|webp|gif|bmp|svg)($|\?)/i.test(target);
	}

	function isPdfDoc(url, name) {
		if (!url && !name) return false;
		if (url?.startsWith("data:application/pdf")) return true;
		const target = (name || url || "").toLowerCase();
		return /\.pdf($|\?)/i.test(target);
	}

	function getGoogleDriveEmbedUrl(url) {
		if (!url) return null;
		const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
		if (match && match[1]) {
			return `https://drive.google.com/file/d/${match[1]}/preview`;
		}
		return null;
	}

	function handleViewDocument(worker) {
		if (!worker) return;
		const fullUrl = resolveDocumentUrl(worker.proofDocumentUrl);
		if (!fullUrl) return;

		window.open(fullUrl, "_blank", "noopener,noreferrer");
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
		<div style={styles.page}>
			<div style={styles.header}>
				<div><p style={styles.eyebrow}>Admin workspace</p><h1 style={styles.title}>Worker verification</h1><p style={styles.muted}>Review trade proof before workers can receive official jobs.</p></div>
			</div>

			<form style={styles.filters} onSubmit={handleSearch}>
				<input style={styles.input} placeholder="Search name, email or mobile" value={search} onChange={(event) => setSearch(event.target.value)} />
				<select style={styles.input} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="PendingVerification">Pending verification</option><option value="Verified">Verified</option><option value="Rejected">Rejected</option></select>
				<button style={styles.primaryButton}>Search</button>
			</form>

			{message && <p style={styles.success}>{message}</p>}
			{error && <p style={styles.error}>{error}</p>}
			{loading ? <p>Loading worker applications...</p> : workers.length === 0 ? <p style={styles.empty}>No worker applications match these filters.</p> : (
				<div style={styles.tableWrap}><table style={styles.table}><thead><tr><th>Name</th><th>Skills</th><th>Service area</th><th>Status</th><th>Document</th><th /></tr></thead><tbody>{workers.map((worker) => {
					const docUrl = resolveDocumentUrl(worker.proofDocumentUrl);
					return (
						<tr key={worker.id}>
							<td><strong>{worker.fullName}</strong><small>{worker.email}<br />{worker.mobile}</small></td>
							<td>{worker.skills.join(", ")}</td>
							<td>{worker.serviceArea}</td>
							<td><span style={statusStyle(worker.verificationStatus)}>{worker.verificationStatus}</span></td>
							<td>
								{docUrl ? (
									<a
										href={docUrl}
										target="_blank"
										rel="noopener noreferrer"
										style={{ ...styles.viewDocButton, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
										title="Open Proof Document in new tab"
									>
										↗ Open Doc
									</a>
								) : (
									<span style={{ color: "#94a3b8", fontSize: "12px" }}>No doc</span>
								)}
							</td>
							<td>
								<button style={styles.secondaryButton} onClick={() => { setSelectedWorker(worker); setShowPreview(true); }}>Review</button>
							</td>
						</tr>
					);
				})}</tbody></table></div>
			)}

			{selectedWorker && (
				<div style={styles.overlay}>
					<section style={styles.modal}>
						<button style={styles.close} onClick={() => setSelectedWorker(null)}>✕</button>
						<p style={styles.eyebrow}>Application #{selectedWorker.id}</p>
						<h2 style={styles.modalTitle}>{selectedWorker.fullName}</h2>
						<p style={{ margin: "4px 0 16px", color: "#6b7280" }}>{selectedWorker.email} · {selectedWorker.mobile}</p>
						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px", fontSize: "14px" }}>
							<p style={{ margin: 0 }}><strong>Skills:</strong> {selectedWorker.skills.join(", ")}</p>
							<p style={{ margin: 0 }}><strong>Service area:</strong> {selectedWorker.serviceArea}</p>
						</div>

						{/* Proof Document Review Box */}
						{(() => {
							const rawUrl = selectedWorker.proofDocumentUrl;
							const docUrl = resolveDocumentUrl(rawUrl);
							const isImg = isImageDoc(docUrl, selectedWorker.proofDocumentName);
							const isPdf = isPdfDoc(docUrl, selectedWorker.proofDocumentName);
							const gDriveEmbed = getGoogleDriveEmbedUrl(rawUrl);
							const isCloudLink = rawUrl?.includes("drive.google.com") || rawUrl?.includes("onedrive") || rawUrl?.includes("dropbox.com");

							return (
								<div style={styles.docBox}>
									<div style={styles.docHeader}>
										<div>
											<strong style={{ fontSize: "12px", color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.5px" }}>
												{isCloudLink ? "🌐 Cloud Document Link" : "📄 Trade Proof Document"}
											</strong>
											<p style={{ margin: "2px 0 0", fontWeight: 700, color: "#1e293b", fontSize: "14px" }}>
												{selectedWorker.proofDocumentName || "Trade Certificate / License"}
											</p>
										</div>
										<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
											{docUrl && (
												<a
													href={docUrl}
													target="_blank"
													rel="noopener noreferrer"
													style={{
														...styles.viewDocButton,
														textDecoration: "none",
														display: "inline-flex",
														alignItems: "center",
														gap: "4px"
													}}
												>
													↗ Open Document
												</a>
											)}
											{docUrl && (
												<button
													type="button"
													style={styles.togglePreviewButton}
													onClick={() => setShowPreview(!showPreview)}
												>
													{showPreview ? "Hide Preview" : "Show Preview"}
												</button>
											)}
										</div>
									</div>

									{showPreview && docUrl && (
										<div style={{ marginTop: "14px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1", background: "#f8fafc" }}>
											{gDriveEmbed ? (
												<div style={{ padding: "6px" }}>
													<iframe
														src={gDriveEmbed}
														title="Google Drive Document Preview"
														style={{ width: "100%", height: "380px", border: 0, borderRadius: "6px" }}
														allow="autoplay"
													/>
												</div>
											) : isImg ? (
												<div style={{ padding: "16px", textAlign: "center", background: "#0f172a" }}>
													<img
														src={docUrl}
														alt="Trade License Proof"
														style={{ maxWidth: "100%", maxHeight: "360px", objectFit: "contain", borderRadius: "6px", boxShadow: "0 6px 18px rgba(0,0,0,0.4)" }}
													/>
												</div>
											) : isPdf ? (
												<div style={{ padding: "6px" }}>
													<iframe
														src={docUrl}
														title="PDF Proof Document"
														style={{ width: "100%", height: "360px", border: 0, borderRadius: "6px" }}
													/>
												</div>
											) : (
												<div style={{ padding: "20px", textAlign: "center" }}>
													<p style={{ margin: "0 0 12px", color: "#334155", fontSize: "14px" }}>
														Document Link: <strong>{selectedWorker.proofDocumentName || "Trade Certificate"}</strong>
													</p>
													<a
														href={docUrl}
														target="_blank"
														rel="noopener noreferrer"
														style={{ ...styles.primaryButton, display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
													>
														↗ Open Document ({docUrl.length > 40 ? docUrl.substring(0, 40) + "..." : docUrl})
													</a>
												</div>
											)}
										</div>
									)}

									{!docUrl && (
										<div style={{ marginTop: "10px", padding: "10px", background: "#f8fafc", borderRadius: "6px", fontSize: "13px", color: "#64748b" }}>
											No proof document link was provided for this application.
										</div>
									)}
								</div>
							);
						})()}

						{selectedWorker.verificationStatus === "PendingVerification" && (
							<>
								<label style={styles.field}>
									Rejection reason
									<textarea
										value={rejectionReason}
										onChange={(event) => setRejectionReason(event.target.value)}
										placeholder="Required only when rejecting..."
										rows={3}
										style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
									/>
								</label>
								<div style={styles.actions}>
									<button style={styles.rejectButton} onClick={() => handleDecision("Rejected")}>Reject</button>
									<button style={styles.approveButton} onClick={() => handleDecision("Verified")}>Approve worker</button>
								</div>
							</>
						)}
					</section>
				</div>
			)}
		</div>
	);
}

function statusStyle(status) {
	const colors = { PendingVerification: ["#fff7e6", "#b56b00"], Verified: ["#e8f7ef", "#16804a"], Rejected: ["#fff1f1", "#b42318"] };
	const [background, color] = colors[status] || ["#f5f7fa", "#25313c"];
	return { padding: "5px 8px", borderRadius: "999px", background, color, fontSize: "12px", fontWeight: 700 };
}

const styles = {
	page: { color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
	header: { display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "flex-start", marginBottom: "24px" },
	eyebrow: { margin: 0, color: "#5145cd", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" },
	title: { margin: "8px 0", color: "#172033", fontSize: "clamp(23px, 3vw, 30px)", fontWeight: 750 },
	modalTitle: { margin: "0 0 4px", color: "#172033" },
	muted: { color: "#64748b" },
	link: { color: "#5145cd", fontWeight: 700 },
	filters: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "22px" },
	input: { minWidth: "220px", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#1f2933", background: "#fff", fontFamily: "inherit", fontSize: "13px" },
	primaryButton: { padding: "11px 16px", border: 0, borderRadius: "8px", background: "#5145cd", color: "#fff", cursor: "pointer", fontWeight: 700 },
	approveButton: { padding: "11px 16px", border: 0, borderRadius: "8px", background: "#15803d", color: "#fff", cursor: "pointer", fontWeight: 700 },
	secondaryButton: { padding: "9px 13px", border: "1px solid #5145cd", borderRadius: "8px", background: "#f4f3ff", color: "#5145cd", cursor: "pointer", fontWeight: 700 },
	rejectButton: { padding: "11px 16px", border: 0, borderRadius: "8px", background: "#b91c1c", color: "#fff", cursor: "pointer", fontWeight: 700 },
	viewDocButton: { padding: "7px 12px", border: "1px solid #dedcff", borderRadius: "8px", background: "#f4f3ff", color: "#5145cd", cursor: "pointer", fontWeight: 700, fontSize: "13px" },
	togglePreviewButton: { padding: "7px 12px", border: "1px solid #94a3b8", borderRadius: "6px", background: "#f1f5f9", color: "#475569", cursor: "pointer", fontWeight: 600, fontSize: "13px" },
	docBox: { margin: "16px 0", padding: "14px", background: "#f7f7ff", border: "1px solid #dedcff", borderRadius: "10px" },
	docHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" },
	tableWrap: { overflowX: "auto", background: "#fff", border: "1px solid #e2e7e9", borderRadius: "10px", boxShadow: "0 8px 24px rgba(22, 34, 42, 0.04)" },
	table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
	empty: { padding: "24px", color: "#6b7280" },
	success: { color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 14px", borderRadius: "8px" },
	error: { color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", padding: "12px 14px", borderRadius: "8px" },
	overlay: { position: "fixed", inset: 0, background: "rgba(24, 30, 45, .48)", display: "grid", placeItems: "center", padding: "24px", zIndex: 100 },
	modal: { position: "relative", width: "min(620px, 100%)", maxHeight: "90vh", overflowY: "auto", padding: "clamp(22px, 4vw, 30px)", background: "#fff", border: "1px solid #e2e7e9", borderRadius: "12px", boxShadow: "0 24px 80px rgba(15, 23, 42, .22)" },
	close: { position: "absolute", top: "18px", right: "18px", border: 0, background: "transparent", color: "#6b7280", cursor: "pointer", fontSize: "18px", fontWeight: "bold" },
	field: { display: "grid", gap: "8px", marginTop: "16px", fontWeight: 700 },
	actions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" },
};

export default WorkersPage;
