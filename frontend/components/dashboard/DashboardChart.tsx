"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useEffect, useState } from "react";

type DashboardChartProps = {
  present: number;
  absent: number;
  leaves: number;
};

export function DashboardChart({ present, absent, leaves }: DashboardChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 flex items-center justify-center animate-pulse bg-slate-50/50 rounded-xl" />;
  }

  const data = [
    { name: "Present", value: Number(present) || 0, color: "#4f46e5" }, // Indigo 600
    { name: "Absent", value: Number(absent) || 0, color: "#f43f5e" },   // Rose 500
    { name: "Leaves", value: Number(leaves) || 0, color: "#eab308" },   // Yellow 500
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
        <p className="text-sm font-medium">No data available for this month</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px' }}
            itemStyle={{ fontWeight: 600, fontSize: '14px' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-slate-600 font-medium text-sm ml-1.5">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
