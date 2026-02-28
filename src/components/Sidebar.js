"use client";

import React, { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { title: "Dashboard", icon: "home-icon.svg", href: "/dashboard", roles: ["admin"] },
  { title: "Users", icon: "user-icon.svg", href: "/users", roles: ["admin"] },
  { title: "Customers", icon: "user-icon.svg", href: "/customers", roles: ["admin", "editor"] },
  { title: "Products", icon: "product-icon.svg", href: "/products", roles: ["admin", "editor"] },
  { title: "Analytics", icon: "analysis-icon.svg", href: "/analytics", roles: ["admin"] },
  { title: "Activity Logs", icon: "analysis-icon.svg", href: "/activity", roles: ["admin"] },
  { title: "Categories", icon: "settings-icon.svg", href: "/categories", roles: ["admin", "editor"] },
  { title: "Orders", icon: "checkout.png", href: "/orders", roles: ["admin", "editor"] },
];

const Sidebar = memo(function Sidebar({ visible, onClose }) {
  const pathname = usePathname();
  const { role } = useAuth();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onClose?.();
    }
  };

  const filteredItems = menuItems.filter(item => !item.roles || item.roles.includes(role));

  return (
    <aside
      className={`
         z-40 fixed top-0 left-0
        w-64 bg-gray-100 h-[100vh] p-4 shadow-lg dark:bg-[#0D1321] dark:text-white
        transition-transform duration-300 ease-in-out
        ${visible ? "translate-x-0 md:relative" : "-translate-x-full"}
      `}
    >
      <nav>
        <h1 className="px-4 py-6 text-xl font-semibold">Dashboard</h1>
        <ul className="list-none p-0 m-0">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.title} className="mb-2 dark:text-white">
                <Link
                  href={item.href}
                  onClick={handleClick}
                  className={`flex items-center text-md gap-4 py-2 px-4 rounded-lg transition-colors duration-200 dark:text-white
                    ${isActive ? "bg-gray-300 text-black dark:bg-gray-600" : "text-[#222] hover:bg-gray-200 dark:hover:bg-gray-700"}
                  `}
                >
                  <Image
                    src={`/icons/${item.icon}`}
                    alt={item.title}
                    width={16}
                    height={16}
                    className="dark:invert dark:brightness-200"
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
});

export default Sidebar;
