"use client";

import { useState, useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import RoleGuard from "../../components/RoleGuard";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title
);

export default function FinancePage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <FinanceContent />
    </RoleGuard>
  );
}

/* ─── CONSTANTS ─────────────────────────────────────────── */
const EXPENSE_CATEGORIES = [
  "Marketing",
  "Packaging",
  "Shipping Costs",
  "Suppliers / Inventory",
  "Website / Tools",
  "Operations",
  "Personal",
];

const CATEGORY_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#8b5cf6", "#ec4899",
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ─── HELPERS ───────────────────────────────────────────── */
function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key) {
  const [year, month] = key.split("-");
  return `${MONTHS[parseInt(month) - 1]} ${year}`;
}

function getLast6MonthKeys() {
  const keys = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(getMonthKey(d));
  }
  return keys;
}

function getCurrentMonthKey() {
  const now = new Date();
  return getMonthKey(now);
}

/* ─── MAIN CONTENT ──────────────────────────────────────── */
function FinanceContent() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview | expenses

  const [ordersSnap, ordersLoading] = useCollection(
    query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(1000))
  );
  const [expensesSnap, expensesLoading] = useCollection(
    query(collection(db, "expenses"), orderBy("createdAt", "desc"), limit(1000))
  );

  const loading = ordersLoading || expensesLoading;

  /* ─── CALCULATIONS ────────────────────────────────────── */
  const { metrics, last6Keys } = useMemo(() => {
    const last6Keys = getLast6MonthKeys();
    const thisMonth = getCurrentMonthKey();

    if (!ordersSnap || !expensesSnap) {
      return { metrics: null, last6Keys };
    }

    // Parse orders
    const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const validOrders = orders.filter(
      (o) => o.status !== "cancelled" && o.status !== "payment_rejected"
    );

    // Revenue helpers
    const getOrderDate = (o) =>
      o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt?.seconds * 1000 || 0);

    // This month
    const thisMonthOrders = validOrders.filter(
      (o) => getMonthKey(getOrderDate(o)) === thisMonth
    );
    // --- REAL REVENUE CALCULATION ---
    // 1. Deposits Received (Verified Instapay/Verified Cash Deposit)
    const depositsReceived = thisMonthOrders
      .filter((o) => o.payment?.paid)
      .reduce((s, o) => s + (o.payment?.depositAmount || 0), 0);

    // 2. Final Balances Received (Total - Deposit)
    const finalBalancesReceived = thisMonthOrders
      .filter((o) => o.payment?.fullyPaid)
      .reduce((s, o) => s + ((o.totals?.total || 0) - (o.payment?.depositAmount || 0)), 0);

    const realRevenueCollected = depositsReceived + finalBalancesReceived;

    // --- PENDING REVENUE CALCULATION ---
    // "Pending from Shipping" = Delivered orders NOT yet fully paid
    const cashPendingThisMonth = thisMonthOrders
      .filter((o) => o.status === "delivered" && !o.payment?.fullyPaid)
      .reduce((s, o) => s + ((o.totals?.total || 0) - (o.payment?.depositAmount || 0)), 0);

    // Legacy/Comparison metric: Total potential revenue if all delivered orders are paid
    const totalPotentialRevenue = thisMonthOrders.reduce((s, o) => s + (o.totals?.total || 0), 0);

    // Revenue per month (last 6)
    const revenueByMonth = {};
    last6Keys.forEach((k) => (revenueByMonth[k] = 0));
    validOrders.forEach((o) => {
      const k = getMonthKey(getOrderDate(o));
      if (revenueByMonth[k] !== undefined) {
        revenueByMonth[k] += o.totals?.total || 0;
      }
    });

    // Parse expenses
    const expenses = expensesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const expensesThisMonth = expenses.filter(
      (e) => e.date && e.date.startsWith(thisMonth)
    );
    const totalExpensesThisMonth = expensesThisMonth.reduce((s, e) => s + (e.cost || 0), 0);
    const profitThisMonth = realRevenueCollected - totalExpensesThisMonth;

    // Expenses per month (last 6)
    const expensesByMonth = {};
    last6Keys.forEach((k) => (expensesByMonth[k] = 0));
    expenses.forEach((e) => {
      if (!e.date) return;
      const k = e.date.slice(0, 7); // YYYY-MM
      if (expensesByMonth[k] !== undefined) {
        expensesByMonth[k] += e.cost || 0;
      }
    });

    // Profit per month
    const profitByMonth = {};
    last6Keys.forEach((k) => {
      profitByMonth[k] = (revenueByMonth[k] || 0) - (expensesByMonth[k] || 0);
    });

    // Expense distribution by category
    const expenseByCategory = {};
    expenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + (e.cost || 0);
    });

    // Last month comparison for insights
    const now = new Date();
    const lastMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const lastMonthRevenue = revenueByMonth[lastMonthKey] || 0;
    const lastMonthExpenses = expensesByMonth[lastMonthKey] || 0;

    // Monthly reports last 6
    const monthlyReports = last6Keys.map((k) => ({
      key: k,
      label: getMonthLabel(k),
      revenue: revenueByMonth[k] || 0,
      expenses: expensesByMonth[k] || 0,
      profit: profitByMonth[k] || 0,
    }));

    return {
      metrics: {
        realRevenueCollected,
        depositsReceived,
        finalBalancesReceived,
        cashPendingThisMonth,
        totalPotentialRevenue,
        totalExpensesThisMonth,
        profitThisMonth,
        revenueByMonth,
        expensesByMonth,
        profitByMonth,
        expenseByCategory,
        expenses,
        lastMonthRevenue,
        lastMonthExpenses,
        monthlyReports,
      },
      last6Keys,
    };
  }, [ordersSnap, expensesSnap]);

  /* ─── CHART DATA ──────────────────────────────────────── */
  const revenueChartData = useMemo(() => {
    if (!metrics) return null;
    return {
      labels: last6Keys.map(getMonthLabel),
      datasets: [{
        label: "Revenue (EGP)",
        data: last6Keys.map((k) => metrics.revenueByMonth[k] || 0), // Keeping potential revenue for trends
        fill: true,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.12)",
        borderWidth: 3,
        pointBackgroundColor: "#6366f1",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.4,
      }],
    };
  }, [metrics, last6Keys]);

  const expensePieData = useMemo(() => {
    if (!metrics) return null;
    const cats = Object.keys(metrics.expenseByCategory);
    if (cats.length === 0) return null;
    return {
      labels: cats,
      datasets: [{
        data: cats.map((c) => metrics.expenseByCategory[c]),
        backgroundColor: CATEGORY_COLORS.slice(0, cats.length),
        borderWidth: 0,
      }],
    };
  }, [metrics]);

  const profitChartData = useMemo(() => {
    if (!metrics) return null;
    return {
      labels: last6Keys.map(getMonthLabel),
      datasets: [{
        label: "Profit (EGP)",
        data: last6Keys.map((k) => metrics.profitByMonth[k] || 0),
        backgroundColor: last6Keys.map((k) =>
          (metrics.profitByMonth[k] || 0) >= 0
            ? "rgba(16,185,129,0.85)"
            : "rgba(239,68,68,0.85)"
        ),
        borderRadius: 10,
      }],
    };
  }, [metrics, last6Keys]);

  /* ─── INSIGHTS ────────────────────────────────────────── */
  const insights = useMemo(() => {
    if (!metrics) return [];
    const list = [];
    const { realRevenueCollected: revenueThisMonth, lastMonthRevenue, totalExpensesThisMonth, lastMonthExpenses, expenseByCategory } = metrics;

    // Revenue trend
    if (lastMonthRevenue > 0) {
      const diff = ((revenueThisMonth - lastMonthRevenue) / lastMonthRevenue) * 100;
      if (diff > 0) list.push({ icon: "📈", text: `Revenue increased by ${Math.abs(diff).toFixed(1)}% compared to last month.`, color: "emerald" });
      else if (diff < 0) list.push({ icon: "📉", text: `Revenue decreased by ${Math.abs(diff).toFixed(1)}% compared to last month.`, color: "rose" });
      else list.push({ icon: "➡️", text: "Revenue is the same as last month.", color: "gray" });
    } else if (revenueThisMonth > 0) {
      list.push({ icon: "🚀", text: "First revenue recorded this month!", color: "emerald" });
    }

    // Expense trend
    if (lastMonthExpenses > 0) {
      const diff = ((totalExpensesThisMonth - lastMonthExpenses) / lastMonthExpenses) * 100;
      if (diff > 10) list.push({ icon: "⚠️", text: `Expenses increased by ${diff.toFixed(1)}% this month.`, color: "amber" });
      else if (diff < -10) list.push({ icon: "✂️", text: `Expenses decreased by ${Math.abs(diff).toFixed(1)}% — good cost control!`, color: "emerald" });
    }

    // Top spending category
    const topCat = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      list.push({ icon: "💸", text: `Largest expense category: ${topCat[0]} (${topCat[1].toLocaleString()} EGP).`, color: "indigo" });
    }

    // Profit health
    if (metrics.profitThisMonth < 0) {
      list.push({ icon: "🔴", text: "This month is operating at a loss. Review expenses.", color: "rose" });
    } else if (metrics.profitThisMonth > 0) {
      list.push({ icon: "💚", text: `Profitable month! Net profit is ${metrics.profitThisMonth.toLocaleString()} EGP.`, color: "emerald" });
    }

    return list.slice(0, 4);
  }, [metrics]);

  /* ─── DELETE EXPENSE ──────────────────────────────────── */
  const deleteExpense = async (id) => {
    if (!confirm("Delete this expense?")) return;
    setDeletingId(id);
    try {
      await fetch("/api/finance/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (e) {
      alert("Failed to delete expense.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ─── CHART OPTIONS ───────────────────────────────────── */
  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1a1b23", padding: 12, cornerRadius: 10 } },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" }, ticks: { callback: (v) => `${(v/1000).toFixed(0)}k` } },
      x: { grid: { display: false } },
    },
  };

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1a1b23", padding: 12, cornerRadius: 10 } },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" }, ticks: { callback: (v) => `${(v/1000).toFixed(0)}k` } },
      x: { grid: { display: false } },
    },
  };

  const pieOpts = { plugins: { legend: { position: "bottom", labels: { padding: 16, font: { size: 11 } } } }, maintainAspectRatio: false };

  /* ─── COLOUR HELPERS ─────────────────────────────────── */
  const insightColors = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300",
    rose: "bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300",
    amber: "bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300",
    gray: "bg-gray-50 border-gray-100 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300",
  };

  /* ─── RENDER ──────────────────────────────────────────── */
  return (
    <main className="p-4 md:p-8 bg-[#f9fafb] min-h-screen dark:bg-[#1a1b23] dark:text-white">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="p-2 bg-emerald-600 rounded-xl text-white text-xl">💰</span>
              Finance
            </h1>
            <p className="text-gray-500 mt-1 text-sm dark:text-gray-400">
              Revenue, expenses, and profit — all in one place.
            </p>
          </div>
          {/* TABS */}
          <div className="flex gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
            {["overview", "expenses"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            <p className="text-gray-400 text-sm">Loading financial data…</p>
          </div>
        ) : activeTab === "overview" ? (
          <>
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <KpiCard label="Real Revenue Received" value={metrics?.realRevenueCollected} color="indigo" icon="💰" note="Verified Deposits + Final Payments" />
              <KpiCard label="Deposits Received" value={metrics?.depositsReceived} color="emerald" icon="✅" note="Verified partial payments" />
              <KpiCard label="Pending from Shipping" value={metrics?.cashPendingThisMonth} color="amber" icon="🚚" note="Remaining balance of delivered orders" />
              <KpiCard label="Net Profit This Month" value={metrics?.realRevenueCollected - (metrics?.totalExpensesThisMonth || 0)} color={(metrics?.realRevenueCollected - (metrics?.totalExpensesThisMonth || 0)) >= 0 ? "emerald" : "rose"} icon="📊" note={`Expenses: ${(metrics?.totalExpensesThisMonth || 0).toLocaleString()} EGP`} />
            </div>

            {/* MONTHLY SUMMARY BANNER */}
            <div className="bg-white dark:bg-[#1a1b23] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-8 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">This Month at a Glance</h2>
              <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800">
                <SummaryFigure label="Real Received" value={metrics?.realRevenueCollected} color="indigo" />
                <SummaryFigure label="Expenses" value={metrics?.totalExpensesThisMonth} color="rose" />
                <SummaryFigure label="True Profit" value={metrics?.realRevenueCollected - (metrics?.totalExpensesThisMonth || 0)} color={(metrics?.realRevenueCollected - (metrics?.totalExpensesThisMonth || 0)) >= 0 ? "emerald" : "rose"} />
              </div>
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Revenue over time */}
              <div className="lg:col-span-2 bg-white dark:bg-[#1a1b23] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Revenue Over Time</h3>
                <p className="text-xs text-gray-400 mb-4">Last 6 months</p>
                <div className="h-64">
                  {revenueChartData ? (
                    <Line data={revenueChartData} options={lineOpts} />
                  ) : (
                    <EmptyChart label="No revenue data yet" />
                  )}
                </div>
              </div>

              {/* Expense distribution */}
              <div className="bg-white dark:bg-[#1a1b23] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Expense Distribution</h3>
                <p className="text-xs text-gray-400 mb-4">By category</p>
                <div className="h-64">
                  {expensePieData ? (
                    <Pie data={expensePieData} options={pieOpts} />
                  ) : (
                    <EmptyChart label="No expenses recorded yet" />
                  )}
                </div>
              </div>
            </div>

            {/* Profit Trend */}
            <div className="bg-white dark:bg-[#1a1b23] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-8 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Profit Trend</h3>
              <p className="text-xs text-gray-400 mb-4">Last 6 months — green = profit, red = loss</p>
              <div className="h-56">
                {profitChartData ? (
                  <Bar data={profitChartData} options={barOpts} />
                ) : (
                  <EmptyChart label="No data yet" />
                )}
              </div>
            </div>

            {/* MONTHLY REPORTS */}
            <div className="bg-white dark:bg-[#1a1b23] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm mb-8">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Monthly Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-left">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-gray-800/50">
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Month</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Revenue</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Expenses</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {[...(metrics?.monthlyReports || [])].reverse().map((row) => (
                      <tr key={row.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{row.label}</td>
                        <td className="px-6 py-4 text-sm text-right text-indigo-600 dark:text-indigo-400 font-bold">{row.revenue.toLocaleString()} <span className="text-gray-400 font-normal">EGP</span></td>
                        <td className="px-6 py-4 text-sm text-right text-rose-600 dark:text-rose-400 font-bold">{row.expenses.toLocaleString()} <span className="text-gray-400 font-normal">EGP</span></td>
                        <td className="px-6 py-4 text-sm text-right font-black">
                          <span className={row.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                            {row.profit >= 0 ? "+" : ""}{row.profit.toLocaleString()} EGP
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SMART INSIGHTS */}
            {insights.length > 0 && (
              <div className="bg-white dark:bg-[#1a1b23] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm mb-8">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4">💡 Smart Insights</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {insights.map((ins, i) => (
                    <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium ${insightColors[ins.color]}`}>
                      <span className="text-base flex-shrink-0">{ins.icon}</span>
                      <span>{ins.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ─── EXPENSE MANAGER TAB ─── */
          <ExpenseManager
            expenses={metrics?.expenses || []}
            user={user}
            deletingId={deletingId}
            onDelete={deleteExpense}
            onAdd={() => setShowAddModal(true)}
          />
        )}
      </div>

      {/* ADD EXPENSE MODAL */}
      {showAddModal && (
        <AddExpenseModal
          user={user}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </main>
  );
}

/* ─── KPI CARD ─────────────────────────────────────────── */
function KpiCard({ label, value, color, icon, note }) {
  const colorMap = {
    indigo: "from-indigo-500 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
  };
  return (
    <div className="bg-white dark:bg-[#1a1b23] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.indigo} flex items-center justify-center text-base`}>
          {icon}
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
        {(value ?? 0).toLocaleString()}
        <span className="text-base font-semibold text-gray-400 ml-1">EGP</span>
      </p>
      {note && <p className="text-[11px] text-gray-400 mt-1">{note}</p>}
    </div>
  );
}

/* ─── SUMMARY FIGURE ────────────────────────────────────── */
function SummaryFigure({ label, value, color }) {
  const colorMap = {
    indigo: "text-indigo-600 dark:text-indigo-400",
    rose: "text-rose-600 dark:text-rose-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
  };
  return (
    <div className="px-6 text-center first:pl-0 last:pr-0">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      <p className={`text-2xl font-extrabold ${colorMap[color]}`}>
        {(value ?? 0).toLocaleString()}
        <span className="text-sm ml-1 font-semibold text-gray-400">EGP</span>
      </p>
    </div>
  );
}

/* ─── EMPTY CHART ────────────────────────────────────────── */
function EmptyChart({ label }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
      <span className="text-3xl">📭</span>
      <p className="text-sm">{label}</p>
    </div>
  );
}

/* ─── EXPENSE MANAGER ────────────────────────────────────── */
function ExpenseManager({ expenses, user, deletingId, onDelete, onAdd }) {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = categoryFilter === "all"
    ? expenses
    : expenses.filter((e) => e.category === categoryFilter);

  const total = filtered.reduce((s, e) => s + (e.cost || 0), 0);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""} · <strong className="text-gray-900 dark:text-white">{total.toLocaleString()} EGP</strong>
          </span>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          Add Expense
        </button>
      </div>

      {/* Expense table */}
      <div className="bg-white dark:bg-[#1a1b23] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No expenses yet. Add your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Title</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Category</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Cost</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Note</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">{expense.title}</td>
                    <td className="px-5 py-4">
                      <CategoryBadge category={expense.category} />
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-rose-600 dark:text-rose-400 text-right">
                      {(expense.cost || 0).toLocaleString()} EGP
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {expense.date ? new Date(expense.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400 max-w-[200px] truncate">{expense.note || "—"}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => onDelete(expense.id)}
                        disabled={deletingId === expense.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-600 disabled:opacity-40 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      >
                        {deletingId === expense.id ? (
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CATEGORY BADGE ─────────────────────────────────────── */
function CategoryBadge({ category }) {
  const catColors = {
    "Marketing": "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    "Packaging": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "Shipping Costs": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "Suppliers / Inventory": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    "Website / Tools": "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "Operations": "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "Other": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${catColors[category] || catColors["Other"]}`}>
      {category}
    </span>
  );
}

/* ─── ADD EXPENSE MODAL ──────────────────────────────────── */
function AddExpenseModal({ user, onClose }) {
  const [form, setForm] = useState({
    title: "",
    category: EXPENSE_CATEGORIES[0],
    cost: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.cost || !form.date) {
      setError("Title, cost, and date are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cost: parseFloat(form.cost),
          user: { uid: user?.uid, email: user?.email },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.details || data?.error || `HTTP ${res.status}`);
      }
      onClose();
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1b23] border dark:border-gray-800 w-full max-w-md rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">Add Expense</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Title *</label>
            <input
              type="text"
              placeholder="e.g. Facebook Ads"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Cost (EGP) *</label>
              <input
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Note <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="Any additional details..."
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Saving…
                </>
              ) : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
