"use client";

import { useState, useEffect, useMemo } from "react";
import {
    collection,
    onSnapshot,
    query,
    limit,
    getDocs,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Image from "next/image";
import RoleGuard from "../../components/RoleGuard";

export default function ProductStatsPage() {
    return (
        <RoleGuard allowedRoles={["admin"]}>
            <ProductStatsContent />
        </RoleGuard>
    );
}

/* ─────────────────────────────── helpers ─────────────────────────────── */

const fmtNum = (n) =>
    typeof n === "number" ? n.toLocaleString() : "—";

const fmtEGP = (n) =>
    typeof n === "number" ? `${n.toLocaleString()} EGP` : "—";

const convRate = (num, den) =>
    den > 0 ? Math.round((num / den) * 100) : 0;

const rateColor = (rate) =>
    rate >= 10
        ? "text-emerald-600 dark:text-emerald-400"
        : rate >= 5
            ? "text-amber-500 dark:text-amber-400"
            : "text-rose-500 dark:text-rose-400";

const rateBadge = (rate) =>
    rate >= 10
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : rate >= 5
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";

/* ─────────────────────────────── main component ─────────────────────── */

function ProductStatsContent() {
    const [stats, setStats] = useState([]);       // merged productStats + product info
    const [products, setProducts] = useState({}); // id -> { title, images, category }
    const [loading, setLoading] = useState(true);

    // UI state
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [sortKey, setSortKey] = useState("revenue");
    const [sortDir, setSortDir] = useState("desc");

    /* ── fetch products once (for names/images) ── */
    useEffect(() => {
        const fetchProducts = async () => {
            const snap = await getDocs(collection(db, "products"));
            const map = {};
            snap.docs.forEach((d) => {
                const data = d.data();
                map[d.id] = {
                    title: data.title || "Untitled Product",
                    image: (data.images || [])[0] || null,
                    category: data.category || "Uncategorized",
                };
            });
            setProducts(map);
        };
        fetchProducts();
    }, []);

    /* ── real-time subscription to productStats ── */
    useEffect(() => {
        const q = query(collection(db, "productStats"), limit(300));
        const unsub = onSnapshot(q, (snap) => {
            const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setStats(rows);
            setLoading(false);
        }, (err) => {
            console.error("productStats subscription error:", err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    /* ── merge stats with product info ── */
    const merged = useMemo(() => {
        return stats.map((s) => {
            const p = products[s.id] || {};
            return {
                ...s,
                title: p.title || s.id,
                image: p.image || null,
                category: p.category || "Uncategorized",
                clicks: s.clicks || 0,
                views: s.views || 0,
                cartAdds: s.cartAdds || 0,
                purchases: s.purchases || 0,
                revenue: s.revenue || 0,
            };
        });
    }, [stats, products]);

    /* ── derived data ── */
    const categories = useMemo(() => {
        const set = new Set(merged.map((r) => r.category));
        return ["All", ...Array.from(set).sort()];
    }, [merged]);

    const totals = useMemo(() => ({
        clicks: merged.reduce((a, r) => a + r.clicks, 0),
        views: merged.reduce((a, r) => a + r.views, 0),
        cartAdds: merged.reduce((a, r) => a + r.cartAdds, 0),
        purchases: merged.reduce((a, r) => a + r.purchases, 0),
        revenue: merged.reduce((a, r) => a + r.revenue, 0),
    }), [merged]);

    const filtered = useMemo(() => {
        let rows = merged;
        if (category !== "All") rows = rows.filter((r) => r.category === category);
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(
                (r) =>
                    r.title.toLowerCase().includes(q) ||
                    r.category.toLowerCase().includes(q)
            );
        }
        rows = [...rows].sort((a, b) => {
            const av = a[sortKey] ?? 0;
            const bv = b[sortKey] ?? 0;
            return sortDir === "desc" ? bv - av : av - bv;
        });
        return rows;
    }, [merged, search, category, sortKey, sortDir]);

    const handleSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
        else { setSortKey(key); setSortDir("desc"); }
    };

    const SortIcon = ({ k }) =>
        sortKey !== k ? (
            <span className="text-gray-300 dark:text-gray-600 ml-1">⇅</span>
        ) : (
            <span className="ml-1 text-indigo-500">{sortDir === "desc" ? "↓" : "↑"}</span>
        );

    /* ── loading ── */
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center dark:bg-[#1a1b23]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading product stats…</p>
            </div>
        </div>
    );

    /* ─────────────────────────────────────────── RENDER ─── */
    return (
        <main className="p-6 md:p-8 bg-[#f9fafb] min-h-screen dark:bg-[#1a1b23] dark:text-white transition-colors duration-300">
            <div className="max-w-7xl mx-auto">

                {/* ── PAGE HEADER ── */}
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="p-2.5 bg-indigo-600 rounded-xl text-white text-xl">📈</span>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                            Product Stats
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Real-time engagement metrics: clicks, views, cart adds, purchases & revenue per product.
                    </p>
                </header>

                {/* ── KPI SUMMARY CARDS ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: "Total Clicks", value: fmtNum(totals.clicks), icon: "", color: "bg-blue-50   dark:bg-blue-900/20", text: "text-blue-600   dark:text-blue-400" },
                        { label: "Total Views", value: fmtNum(totals.views), icon: "", color: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400" },
                        { label: "Cart Adds", value: fmtNum(totals.cartAdds), icon: "", color: "bg-amber-50  dark:bg-amber-900/20", text: "text-amber-600  dark:text-amber-400" },
                        { label: "Purchases", value: fmtNum(totals.purchases), icon: "", color: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
                        { label: "Total Revenue", value: fmtEGP(totals.revenue), icon: "", color: "bg-rose-50   dark:bg-rose-900/20", text: "text-rose-600   dark:text-rose-400" },
                    ].map(({ label, value, icon, color, text }) => (
                        <div
                            key={label}
                            className={`${color} rounded-2xl p-4 border border-white/60 dark:border-gray-800 shadow-sm`}
                        >
                            <p className="text-2xl mb-1">{icon}</p>
                            <p className={`text-xl font-bold ${text}`}>{value}</p>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>

                {/* ── FILTERS ── */}
                <div className="bg-white dark:bg-[#1a1b23] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* search */}
                    <div className="relative flex-1 min-w-0">
                        <svg
                            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by product name or category…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-white"
                        />
                    </div>

                    {/* category */}
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-white"
                    >
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <span className="text-xs text-gray-400 whitespace-nowrap self-center">
                        {filtered.length} product{filtered.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* ── STATS TABLE ── */}
                {stats.length === 0 ? (
                    <EmptyState />
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a1b23] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-16 text-center">
                        <p className="text-4xl mb-3">🔍</p>
                        <p className="text-gray-500 dark:text-gray-400">No products match your search.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#1a1b23] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                                            Product
                                        </th>
                                        <th className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Category
                                        </th>
                                        {[
                                            { key: "views", label: "Views" },
                                            { key: "clicks", label: "Clicks" },
                                            { key: "cartAdds", label: "Cart Adds" },
                                            { key: "purchases", label: "Purchases" },
                                            { key: "revenue", label: "Revenue" },
                                        ].map(({ key, label }) => (
                                            <th
                                                key={key}
                                                onClick={() => handleSort(key)}
                                                className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap"
                                            >
                                                {label}<SortIcon k={key} />
                                            </th>
                                        ))}
                                        <th className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                            Conversion
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                                    {filtered.map((row) => {
                                        const clickRate = convRate(row.clicks, row.views);
                                        const cartRate = convRate(row.cartAdds, row.views);
                                        const buyRate = convRate(row.purchases, row.cartAdds);
                                        return (
                                            <tr
                                                key={row.id}
                                                className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors"
                                            >
                                                {/* image */}
                                                <td className="p-4">
                                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                                                        {row.image ? (
                                                            <Image
                                                                src={row.image}
                                                                alt={row.title}
                                                                fill
                                                                className="object-cover"
                                                                sizes="40px"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <span className="flex items-center justify-center h-full text-gray-400 text-lg">📦</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* title */}
                                                <td className="p-4">
                                                    <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                                        {row.title}
                                                    </p>
                                                    <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[140px]">
                                                        {row.id}
                                                    </p>
                                                </td>

                                                {/* category */}
                                                <td className="p-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                        {row.category}
                                                    </span>
                                                </td>

                                                {/* numeric metrics */}
                                                <td className="p-4 font-semibold text-indigo-600 dark:text-indigo-400">{fmtNum(row.views)}</td>
                                                <td className="p-4 font-semibold text-blue-600 dark:text-blue-400">{fmtNum(row.clicks)}</td>
                                                <td className="p-4 font-semibold text-amber-600 dark:text-amber-400">{fmtNum(row.cartAdds)}</td>
                                                <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400">{fmtNum(row.purchases)}</td>
                                                <td className="p-4 font-bold text-gray-900 dark:text-white">{fmtEGP(row.revenue)}</td>

                                                {/* conversion funnel */}
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1 min-w-[180px]">
                                                        <FunnelStep
                                                            label="View→Click"
                                                            rate={clickRate}
                                                        />
                                                        <FunnelStep
                                                            label="View→Cart"
                                                            rate={cartRate}
                                                        />
                                                        <FunnelStep
                                                            label="Cart→Buy"
                                                            rate={buyRate}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

/* ── Funnel step row ── */
function FunnelStep({ label, rate }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-[70px] shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${rate >= 10 ? "bg-emerald-500" : rate >= 5 ? "bg-amber-400" : "bg-rose-400"
                        }`}
                    style={{ width: `${Math.min(rate, 100)}%` }}
                />
            </div>
            <span className={`text-xs font-bold w-8 text-right ${rateColor(rate)}`}>
                {rate}%
            </span>
        </div>
    );
}

/* ── Empty state ── */
function EmptyState() {
    return (
        <div className="bg-white dark:bg-[#1a1b23] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
            <p className="text-6xl">📊</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                No product stats yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md text-sm leading-relaxed">
                The <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">productStats</code> collection
                is empty. Start tracking events from your storefront using the{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">trackEvent()</code> utility,
                or manually create a document in Firebase Console to test the UI.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left w-full max-w-md mt-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Example document shape
                </p>
                <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 leading-relaxed">
                    {`productStats / {productId}
  clicks    : 0
  views     : 0
  cartAdds  : 0
  purchases : 0
  revenue   : 0`}
                </pre>
            </div>
        </div>
    );
}
