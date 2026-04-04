"use client";

import { useState, useMemo } from "react";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "../../firebaseConfig";
import RoleGuard from "../../components/RoleGuard";
import Image from "next/image";
import Link from "next/link";

export default function LeadsPage() {
    return (
        <RoleGuard allowedRoles={["admin"]}>
            <LeadsContent />
        </RoleGuard>
    );
}

function LeadsContent() {
    const [filter, setFilter] = useState("all"); // all, cart, view
    const [searchTerm, setSearchTerm] = useState("");

    // 1. Fetch leads
    const leadsQuery = query(collection(db, "leads"), orderBy("updatedAt", "desc"), limit(500));
    const [leadsSnap, leadsLoading] = useCollection(leadsQuery);

    // 2. Fetch products (minimal info for display)
    const productsQuery = query(collection(db, "products"), limit(500));
    const [productsSnap] = useCollection(productsQuery);

    const productsMap = useMemo(() => {
        if (!productsSnap) return {};
        const map = {};
        productsSnap.docs.forEach(d => {
            const data = d.data();
            map[d.id] = {
                title: data.title,
                image: data.images?.[0] || "/placeholder.png",
                price: data.variants?.[0]?.price || 0
            };
        });
        return map;
    }, [productsSnap]);

    const leads = useMemo(() => {
        if (!leadsSnap) return [];
        let list = leadsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            product: productsMap[doc.data().productId] || null
        }));

        // Filter by status (only pending)
        list = list.filter(l => l.status === 'pending');

        // Filter by type
        if (filter !== "all") {
            list = list.filter(l => l.lastActivity === filter);
        }

        // Search
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            list = list.filter(l =>
                l.email?.toLowerCase().includes(s) ||
                l.name?.toLowerCase().includes(s) ||
                l.product?.title?.toLowerCase().includes(s)
            );
        }

        return list;
    }, [leadsSnap, productsMap, filter, searchTerm]);

    if (leadsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-[#1a1b23]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <main className="p-4 md:p-8 bg-[#f9fafb] min-h-screen dark:bg-[#1a1b23] dark:text-white">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Retargeting Leads</h1>
                        <p className="text-gray-500 mt-1 dark:text-gray-400">Identify users who showed interest but haven't purchased yet.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 dark:bg-gray-800 dark:border-gray-700"
                        >
                            <option value="all">All Intentions</option>
                            <option value="cart">Abandoned Carts</option>
                            <option value="view">Product Interests</option>
                        </select>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by email, name or product..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 w-72 shadow-sm dark:bg-gray-800 dark:border-gray-700"
                            />
                            <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden dark:bg-gray-900/40 dark:border-gray-800">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 dark:bg-gray-800/50 dark:border-gray-700">
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Lead / Customer</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product Interest</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Intensity</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Last Active</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-gray-400">
                                        No active leads found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50/80 transition-colors dark:hover:bg-gray-800/40">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {lead.name || "Anonymous User"}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{lead.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {lead.product ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700">
                                                        <Image src={lead.product.image} alt="" fill className="object-cover" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                                                        {lead.product.title}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Product Removed</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {lead.lastActivity === 'cart' ? (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                                    🔥 Abandoned Cart
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                    👀 Interested
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                            {lead.updatedAt?.toDate().toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4 text-center">
                                            <Link
                                                href={`/offers?email=${encodeURIComponent(lead.email)}&pid=${lead.productId}&lid=${lead.id}`}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                                            >
                                                Send Offer
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
