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
    <div className="space-y-6 max-w-4xl animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-serif font-bold text-theme-dark tracking-tight">My Profile</h1>
        <p className="text-sm font-bold text-theme-dark/70 mt-2">View and update your personal details</p>
      </div>

      {/* Save toast */}
      {saved && (
        <div className="fixed bottom-6 right-6 bg-theme-green text-white text-sm font-bold px-4 py-3 rounded-lg border-2 border-theme-dark shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex items-center gap-2 z-50">
          <CheckCircle size={15} /> Profile updated!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Identity card */}
        <div className="space-y-4">
          <div className="brutal-card p-6 flex flex-col items-center text-center bg-[#F9F871]">
            <div className="w-20 h-20 rounded-xl border-2 border-theme-dark bg-theme-dark flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
              {profile.profile_picture_url
                ? <img src={profile.profile_picture_url} className="w-full h-full rounded-xl object-cover border-2 border-theme-dark" alt="avatar" />
                : initials(profile.full_name)}
            </div>
            <h2 className="text-2xl font-serif font-bold text-theme-dark">{profile.full_name}</h2>
            <p className="text-sm font-bold text-theme-dark/70 mt-1">{profile.job_details ?? "Employee"}</p>
            <span className="mt-3 text-xs bg-white text-theme-dark border-2 border-theme-dark px-3 py-1 rounded-full font-bold shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">
              {profile.employee_code}
            </span>
            <div className="mt-6 w-full">
              {editing ? (
                <button onClick={() => setEditing(false)}
                  className="w-full brutal-btn-outline bg-white py-2 flex items-center justify-center gap-1.5">
                  <X size={13} /> Cancel
                </button>
              ) : (
                <button onClick={startEdit}
                  className="w-full brutal-btn py-2 flex items-center justify-center gap-1.5">
                  <Edit2 size={13} /> Edit profile
                </button>
              )}
            </div>
          </div>

          {/* Salary card */}
          {sal && (
            <div className="brutal-card p-5 bg-[#C8B8E8]">
              <p className="text-sm font-bold text-theme-dark mb-4 uppercase tracking-wider">Salary Structure</p>
              <div className="space-y-3 text-sm font-bold">
                {[
                  { label: "Basic", value: sal.basic },
                  { label: "HRA", value: sal.hra },
                  { label: "Allowances", value: sal.allowances },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-theme-dark/80">
                    <span>{r.label}</span><span className="text-theme-dark">{fmt(r.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-red-900">
                  <span>Deductions</span><span>−{fmt(sal.deductions)}</span>
                </div>
                <div className="border-t-2 border-theme-dark/20 pt-3 flex justify-between font-serif text-lg text-theme-dark">
                  <span>Net Salary</span><span>{fmt(sal.net_salary)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — Details / Edit form */}
        <div className="lg:col-span-2">
          <div className="brutal-card p-6 sm:p-8">
            <h3 className="text-xl font-serif font-bold text-theme-dark mb-6">
              {editing ? "Edit Details" : "Personal Information"}
            </h3>

            {editing ? (
              <div className="space-y-5">
                <div>
                  <label htmlFor="address-input" className="block text-sm font-bold text-theme-dark mb-1.5">Address</label>
                  <textarea id="address-input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    className="brutal-input resize-none" />
                </div>
                <div>
                  <label htmlFor="phone-input" className="block text-sm font-bold text-theme-dark mb-1.5">Phone</label>
                  <input id="phone-input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="brutal-input" />
                </div>
                <div>
                  <label htmlFor="profile-picture-input" className="block text-sm font-bold text-theme-dark mb-1.5">Profile Picture URL</label>
                  <input id="profile-picture-input" type="url" placeholder="https://…" value={form.profile_picture_url} onChange={e => setForm({ ...form, profile_picture_url: e.target.value })}
                    className="brutal-input" />
                </div>
                
                {error && (
                  <p className="text-sm font-bold text-red-700 bg-[#FFB5B5] p-3 rounded-lg border-2 border-theme-dark">{error}</p>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={updateProfile.isPending}
                    className="brutal-btn flex items-center gap-2">
                    {updateProfile.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save changes
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="brutal-btn-outline bg-[#FFB5B5]">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y-2 divide-theme-dark/10">
                {[
                  { icon: User, label: "Full Name", value: profile.full_name },
                  { icon: Mail, label: "Email", value: profile.email },
                  { icon: BadgeCheck, label: "Employee ID", value: profile.employee_code },
                  { icon: Briefcase, label: "Role / Department", value: profile.job_details },
                  { icon: Phone, label: "Phone", value: profile.phone },
                  { icon: MapPin, label: "Address", value: profile.address },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 rounded-xl border-2 border-theme-dark bg-theme-mint flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                      <Icon size={18} className="text-theme-dark" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-theme-dark/60 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-bold text-theme-dark mt-0.5">{value ?? "—"}</p>
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
