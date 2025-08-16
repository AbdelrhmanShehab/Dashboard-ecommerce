"use client";
import { useState, useEffect, use } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ThemeProvider } from "@/context/ThemeContext";
export default function ClientLayout({ children }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };
  return (
    <ThemeProvider>
        <div className="flex dark:bg-[#1a1b23]">
          <Sidebar
            visible={sidebarVisible}
            onClose={() => setSidebarVisible(false)}
          />
          <div className="flex-1 flex flex-col">
            <Header toggleSidebar={toggleSidebar} />
            <main className="p-4">{children}</main>
          </div>
        </div>
    </ThemeProvider>
  );
}
