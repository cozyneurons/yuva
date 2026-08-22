import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: "Dayflow HRMS",
  description:
    "Modern HR Management System — attendance, leave, payroll, and team analytics in one place.",
  keywords: ["HRMS", "HR software", "attendance", "leave management", "payroll"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-theme-beige text-theme-dark antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
