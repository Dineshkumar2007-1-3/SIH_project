"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface SidebarContextType {
  collapsed: boolean;
  toggle: () => void;
  width: number;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
  width: 220,
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  const width = collapsed ? 68 : 220;

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, width }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
