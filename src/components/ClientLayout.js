"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const ClientLayout = ({ children }) => {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  return (
    <div className="flex h-screen">
      <Sidebar visible={sidebarVisible} />
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        <Header toggleSidebar={toggleSidebar} />
        <main className="p-6 bg-gray-100 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default ClientLayout;
