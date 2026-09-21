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

	if (loading) return <p style={{ padding: 24, color: "#6B7280" }}>Loading...</p>;
	if (errorMessage && !tenant) return <p style={{ padding: 24, color: "#D64545" }}>{errorMessage}</p>;

	return (
		<div style={{ padding: 24, maxWidth: 720 }}>
			<h2 style={{ color: "#17324D" }}>Current Tenancies</h2>
			<p style={{ color: "#6B7280" }}>
				{tenant?.fullName} - Unit {tenant?.unitName || `#${tenant?.unitId}`}
			</p>

			<form onSubmit={handleCreate} style={formStyle}>
				<h3 style={{ marginTop: 0, color: "#17324D" }}>Create Tenancy</h3>
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

			{successMessage && <p style={{ color: "#22A06B" }}>{successMessage}</p>}
			{errorMessage && <p style={{ color: "#D64545" }}>{errorMessage}</p>}
			<TenancyTable tenancies={tenancies} showEndAction={false} />
		</div>
	);
}

const formStyle = {
	display: "grid",
	gap: 12,
	background: "#fff",
	border: "1px solid #DDE3E9",
	borderRadius: 8,
	padding: 16,
	marginBottom: 20,
};

const inputStyle = {
	display: "block",
	marginTop: 6,
	padding: 9,
	border: "1px solid #DDE3E9",
	borderRadius: 6,
};

const buttonStyle = {
	width: "fit-content",
	background: "#1F8A8A",
	color: "#fff",
	border: "none",
	borderRadius: 6,
	padding: "9px 14px",
	cursor: "pointer",
};
