"use client";

import { useEffect, useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, limit, orderBy } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import TitlePage from "../../components/TitlePage";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import LineChart from "../../components/LineChart";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

import RoleGuard from "../../components/RoleGuard";

import AnalyticsCard from "../../components/AnalyticsCard";

export default function AnalyticsPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AnalyticsContent />
    </RoleGuard>
  );
}

function AnalyticsContent() {
  const { user } = useAuth();
  const router = useRouter();

  /* ---------------- FIRESTORE QUERIES ---------------- */
  const [usersSnap, usersLoading] = useCollection(query(collection(db, "users"), limit(500)));
  const [productsSnap, productsLoading] = useCollection(query(collection(db, "products"), limit(500)));
  const [ordersSnap, ordersLoading] = useCollection(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(500)));

  const loading = usersLoading || productsLoading || ordersLoading;

  /* ---------------- CALCULATIONS (Memoized) ---------------- */
  const metrics = useMemo(() => {
    if (!usersSnap || !productsSnap || !ordersSnap) return null;

    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Financials
    const totalRevenue = orders
      .filter(o => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.totals?.total || 0), 0);
    
    const aov = orders.length ? totalRevenue / orders.length : 0;

    // Users
    const activeUsers = users.filter(u => u.status === "active").length;
    const adminCount = users.filter(u => u.role === "admin").length;

    // Products & Stock
    const totalStock = products.reduce((sum, p) => sum + (p.totalStock || 0), 0);
    const lowStockItems = products.filter(p => p.totalStock > 0 && p.totalStock < 5).length;

    // Order Statuses
    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    // Sales by Category (Actual sales from orders)
    const categorySales = orders.reduce((acc, o) => {
      o.items?.forEach(item => {
        const cat = item.category || "Uncategorized";
        acc[cat] = (acc[cat] || 0) + (item.price * item.qty);
      });
      return acc;
    }, {});

    return {
      totalRevenue,
      aov,
      totalOrders: orders.length,
      activeUsers,
      adminCount,
      totalStock,
      lowStockItems,
      statusCounts,
      categorySales,
      users,
      orders
    };
  }, [usersSnap, productsSnap, ordersSnap]);

  /* ---------------- CHART DATA ---------------- */
  const orderStatusData = useMemo(() => {
    if (!metrics) return null;
    const labels = Object.keys(metrics.statusCounts);
    const data = Object.values(metrics.statusCounts);
    return {
      labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      datasets: [{
        data,
        backgroundColor: ["#fbbf24", "#3b82f6", "#6366f1", "#10b981", "#ef4444"],
        borderWidth: 0,
      }]
    };
  }, [metrics]);

  const categorySalesData = useMemo(() => {
    if (!metrics) return null;
    return {
      labels: Object.keys(metrics.categorySales),
      datasets: [{
        label: "Revenue (EGP)",
        data: Object.values(metrics.categorySales),
        backgroundColor: "#6366f1",
        borderRadius: 8,
      }]
    };
  }, [metrics]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#1a1b23]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Preparing insights...</p>
      </div>
    </div>
  );

  return (
    <main className="p-8 bg-[#f9fafb] min-h-screen dark:bg-[#1a1b23] dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2 bg-indigo-600 rounded-xl text-white">📊</span>
            Professional Analytics
          </h1>
          <p className="text-gray-500 mt-2 text-sm dark:text-gray-400">Comprehensive overview of your store's performance and growth.</p>
        </header>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <AnalyticsCard 
            title="Total Revenue" 
            value={`${metrics?.totalRevenue.toLocaleString()} EGP`} 
            color="emerald" 
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            trend="up"
            trendValue="12.5%"
          />
          <AnalyticsCard 
            title="Average Order" 
            value={`${Math.round(metrics?.aov || 0).toLocaleString()} EGP`} 
            color="indigo" 
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
          />
          <AnalyticsCard 
            title="Active Users" 
            value={metrics?.activeUsers} 
            color="blue" 
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          />
          <AnalyticsCard 
            title="Low Stock" 
            value={metrics?.lowStockItems} 
            color="rose" 
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          />
        </div>

        {/* CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* REVENUE BY CATEGORY */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 dark:bg-[#1a1b23] dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Revenue by Category</h3>
            <div className="h-80">
              {categorySalesData && <Bar data={categorySalesData} options={{ maintainAspectRatio: false }} />}
            </div>
          </div>

          {/* ORDER STATUS */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 dark:bg-[#1a1b23] dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Order Success Rate</h3>
            <div className="h-80 flex items-center justify-center">
              {orderStatusData && <Pie data={orderStatusData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />}
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* USER GROWTH */}
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 dark:bg-[#1a1b23] dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">User Acquisition</h3>
            <div className="w-full">
               <LineChart users={metrics?.users} />
            </div>
          </div>

          {/* RECENT ACITIVITY SUMMARY */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 dark:bg-[#1a1b23] dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Key Performance Highlights</h3>
            <ul className="space-y-4">
              <li className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl dark:bg-gray-800/50">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders Fulfilled</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{metrics?.statusCounts.delivered || 0}</span>
              </li>
              <li className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl dark:bg-gray-800/50">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancellation Rate</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {Math.round(((metrics?.statusCounts.cancelled || 0) / (metrics?.totalOrders || 1)) * 100)}%
                </span>
              </li>
              <li className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl dark:bg-gray-800/50">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Admin-to-User Ratio</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  1:{Math.round(metrics?.activeUsers / (metrics?.adminCount || 1))}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
