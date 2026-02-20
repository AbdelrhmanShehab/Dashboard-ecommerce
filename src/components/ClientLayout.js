"use client";
import { useState, memo } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const ClientLayout = memo(function ClientLayout({ children }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  return (
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
  );
});

export default ClientLayout;
