"use client";

import { useState } from "react";
import { useMyProfile, useUpdateProfile } from "@/hooks/useQueries";
import { useAuth } from "@/lib/auth-context";
import { Loader2, User, MapPin, Phone, Briefcase, Mail, BadgeCheck, Edit2, Save, X, CheckCircle } from "lucide-react";

function fmt(n?: number | null) {
  if (n == null) return "—";
  return "₹" + n.toLocaleString("en-IN");
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading, isError } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ address: "", phone: "", profile_picture_url: "" });

  function startEdit() {
    setError(null);
    setForm({
      address: profile?.address ?? "",
      phone: profile?.phone ?? "",
      profile_picture_url: profile?.profile_picture_url ?? "",
    });
    setEditing(true);
  }

  async function handleSave() {
    const payload: Record<string, string> = {};
    if (form.address !== undefined) payload.address = form.address;
    if (form.phone !== undefined) payload.phone = form.phone;
    if (form.profile_picture_url !== undefined) payload.profile_picture_url = form.profile_picture_url;
    
    try {
      setError(null);
      await updateProfile.mutateAsync(payload);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message || "Failed to update profile");
    }
  }

  const sal = profile?.salary_structure as Record<string, number> | null | undefined;

  if (isLoading) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm p-8">
      <Loader2 size={16} className="animate-spin" /> Loading profile…
    </div>
  );
  if (isError || !profile) return (
    <p className="text-sm text-red-500 p-8">Failed to load profile.</p>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">View and update your personal details</p>
      </div>

      {/* Save toast */}
      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <CheckCircle size={15} /> Profile updated!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Identity card */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-2xl mb-4">
              {profile.profile_picture_url
                ? <img src={profile.profile_picture_url} className="w-20 h-20 rounded-full object-cover" alt="avatar" />
                : initials(profile.full_name)}
            </div>
            <h2 className="font-semibold text-gray-900">{profile.full_name}</h2>
            <p className="text-sm text-gray-500 mt-1">{profile.job_details ?? "Employee"}</p>
            <span className="mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
              {profile.employee_code}
            </span>
            <div className="mt-4 w-full">
              {editing ? (
                <button onClick={() => setEditing(false)}
                  className="w-full text-sm text-gray-500 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition flex items-center justify-center gap-1.5">
                  <X size={13} /> Cancel
                </button>
              ) : (
                <button onClick={startEdit}
                  className="w-full text-sm font-medium bg-gray-900 text-white rounded-lg py-2 hover:bg-gray-700 transition flex items-center justify-center gap-1.5">
                  <Edit2 size={13} /> Edit profile
                </button>
              )}
            </div>
          </div>

          {/* Salary card */}
          {sal && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-900 mb-4">Salary Structure</p>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: "Basic", value: sal.basic },
                  { label: "HRA", value: sal.hra },
                  { label: "Allowances", value: sal.allowances },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-gray-600">
                    <span>{r.label}</span><span>{fmt(r.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-red-500">
                  <span>Deductions</span><span>−{fmt(sal.deductions)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2.5 flex justify-between font-semibold text-gray-900">
                  <span>Net Salary</span><span>{fmt(sal.net_salary)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — Details / Edit form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-medium text-gray-900 mb-5">
              {editing ? "Edit Details" : "Personal Information"}
            </h3>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="address-input" className="block text-sm text-gray-600 mb-1.5">Address</label>
                  <textarea id="address-input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
                </div>
                <div>
                  <label htmlFor="phone-input" className="block text-sm text-gray-600 mb-1.5">Phone</label>
                  <input id="phone-input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label htmlFor="profile-picture-input" className="block text-sm text-gray-600 mb-1.5">Profile Picture URL</label>
                  <input id="profile-picture-input" type="url" placeholder="https://…" value={form.profile_picture_url} onChange={e => setForm({ ...form, profile_picture_url: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={updateProfile.isPending}
                    className="flex items-center gap-1.5 text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition">
                    {updateProfile.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Save changes
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {[
                  { icon: User, label: "Full Name", value: profile.full_name },
                  { icon: Mail, label: "Email", value: profile.email },
                  { icon: BadgeCheck, label: "Employee ID", value: profile.employee_code },
                  { icon: Briefcase, label: "Role / Department", value: profile.job_details },
                  { icon: Phone, label: "Phone", value: profile.phone },
                  { icon: MapPin, label: "Address", value: profile.address },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4 py-3.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                      <p className="text-sm text-gray-800 mt-0.5">{value ?? "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
