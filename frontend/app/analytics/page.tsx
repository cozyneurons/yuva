"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
} from "lucide-react";
import { MOCK_ADMIN_REPORT } from "@/lib/mock-data";

/* ── helpers ──────────────────────────────────────────────────────────────── */
function fmt(n: number) {
  if (n >= 1_00_000) return "₹" + (n / 1_00_000).toFixed(1) + "L";
  if (n >= 1_000)    return "₹" + (n / 1_000).toFixed(0) + "K";
  return "₹" + n;
}

const COLORS = ["#6c63ff", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];

/* ── Custom tooltip ───────────────────────────────────────────────────────── */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-bright)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        fontSize: "0.8rem",
      }}
    >
      {label && (
        <div style={{ color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
          {label}
        </div>
      )}
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ color: "var(--text-secondary)" }}>{p.name}:</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
          {label}
        </span>
        <div style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "0.77rem", color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

/* ── Chart card wrapper ───────────────────────────────────────────────────── */
function ChartCard({
  title,
  subtitle,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="card" style={{ padding: 24, ...style }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 3 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  // TODO: replace with useQuery(() => api.get("/admin/reports?period=2025-06"))
  const report = MOCK_ADMIN_REPORT;

  const attendanceRate = Math.round(
    (report.present_days / (report.present_days + report.absent_days + report.leave_days)) * 100
  );

  // Filter out weekends (zero rows) for cleaner trend chart
  const trendData = report.attendance_trend.filter((d) => d.present > 0);

  // Pie data for attendance distribution
  const pieData = [
    { name: "Present", value: report.present_days },
    { name: "Absent",  value: report.absent_days  },
    { name: "Leave",   value: report.leave_days   },
  ];
  const PIE_COLORS = ["#6c63ff", "#ef4444", "#f59e0b"];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Page header */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Analytics
            </h1>
            <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: "0.9rem" }}>
              Workforce report — {new Date(report.period + "-01").toLocaleString("en-IN", { month: "long", year: "numeric" })}
            </p>
          </div>
          <span className="badge badge-accent" style={{ fontSize: "0.78rem" }}>
            <Activity size={11} /> Admin view
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div
        className="animate-fade-up delay-100"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard label="Total Employees"   value={String(report.total_employees)} icon={Users}      color="var(--accent)"  />
        <StatCard label="Attendance Rate"   value={`${attendanceRate}%`}           icon={TrendingUp}  color="var(--green)"   sub={`${report.present_days} present days`} />
        <StatCard label="Absent Days"       value={String(report.absent_days)}      icon={Calendar}   color="var(--red)"     />
        <StatCard label="Leave Days"        value={String(report.leave_days)}       icon={Calendar}   color="var(--amber)"   />
        <StatCard label="Total Payroll"     value={fmt(report.total_payroll)}       icon={DollarSign} color="var(--cyan)"    sub="this month" />
      </div>

      {/* Charts — row 1 */}
      <div
        className="animate-fade-up delay-200"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Attendance trend area chart */}
        <ChartCard
          title="Attendance Trend"
          subtitle="Daily present / absent / leave breakdown"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradLeave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric" })}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "0.78rem", paddingTop: 12 }} />
              <Area type="monotone" dataKey="present" name="Present" stroke="#6c63ff" fill="url(#gradPresent)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="absent"  name="Absent"  stroke="#ef4444" fill="url(#gradAbsent)"  strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="leave"   name="Leave"   stroke="#f59e0b" fill="url(#gradLeave)"   strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Attendance distribution pie */}
        <ChartCard title="Distribution" subtitle="Overall attendance mix">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0];
                  return (
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-bright)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: "0.8rem" }}>
                      <span style={{ color: d.payload.fill, fontWeight: 700 }}>{d.name}</span>
                      <span style={{ color: "var(--text-primary)", marginLeft: 6 }}>{d.value} days</span>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pieData.map((d, i) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i] }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{d.name}</span>
                </div>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Charts — row 2 */}
      <div
        className="animate-fade-up delay-300"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        {/* Dept headcount bar */}
        <ChartCard title="Department Headcount" subtitle="Employees per department">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={report.department_breakdown}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              barSize={28}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="department" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="headcount" name="Employees" radius={[4, 4, 0, 0]}>
                {report.department_breakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Dept avg salary bar */}
        <ChartCard title="Average Salary by Dept" subtitle="Monthly net salary average">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={report.department_breakdown}
              margin={{ top: 4, right: 4, left: -4, bottom: 0 }}
              barSize={28}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="department" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-bright)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: "0.8rem" }}>
                      <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
                      <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                        ₹{Number(payload[0].value).toLocaleString("en-IN")}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="avg_salary" name="Avg Salary" radius={[4, 4, 0, 0]}>
                {report.department_breakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Responsive grid collapse */}
      <style>{`
        @media (max-width: 800px) {
          .analytics-row1,
          .analytics-row2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
