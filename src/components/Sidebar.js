"use client";

import React, { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import hedoomy from "../../public/images/hedoomyybanner.png";
const menuSections = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", icon: "home", href: "/dashboard", roles: ["admin", "editor"] },
    ],
  },
  {
    label: "Sales & Growth",
    items: [
      { title: "Orders", icon: "shopping-bag", href: "/orders", roles: ["admin", "editor"] },
      { title: "Offers", icon: "tag", href: "/offers", roles: ["admin", "editor"] },
      { title: "Leads", icon: "target", href: "/leads", roles: ["admin"] },
      { title: "Shipping", icon: "truck", href: "/shipping", roles: ["admin", "editor"] },
    ],
  },
  {
    label: "Inventory",
    items: [
      { title: "Products", icon: "box", href: "/products", roles: ["admin", "editor"] },
      { title: "Categories", icon: "layers", href: "/categories", roles: ["admin", "editor"] },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Customers", icon: "users", href: "/customers", roles: ["admin", "editor"] },
      { title: "Users", icon: "user-plus", href: "/users", roles: ["admin"] },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Analytics", icon: "bar-chart", href: "/analytics", roles: ["admin"] },
      { title: "Product Stats", icon: "trending-up", href: "/product-stats", roles: ["admin"] },
      { title: "Activity Logs", icon: "clipboard-list", href: "/activity", roles: ["admin"] },
    ],
  },
];

const Icon = ({ name, className }) => {
  const icons = {
    "home": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    "shopping-bag": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
    "tag": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
    "target": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    "truck": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />,
    "box": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
    "layers": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
    "users": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    "user-plus": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />,
    "bar-chart": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    "trending-up": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
    "clipboard-list": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
  };

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icons[name] || <circle cx="12" cy="12" r="10" strokeWidth="2" />}
    </svg>
  );
};

const Sidebar = memo(function Sidebar({ visible, onClose }) {
  const pathname = usePathname();
  const { role, user } = useAuth();

  if (!user) return null;

  const handleClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onClose?.();
    }
  };

  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !item.roles || (role && item.roles.includes(role.toLowerCase()))
    )
  })).filter(section => section.items.length > 0);

  return (
    <aside
      className={`
        z-40 fixed top-0 left-0
        w-64 bg-white h-[100vh] border-r border-gray-100 shadow-xl dark:bg-[#0D1321] dark:border-gray-800
        transition-all duration-300 ease-in-out
        ${visible ? "translate-x-0 md:relative" : "-translate-x-full"}
      `}
    >
      <nav className="h-full overflow-y-auto custom-scrollbar p-6">
        <Image className="mb-6" src={hedoomy} alt="" width={200} height={100} />

        <div className="space-y-8">
          {filteredSections.map((section) => (
            <div key={section.label}>
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 dark:text-gray-500">
                {section.label}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.title}>
                      <Link
                        href={item.href}
                        onClick={handleClick}
                        className={`
                          group relative flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200
                          ${isActive
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/40 dark:hover:text-white"
                          }
                        `}
                      >
                        {isActive && (
                          <span className="absolute left-0 w-1 h-5 bg-indigo-600 rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                        )}
                        <Icon
                          name={item.icon}
                          className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`}
                        />
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
});

export default Sidebar;
