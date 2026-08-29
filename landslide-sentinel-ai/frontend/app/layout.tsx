import type { Metadata } from "next";
import "./globals.css";
import SidebarLayout from "../components/SidebarLayout";

export const metadata: Metadata = {
  title: "Landslide Sentinel AI — Real-Time Risk Monitoring",
  description: "Professional landslide risk monitoring and alerting system powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SidebarLayout>{children}</SidebarLayout>
      </body>
    </html>
  );
}
