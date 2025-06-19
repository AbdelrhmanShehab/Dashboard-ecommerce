"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    title: "Dashboard",
    icon: "home-icon.svg",
    href: "/",
  },
  {
    title: "Users",
    icon: "user-icon.svg",
    href: "/users",
  },
  {
    title: "Products",
    icon: "product-icon.svg",
    href: "/products",
  },
  {
    title: "Analytics",
    icon: "analysis-icon.svg",
    href: "/analytics",
  },
  {
    title: "Settings",
    icon: "settings-icon.svg",
    href: "/settings",
  },
];

const Sidebar = ({ visible }) => {
  const pathname = usePathname();
  if (!visible) return null;
  return (
    <aside
      className={`z-4 absolute md:relative w-64 bg-gray-100 h-screen p-4 shadow-lg
    transition-all duration-500 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] 
    ${
      visible
        ? "translate-x-0 opacity-100 scale-100 blur-0"
        : "-translate-x-full opacity-0 scale-95 blur-sm"
    }
    hover:shadow-xl hover:bg-gray-50`}
    >
      <nav>
        <h1 className="px-4 py-6 text-xl font-semibold">Dashboard</h1>
        <ul className="list-none p-0 m-0">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.title} className="mb-2">
                <Link
                  href={item.href}
                  className={`flex items-center text-md gap-4 py-2 px-4 rounded-lg transition-colors duration-200 
                    ${
                      isActive
                        ? "bg-gray-300 text-black"
                        : "text-[#222] hover:bg-gray-200"
                    }`}
                >
                  <img
                    src={`/icons/${item.icon}`}
                    alt={item.title}
                    className="w-4 h-4"
                  />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
