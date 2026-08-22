import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payroll — Dayflow HRMS",
  description: "View your payroll history and download salary slips",
};

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
