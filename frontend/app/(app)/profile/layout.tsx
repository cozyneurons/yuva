import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile — Dayflow HRMS",
  description: "View and edit your employee profile",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
