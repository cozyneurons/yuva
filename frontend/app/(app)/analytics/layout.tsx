import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics — Dayflow HRMS",
  description: "Workforce analytics and attendance reports",
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
