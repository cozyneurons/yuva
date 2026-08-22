"use client";

import { useState } from "react";
import { useMyProfile, usePayroll } from "@/hooks/useQueries";
import { Loader2, DollarSign, TrendingUp, TrendingDown, Download } from "lucide-react";
import { payrollApi } from "@/lib/api";

function fmt(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

export default function PayrollPage() {
  const { data: profile } = useMyProfile();
  const { data: payroll, isLoading, isError } = usePayroll(profile?.id);
  const [downloading, setDownloading] = useState(false);

  async function downloadSlip() {
    if (!profile?.id) return;
    setDownloading(true);
    try {
      const res = await payrollApi.downloadSlip(profile.id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `salary-slip-${profile.full_name?.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download salary slip.");
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading || !profile) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm p-8">
      <Loader2 size={16} className="animate-spin" /> Loading payroll…
    </div>
  );
  if (isError || !payroll) return (
    <p className="text-sm text-red-500 p-8">Failed to load payroll data.</p>
  );

  const currentPayroll = Array.isArray(payroll) ? payroll[0] : payroll;
  const s = currentPayroll?.salary_structure as Record<string, number> | null | undefined;

  if (!s) return (
    <div className="space-y-6 max-w-2xl animate-fade-in-up">
      <div>
        <h1 className="text-4xl font-serif font-bold text-theme-dark tracking-tight">Payroll</h1>
        <p className="text-sm font-bold text-theme-dark/70 mt-2">Your salary & compensation details</p>
      </div>

      <div className="brutal-card p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-xl border-2 border-theme-dark bg-theme-mint text-theme-dark flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
          <DollarSign size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-serif font-bold text-theme-dark">No Salary Structure Configured</h3>
          <p className="text-sm font-bold text-theme-dark/70 mt-2 max-w-md mx-auto">
            Your payroll details and salary structure have not been assigned by HR yet. Once configured by an administrator, your breakdown and monthly payslips will appear here.
          </p>
        </div>
        <div className="pt-4 mt-2 text-xs font-bold text-theme-dark/50 border-t-2 border-theme-dark/10 max-w-sm mx-auto">
          Tip: Log in as <code className="bg-[#C8B8E8] text-theme-dark px-1.5 py-0.5 rounded border-2 border-theme-dark shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">admin@dayflow.com</code> to configure salary structures under the <strong>Employees</strong> tab, or log in as <code className="bg-[#F9F871] text-theme-dark px-1.5 py-0.5 rounded border-2 border-theme-dark shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">alice@dayflow.com</code> to see an active payroll account.
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in-up">
      <div>
        <h1 className="text-4xl font-serif font-bold text-theme-dark tracking-tight">Payroll</h1>
        <p className="text-sm font-bold text-theme-dark/70 mt-2">Your current salary structure</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Net Salary", value: fmt(s.net_salary), icon: DollarSign, color: "text-theme-dark", bg: "bg-[#C8B8E8]" },
          { label: "Basic", value: fmt(s.basic), icon: TrendingUp, color: "text-theme-dark", bg: "bg-theme-mint" },
          { label: "Deductions", value: fmt(s.deductions), icon: TrendingDown, color: "text-red-900", bg: "bg-[#FFB5B5]" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`brutal-card p-5 ${bg}`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={18} className={color} />
              <p className="text-xs font-bold text-theme-dark/60 uppercase tracking-wide">{label}</p>
            </div>
            <p className={`text-2xl font-serif font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="brutal-card p-6 sm:p-8">
        <p className="text-xl font-serif font-bold text-theme-dark mb-6">Salary Breakdown</p>
        <div className="space-y-4">
          {[
            { label: "Basic Salary", amount: s.basic, type: "earn" },
            { label: "HRA", amount: s.hra, type: "earn" },
            { label: "Allowances", amount: s.allowances, type: "earn" },
            { label: "Deductions", amount: s.deductions, type: "deduct" },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-center text-sm font-bold">
              <span className="text-theme-dark/80">{r.label}</span>
              <span className={`text-lg ${r.type === "deduct" ? "text-red-700" : "text-theme-dark"}`}>
                {r.type === "deduct" ? `−${fmt(r.amount)}` : fmt(r.amount)}
              </span>
            </div>
          ))}
          <div className="border-t-2 border-theme-dark/20 pt-4 flex justify-between items-center">
            <span className="font-bold text-theme-dark">Net Salary</span>
            <span className="font-serif font-bold text-2xl text-theme-dark">{fmt(s.net_salary)}</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t-2 border-theme-dark/20">
          <button onClick={downloadSlip} disabled={downloading}
            className="brutal-btn w-full sm:w-auto flex items-center justify-center gap-2 text-sm">
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download Salary Slip (PDF)
          </button>
        </div>
      </div>

      <p className="text-xs font-bold text-theme-dark/50">
        Employee: {currentPayroll.full_name} · {currentPayroll.employee_code} · 
        Payroll ID #{currentPayroll.id}
      </p>
    </div>
  );
}
