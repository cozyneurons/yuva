"use client";

import { useState, useEffect, useRef } from "react";
import {
  DollarSign,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";
import { MOCK_PAYROLL_RECORDS, MOCK_EMPLOYEE } from "@/lib/mock-data";
import type { PayrollRecord, SalaryStructure } from "@/lib/types";

/* ── helpers ──────────────────────────────────────────────────────────────── */
function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function fmtMonth(m: string) {
  const [y, mo] = m.split("-");
  return new Date(+y, +mo - 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

/* ── Stat card ────────────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="stat-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--radius-sm)",
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} color={color} />
        </div>
      </div>
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ── Slip modal ───────────────────────────────────────────────────────────── */
function SlipModal({
  record,
  empName,
  onClose,
}: {
  record: PayrollRecord;
  empName: string;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the modal when it opens
    modalRef.current?.focus();
    
    // Save previous focus
    const previousFocus = document.activeElement as HTMLElement;
    
    // Handle Escape and Tab
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const s: SalaryStructure = record.salary_structure;
  const rows = [
    { label: "Basic Salary", amount: s.basic, type: "earn" },
    { label: "HRA",          amount: s.hra,   type: "earn" },
    { label: "Allowances",   amount: s.allowances, type: "earn" },
    { label: "Deductions",   amount: s.deductions, type: "deduct" },
  ];

  function handleDownload() {
    // TODO: replace with GET /api/v1/payroll/{id}/slip  (returns PDF blob)
    const content = `SALARY SLIP — ${fmtMonth(record.month)}
Employee: ${empName}
${"─".repeat(40)}
Basic Salary   : ${fmt(s.basic)}
HRA            : ${fmt(s.hra)}
Allowances     : ${fmt(s.allowances)}
Deductions     : -${fmt(s.deductions)}
${"─".repeat(40)}
NET SALARY     : ${fmt(s.net_salary)}
${"─".repeat(40)}
Paid on: ${record.paid_at ? new Date(record.paid_at).toLocaleDateString("en-IN") : "Pending"}
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salary-slip-${record.month}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="card animate-fade-up focus-visible:outline-none"
        style={{ maxWidth: 480, width: "100%", padding: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h2
              id="modal-title"
              style={{
                fontWeight: 800,
                fontSize: "1.1rem",
                color: "var(--text-primary)",
              }}
            >
              Salary Slip
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 2 }}>
              {fmtMonth(record.month)}
            </p>
          </div>
          <span
            className={record.paid_at ? "badge badge-green" : "badge badge-amber"}
          >
            {record.paid_at ? "Paid" : "Pending"}
          </span>
        </div>

        {/* Employee info */}
        <div
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            padding: "14px 18px",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Employee</div>
          <div
            style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginTop: 2 }}
          >
            {empName}
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {rows.map((r) => (
            <div
              key={r.label}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {r.label}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color:
                    r.type === "deduct"
                      ? "var(--red)"
                      : "var(--text-primary)",
                }}
              >
                {r.type === "deduct" ? `−${fmt(r.amount)}` : fmt(r.amount)}
              </span>
            </div>
          ))}
          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              Net Salary
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.1rem",
                color: "var(--accent-light)",
              }}
            >
              {fmt(s.net_salary)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            id="download-slip-btn"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleDownload}
          >
            <Download size={15} /> Download slip
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Record row ───────────────────────────────────────────────────────────── */
function PayrollRow({
  record,
  prev,
  onClick,
}: {
  record: PayrollRecord;
  prev: PayrollRecord | null;
  onClick: () => void;
}) {
  const net = record.salary_structure.net_salary;
  const prevNet = prev?.salary_structure.net_salary ?? net;
  const delta = net - prevNet;

  return (
    <div
      role="button"
      tabIndex={0}
      className="card card-glow focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        padding: "18px 22px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        flexWrap: "wrap",
      }}
    >
      {/* Month icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-md)",
          background: "var(--accent-dim)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Calendar size={20} color="var(--accent-light)" />
      </div>

      {/* Month label */}
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
          {fmtMonth(record.month)}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
          {record.paid_at
            ? `Paid ${new Date(record.paid_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
            : "Not yet paid"}
        </div>
      </div>

      {/* Delta */}
      {delta !== 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: "0.78rem",
            fontWeight: 600,
            color: delta > 0 ? "var(--green)" : "var(--red)",
          }}
        >
          {delta > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {delta > 0 ? "+" : ""}
          {fmt(Math.abs(delta))}
        </div>
      )}

      {/* Net */}
      <div style={{ textAlign: "right", minWidth: 110 }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: "1rem",
            color: "var(--accent-light)",
            letterSpacing: "-0.01em",
          }}
        >
          {fmt(net)}
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
          net salary
        </div>
      </div>

      {/* Status badge */}
      <span
        className={record.paid_at ? "badge badge-green" : "badge badge-amber"}
        style={{ flexShrink: 0 }}
      >
        {record.paid_at ? (
          <>
            <CheckCircle size={10} /> Paid
          </>
        ) : (
          <>
            <Clock size={10} /> Pending
          </>
        )}
      </span>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function PayrollPage() {
  const records = MOCK_PAYROLL_RECORDS;
  const [selected, setSelected] = useState<PayrollRecord | null>(null);

  const latest = records[0];
  const s = latest.salary_structure;
  const totalYTD = records.reduce(
    (acc, r) => acc + r.salary_structure.net_salary,
    0
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
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
          Payroll
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: "0.9rem" }}>
          Salary history and slip downloads
        </p>
      </div>

      {/* Stats */}
      <div
        className="animate-fade-up delay-100"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Current Net Salary"
          value={fmt(s.net_salary)}
          sub={fmtMonth(latest.month)}
          icon={DollarSign}
          color="var(--accent)"
        />
        <StatCard
          label="Basic"
          value={fmt(s.basic)}
          icon={TrendingUp}
          color="var(--cyan)"
        />
        <StatCard
          label="Total Deductions"
          value={fmt(s.deductions)}
          icon={TrendingDown}
          color="var(--red)"
        />
        <StatCard
          label="YTD Earnings"
          value={fmt(totalYTD)}
          sub={`${records.length} months`}
          icon={Calendar}
          color="var(--green)"
        />
      </div>

      {/* History */}
      <div className="animate-fade-up delay-200">
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 14,
          }}
        >
          Payroll History
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {records.map((rec, i) => (
            <PayrollRow
              key={rec.id}
              record={rec}
              prev={records[i + 1] ?? null}
              onClick={() => setSelected(rec)}
            />
          ))}
        </div>
      </div>

      {/* Slip modal */}
      {selected && (
        <SlipModal
          record={selected}
          empName={MOCK_EMPLOYEE.full_name}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
