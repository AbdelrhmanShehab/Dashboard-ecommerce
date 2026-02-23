"use client";
import { memo } from "react";

const AnalyticsCard = memo(function AnalyticsCard({ title, value, icon, trend, trendValue, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md dark:bg-[#1a1b23] dark:border-gray-800">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color] || colorClasses.blue}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}>
            {trend === "up" ? "↑" : "↓"} {trendValue}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {value}
        </h3>
      </div>
    </div>
  );
});

export default AnalyticsCard;
