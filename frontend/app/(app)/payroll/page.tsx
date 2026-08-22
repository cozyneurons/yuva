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

  const s = payroll.salary_structure as Record<string, number> | null | undefined;

  if (!s) return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Payroll</h1>
        <p className="text-sm text-gray-500 mt-1">Your salary & compensation details</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <DollarSign size={24} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">No Salary Structure Configured</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Your payroll details and salary structure have not been assigned by HR yet. Once configured by an administrator, your breakdown and monthly payslips will appear here.
          </p>
        </div>
        <div className="pt-2 text-xs text-gray-400 border-t border-gray-100 max-w-sm mx-auto">
          Tip: Log in as <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">admin@dayflow.com</code> to configure salary structures under the <strong>Employees</strong> tab, or log in as <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">alice@dayflow.com</code> to see an active payroll account.
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Payroll</h1>
        <p className="text-sm text-gray-500 mt-1">Your current salary structure</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Net Salary", value: fmt(s.net_salary), icon: DollarSign, color: "text-indigo-600" },
          { label: "Basic", value: fmt(s.basic), icon: TrendingUp, color: "text-blue-600" },
          { label: "Deductions", value: fmt(s.deductions), icon: TrendingDown, color: "text-red-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={15} className={color} />
              <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-medium text-gray-900 mb-4">Salary Breakdown</p>
        <div className="space-y-3">
          {[
            { label: "Basic Salary", amount: s.basic, type: "earn" },
            { label: "HRA", amount: s.hra, type: "earn" },
            { label: "Allowances", amount: s.allowances, type: "earn" },
            { label: "Deductions", amount: s.deductions, type: "deduct" },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{r.label}</span>
              <span className={`font-medium ${r.type === "deduct" ? "text-red-500" : "text-gray-900"}`}>
                {r.type === "deduct" ? `−${fmt(r.amount)}` : fmt(r.amount)}
              </span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Net Salary</span>
            <span className="font-bold text-lg text-indigo-600">{fmt(s.net_salary)}</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <button onClick={downloadSlip} disabled={downloading}
            className="flex items-center gap-2 text-sm font-medium bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition">
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Download Salary Slip (PDF)
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Employee: {payroll.employee_name} · {payroll.employee_code} · 
        Payroll ID #{payroll.employee_id}
      </p>
    </div>
  );
}
