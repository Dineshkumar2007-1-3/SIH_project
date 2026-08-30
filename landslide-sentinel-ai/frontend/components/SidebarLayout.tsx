"use client";

import { SidebarProvider, useSidebar } from "./SidebarContext";
import Sidebar from "./Sidebar";

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { width } = useSidebar();

  return (
    <>
      <Sidebar />
      <main
        className="min-h-screen transition-all duration-300 ease-out"
        style={{ marginLeft: width }}
      >
        {children}
      </main>
    </>
  );
}

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
