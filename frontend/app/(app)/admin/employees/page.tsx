"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUpdateEmployeeAdmin, useUpdatePayroll } from "@/hooks/useQueries";
import { adminApi, profileApi } from "@/lib/api";
import { Loader2, Search, Users, ChevronDown, ChevronUp, Save, X } from "lucide-react";

type EmpRow = {
  id: number;
  user_id: number;
  employee_code: string;
  email: string;
  full_name: string;
  job_details: string | null;
  phone: string | null;
  role: string;
  net_salary: number;
};

function fmt(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

export default function AdminEmployeesPage() {
  const { data: employees, isLoading, isError } = useQuery({
    queryKey: ["admin-employees"],
    queryFn: () => adminApi.listEmployees().then((r) => r.data as EmpRow[]),
  });
  const updateEmp = useUpdateEmployeeAdmin();
  const updatePayroll = useUpdatePayroll();

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editForms, setEditForms] = useState<Record<number, { full_name: string; job_details: string; phone: string; basic: string; hra: string; allowances: string; deductions: string }>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const filtered = (employees ?? []).filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_code.toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(emp: EmpRow) {
    setError(null);
    setEditForms((prev) => ({
      ...prev,
      [emp.id]: {
        full_name: emp.full_name,
        job_details: emp.job_details ?? "",
        phone: emp.phone ?? "",
        basic: "",
        hra: "",
        allowances: "",
        deductions: "",
      },
    }));
    setExpanded(emp.id);
  }

  async function handleSave(emp: EmpRow) {
    const form = editForms[emp.id];
    if (!form) return;

    setError(null);
    try {
      // Update profile fields
      const profilePayload: Record<string, string> = {};
      if (form.full_name && form.full_name !== emp.full_name) profilePayload.full_name = form.full_name;
      if (form.job_details !== (emp.job_details ?? "")) profilePayload.job_details = form.job_details;
      if (form.phone !== (emp.phone ?? "")) profilePayload.phone = form.phone;

      if (Object.keys(profilePayload).length > 0) {
        await updateEmp.mutateAsync({ id: emp.id, data: profilePayload });
      }

      // Update salary if any salary field entered
      if (form.basic || form.hra || form.allowances || form.deductions) {
        const salaryPayload: Record<string, number> = {};
        if (form.basic) salaryPayload.basic = parseFloat(form.basic);
        if (form.hra) salaryPayload.hra = parseFloat(form.hra);
        if (form.allowances) salaryPayload.allowances = parseFloat(form.allowances);
        if (form.deductions) salaryPayload.deductions = parseFloat(form.deductions);
        await updatePayroll.mutateAsync({ employeeId: emp.id, data: { salary_structure: salaryPayload } });
      }

      setSaved((prev) => ({ ...prev, [emp.id]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [emp.id]: false })), 2000);
      setExpanded(null);
    } catch (e: any) {
      setError(e.message || "Failed to save changes");
    }
  }

  if (isLoading) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm p-8">
      <Loader2 size={16} className="animate-spin" /> Loading employees…
    </div>
  );
  if (isError) return <p className="text-sm text-red-500 p-8">Failed to load employees.</p>;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users size={20} /> Employees
          </h1>
          <p className="text-sm text-gray-500 mt-1">{employees?.length ?? 0} total</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-medium">Employee</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Role / Dept</th>
              <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Net Salary</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((emp) => (
              <Fragment key={emp.id}>
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{emp.full_name}</p>
                    <p className="text-xs text-gray-400">{emp.email} · {emp.employee_code}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                    {emp.job_details ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 hidden md:table-cell font-medium">
                    {emp.net_salary ? fmt(emp.net_salary) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => expanded === emp.id ? setExpanded(null) : startEdit(emp)}
                      className="text-xs font-medium text-gray-700 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition flex items-center gap-1 ml-auto"
                    >
                      {expanded === emp.id ? <><ChevronUp size={12} /> Close</> : <><ChevronDown size={12} /> Edit</>}
                    </button>
                  </td>
                </tr>
                {expanded === emp.id && editForms[emp.id] && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 bg-gray-50 border-b border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                          <input value={editForms[emp.id].full_name}
                            onChange={e => setEditForms(p => ({ ...p, [emp.id]: { ...p[emp.id], full_name: e.target.value } }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Role / Department</label>
                          <input value={editForms[emp.id].job_details}
                            onChange={e => setEditForms(p => ({ ...p, [emp.id]: { ...p[emp.id], job_details: e.target.value } }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Phone</label>
                          <input value={editForms[emp.id].phone}
                            onChange={e => setEditForms(p => ({ ...p, [emp.id]: { ...p[emp.id], phone: e.target.value } }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                        </div>
                        <div className="sm:col-span-2 border-t border-gray-200 pt-3 mt-1">
                          <p className="text-xs text-gray-400 mb-2 font-medium">Salary Structure (leave blank to keep current)</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {["basic", "hra", "allowances", "deductions"].map(field => (
                              <div key={field}>
                                <label className="block text-xs text-gray-500 mb-1 capitalize">{field}</label>
                                <input type="number" placeholder="₹"
                                  value={(editForms[emp.id] as Record<string, string>)[field]}
                                  onChange={e => setEditForms(p => ({ ...p, [emp.id]: { ...p[emp.id], [field]: e.target.value } }))}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => handleSave(emp)}
                          disabled={updateEmp.isPending || updatePayroll.isPending}
                          className="flex items-center gap-1.5 text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition">
                          {(updateEmp.isPending || updatePayroll.isPending) ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          {saved[emp.id] ? "Saved!" : "Save changes"}
                        </button>
                        <button onClick={() => setExpanded(null)}
                          className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No employees found</p>
        )}
      </div>
    </div>
  );
}
