import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TenancyTable from "../components/TenancyTable";
import tenancyService from "../services/tenancyService";

export default function CurrentTenanciesPage() {
	const { tenantId } = useParams();
	const [tenant, setTenant] = useState(null);
	const [tenancies, setTenancies] = useState([]);
	const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
	const [endDate, setEndDate] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	useEffect(() => {
		loadPage();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tenantId]);

	const loadPage = async () => {
		setLoading(true);
		setErrorMessage("");
		try {
			const [tenantData, tenancyData] = await Promise.all([
				tenancyService.getTenantById(tenantId),
				tenancyService.getTenanciesForTenant(tenantId),
			]);
			setTenant(tenantData);
			setTenancies(tenancyData);
		} catch (error) {
			setErrorMessage(error?.response?.data?.message || "Could not load tenancy information.");
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async (event) => {
		event.preventDefault();
		setSaving(true);
		setErrorMessage("");
		setSuccessMessage("");
		try {
			const created = await tenancyService.createTenancy({
				TenantId: Number(tenantId),
				UnitId: tenant.unitId,
				StartDate: startDate,
				EndDate: endDate || null,
			});
			setTenancies((current) => [created, ...current]);
			setSuccessMessage("Tenancy created successfully.");
			setEndDate("");
		} catch (error) {
			setErrorMessage(error?.response?.data?.message || "Could not create tenancy.");
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <p style={pageStyles.loading}>Loading...</p>;
	if (errorMessage && !tenant) return <p style={pageStyles.error}>{errorMessage}</p>;

	return (
		<div style={pageStyles.page}>
			<h2 style={pageStyles.title}>Current Tenancies</h2>
			<p style={pageStyles.subtitle}>
				{tenant?.fullName} - Unit {tenant?.unitName || `#${tenant?.unitId}`}
			</p>

			<form onSubmit={handleCreate} style={formStyle}>
				<h3 style={pageStyles.formTitle}>Create Tenancy</h3>
				<label>
					Start date
					<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required style={inputStyle} />
				</label>
				<label>
					End date (optional)
					<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} style={inputStyle} />
				</label>
				<button type="submit" disabled={saving} style={buttonStyle}>
					{saving ? "Creating..." : "Create Tenancy"}
				</button>
			</form>

			{successMessage && <p style={pageStyles.success}>{successMessage}</p>}
			{errorMessage && <p style={pageStyles.error}>{errorMessage}</p>}
			<TenancyTable tenancies={tenancies} showEndAction={false} />
		</div>
	);
}

const formStyle = {
	display: "grid",
	gap: 12,
	background: "#fff",
	border: "1px solid #e2e7e9",
	borderRadius: 12,
	padding: "clamp(18px, 3vw, 24px)",
	marginBottom: 20,
	boxShadow: "0 8px 24px rgba(22, 34, 42, 0.045)",
};

const inputStyle = {
	display: "block",
	marginTop: 6,
	padding: 9,
	border: "1px solid #cbd5e1",
	borderRadius: 8,
	fontFamily: "inherit",
	color: "#1f2933",
};

const buttonStyle = {
	width: "fit-content",
	background: "#0f766e",
	color: "#fff",
	border: "none",
	borderRadius: 8,
	padding: "9px 14px",
	cursor: "pointer",
};

const pageStyles = {
	page: { padding: "clamp(18px, 3vw, 30px)", maxWidth: 800, color: "#1f2933", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
	title: { color: "#172033", margin: "0 0 10px", fontSize: 22, fontWeight: 700 },
	formTitle: { margin: "0 0 4px", color: "#172033", fontSize: 17, fontWeight: 700 },
	subtitle: { color: "#64748b", margin: "0 0 18px", fontSize: 14 },
	loading: { padding: 24, color: "#64748b" },
	error: { color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px" },
	success: { color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px" },
};
