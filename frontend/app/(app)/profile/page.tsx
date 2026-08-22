"use client";

import { useState } from "react";
import {
  User,
  MapPin,
  Phone,
  Briefcase,
  Edit2,
  Save,
  X,
  Upload,
  FileText,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { MOCK_EMPLOYEE } from "@/lib/mock-data";
import type { Employee, EmployeeUpdate } from "@/lib/types";

/* ── helpers ──────────────────────────────────────────────────────────────── */
function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}
function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ── Avatar ───────────────────────────────────────────────────────────────── */
function Avatar({ emp }: { emp: Employee }) {
  return (
    <div
      style={{
        width: 96,
        height: 96,
        borderRadius: "50%",
        background:
          emp.profile_picture_url
            ? undefined
            : "linear-gradient(135deg, var(--accent), var(--cyan))",
        backgroundImage: emp.profile_picture_url
          ? `url(${emp.profile_picture_url})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: "1.8rem",
        color: "#fff",
        border: "3px solid var(--accent)",
        boxShadow: "0 0 24px rgba(108,99,255,0.35)",
        flexShrink: 0,
      }}
    >
      {!emp.profile_picture_url && initials(emp.full_name)}
    </div>
  );
}

/* ── InfoRow ──────────────────────────────────────────────────────────────── */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "14px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--radius-sm)",
          background: "var(--accent-dim)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color="var(--accent-light)" />
      </div>
      <div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </div>
        <div style={{ fontSize: "0.875rem", color: value ? "var(--text-primary)" : "var(--text-muted)", fontWeight: 500 }}>
          {value ?? "—"}
        </div>
      </div>
    </div>
  );
}

/* ── EditForm ─────────────────────────────────────────────────────────────── */
function EditForm({
  emp,
  onSave,
  onCancel,
}: {
  emp: Employee;
  onSave: (data: EmployeeUpdate) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EmployeeUpdate>({
    address: emp.address ?? "",
    phone: emp.phone ?? "",
    profile_picture_url: emp.profile_picture_url ?? "",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
          Address
        </label>
        <textarea
          className="input"
          rows={2}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          style={{ resize: "vertical" }}
        />
      </div>
      <div>
        <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
          Phone
        </label>
        <input
          className="input"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div>
        <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
          Profile Picture URL
        </label>
        <input
          className="input"
          type="url"
          placeholder="https://..."
          value={form.profile_picture_url}
          onChange={(e) =>
            setForm({ ...form, profile_picture_url: e.target.value })
          }
        />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)}>
          <Save size={15} /> Save changes
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>
          <X size={15} /> Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Salary card ──────────────────────────────────────────────────────────── */
function SalaryCard({ emp }: { emp: Employee }) {
  const s = emp.salary_structure;
  if (!s) return null;
  const rows = [
    { label: "Basic", value: s.basic, color: "var(--text-primary)" },
    { label: "HRA", value: s.hra, color: "var(--text-primary)" },
    { label: "Allowances", value: s.allowances, color: "var(--green)" },
    { label: "Deductions", value: -s.deductions, color: "var(--red)" },
  ];
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <DollarSign size={18} color="var(--accent-light)" />
        <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
          Salary Structure
        </h3>
        <span className="badge badge-green" style={{ marginLeft: "auto" }}>
          Active
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <div
            key={r.label}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {r.label}
            </span>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: r.color }}>
              {r.value > 0 ? fmt(r.value) : `−${fmt(-r.value)}`}
            </span>
          </div>
        ))}
        <div
          style={{
            height: 1,
            background: "var(--border)",
            margin: "6px 0",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
            Net Salary
          </span>
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.1rem",
              color: "var(--accent-light)",
              letterSpacing: "-0.01em",
            }}
          >
            {fmt(s.net_salary)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Docs card ────────────────────────────────────────────────────────────── */
function DocsCard({ emp }: { emp: Employee }) {
  const docs = emp.documents ?? {};
  const entries = Object.entries(docs);
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <FileText size={18} color="var(--accent-light)" />
        <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
          Documents
        </h3>
      </div>
      {entries.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No documents on file.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {entries.map(([key, url]) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ justifyContent: "flex-start", fontSize: "0.825rem" }}
            >
              <CheckCircle size={14} color="var(--green)" />
              {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </a>
          ))}
        </div>
      )}
      <button
        className="btn btn-ghost"
        style={{ width: "100%", marginTop: 14, fontSize: "0.8rem", color: "var(--text-muted)" }}
      >
        <Upload size={13} /> Upload new document
      </button>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const [emp, setEmp] = useState<Employee>(MOCK_EMPLOYEE);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave(data: EmployeeUpdate) {
    // TODO: replace with api.patch("/employees/me", data)
    setEmp((prev) => ({ ...prev, ...data, updated_at: new Date().toISOString() }));
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Page header */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          My Profile
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: "0.9rem" }}>
          View and update your personal details
        </p>
      </div>

      {/* Save toast */}
      {saved && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "var(--green)",
            color: "#fff",
            borderRadius: "var(--radius-md)",
            padding: "12px 20px",
            fontWeight: 600,
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 100,
            animation: "fade-up 0.3s ease",
          }}
        >
          <CheckCircle size={16} /> Profile updated!
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 24,
          alignItems: "start",
        }}
        className="profile-grid"
      >
        {/* Left column — identity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Identity card */}
          <div
            className="card card-glow animate-fade-up"
            style={{ padding: 28, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
          >
            <Avatar emp={emp} />
            <h2
              style={{
                marginTop: 16,
                fontWeight: 800,
                fontSize: "1.1rem",
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {emp.full_name}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.83rem", marginTop: 4 }}>
              {emp.job_details ?? "Employee"}
            </p>
            <span className="badge badge-accent" style={{ marginTop: 10 }}>
              Employee #{emp.id}
            </span>
            <div style={{ marginTop: 18, width: "100%" }}>
              {editing ? (
                <button
                  className="btn btn-ghost"
                  style={{ width: "100%" }}
                  onClick={() => setEditing(false)}
                >
                  <X size={14} /> Cancel editing
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={() => setEditing(true)}
                >
                  <Edit2 size={14} /> Edit profile
                </button>
              )}
            </div>
          </div>

          <SalaryCard emp={emp} />
          <DocsCard emp={emp} />
        </div>

        {/* Right column — details / edit form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card animate-fade-up delay-100" style={{ padding: 28 }}>
            <h3
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--text-primary)",
                marginBottom: 4,
              }}
            >
              {editing ? "Edit Details" : "Personal Information"}
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 20 }}>
              {editing
                ? "You can edit address, phone, and profile picture."
                : `Last updated ${new Date(emp.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
            </p>

            {editing ? (
              <EditForm
                emp={emp}
                onSave={handleSave}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <>
                <InfoRow icon={User}      label="Full Name"   value={emp.full_name} />
                <InfoRow icon={MapPin}    label="Address"     value={emp.address} />
                <InfoRow icon={Phone}     label="Phone"       value={emp.phone} />
                <InfoRow icon={Briefcase} label="Job Details" value={emp.job_details} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Responsive stacking */}
      <style>{`
        @media (max-width: 700px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
