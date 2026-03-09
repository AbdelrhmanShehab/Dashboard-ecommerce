"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

import RoleGuard from "../../components/RoleGuard";

export default function CustomersPage() {
    return (
        <RoleGuard allowedRoles={["admin", "editor"]}>
            <CustomersContent />
        </RoleGuard>
    );
}

function CustomersContent() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [orders, setOrders] = useState([]);
    const [fetchingOrders, setFetchingOrders] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState("totalSpent");
    const [sortDirection, setSortDirection] = useState("desc"); // desc by default for VIPs
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedOrders = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setOrders(fetchedOrders);
                setFetchingOrders(false);
            },
            (err) => {
                console.error("Error fetching orders:", err);
                setFetchingOrders(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const customersList = useMemo(() => {
        const customerMap = {};

        orders.forEach((order) => {
            // Find the email in customer object or fallback
            const email = order.customer?.email?.toLowerCase() || "guest@unknown.com";
            if (!customerMap[email]) {
                customerMap[email] = {
                    email: email,
                    name: `${order.delivery?.firstName || ""} ${order.delivery?.lastName || ""}`.trim(),
                    phone: order.delivery?.phone || "",
                    totalSpent: 0,
                    purchaseHistory: [],
                    lastOrderDate: order.createdAt?.toDate() || null,
                };
            } else {
                // If we found an older order, let's update name and phone if current mapped is empty
                if (!customerMap[email].name) {
                    customerMap[email].name = `${order.delivery?.firstName || ""} ${order.delivery?.lastName || ""}`.trim();
                }
                if (!customerMap[email].phone) {
                    customerMap[email].phone = order.delivery?.phone || "";
                }

                // Update last order date if this order is strictly newer
                const currentOrderDate = order.createdAt?.toDate();
                if (currentOrderDate && customerMap[email].lastOrderDate) {
                    if (currentOrderDate > customerMap[email].lastOrderDate) {
                        customerMap[email].lastOrderDate = currentOrderDate;
                    }
                } else if (currentOrderDate && !customerMap[email].lastOrderDate) {
                    customerMap[email].lastOrderDate = currentOrderDate;
                }
            }

            // Add spending (only if order isn't cancelled)
            if (order.status !== "cancelled") {
                customerMap[email].totalSpent += order.totals?.total || 0;
            }

            // Push history
            customerMap[email].purchaseHistory.push(order);
        });

        return Object.values(customerMap);
    }, [orders]);

    const filteredAndSortedCustomers = useMemo(() => {
        let list = customersList;

        if (searchTerm.trim() !== "") {
            const term = searchTerm.toLowerCase();
            list = list.filter((c) =>
                c.name.toLowerCase().includes(term) ||
                c.email.includes(term) ||
                c.phone.includes(term)
            );
        }

        list.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            if (sortField === "lastOrderDate") {
                aVal = aVal ? aVal.getTime() : 0;
                bVal = bVal ? bVal.getTime() : 0;
            }
            if (sortField === "orderCount") {
                aVal = a.purchaseHistory.length;
                bVal = b.purchaseHistory.length;
            }

            if (typeof aVal === "string") {
                return sortDirection === "asc"
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            } else {
                return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
            }
        });

        return list;
    }, [customersList, searchTerm, sortField, sortDirection]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDirection("desc"); // Default to desc when clicking a new field (best for numbers/dates)
        }
    };

    return (
        <main className="p-4 md:p-8 bg-[#f9fafb] min-h-screen dark:bg-[#1a1b23] dark:text-white">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
                        <p className="text-gray-500 mt-1 text-sm dark:text-gray-400">Manage customers, view VIPs, and track purchase histories.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 w-64 shadow-sm transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            />
                            <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto dark:bg-[#1a1b23] dark:border-gray-800">
                    <table className="w-full min-w-[800px] text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                                <th
                                    className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    onClick={() => handleSort("name")}
                                >
                                    Customer {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th
                                    className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    onClick={() => handleSort("orderCount")}
                                >
                                    Orders {sortField === "orderCount" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th
                                    className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    onClick={() => handleSort("totalSpent")}
                                >
                                    Total Spent {sortField === "totalSpent" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th
                                    className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    onClick={() => handleSort("lastOrderDate")}
                                >
                                    Last Order {sortField === "lastOrderDate" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {fetchingOrders ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
                                            <span>Loading customers...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAndSortedCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-gray-400">
                                        No customers found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedCustomers.map((customer) => (
                                    <tr
                                        key={customer.email}
                                        onClick={() => setSelectedCustomer(customer)}
                                        className="group hover:bg-gray-50/80 cursor-pointer transition-colors dark:hover:bg-gray-800"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold flex-shrink-0">
                                                    {customer.name ? customer.name.charAt(0).toUpperCase() : "?"}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {customer.name || "Unknown"}
                                                        {customer.totalSpent > 10000 && ( // Threshold for VIP badge
                                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                                                ★ VIP
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</span>
                                                    {customer.phone && <span className="text-xs text-gray-400 dark:text-gray-500">{customer.phone}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                                            {customer.purchaseHistory.length} orders
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-900 dark:text-white">
                                            {customer.totalSpent.toLocaleString()} EGP
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                            {customer.lastOrderDate
                                                ? customer.lastOrderDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                                : "Never"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================== CUSTOMER DETAILS MODAL ================== */}
            {selectedCustomer && (
                <CustomerProfileModal
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                />
            )}
        </main>
    );
}

function CustomerProfileModal({ customer, onClose }) {
    // Sort purchase history desc by date
    const sortedHistory = [...customer.purchaseHistory].sort((a, b) => {
        const d1 = a.createdAt?.toDate() || 0;
        const d2 = b.createdAt?.toDate() || 0;
        return d2 - d1;
    });

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] dark:bg-[#1a1b23] dark:border dark:border-gray-800">

                {/* MODAL HEADER */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer Profile</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COL: PROFILE SUMMARY */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl border border-gray-100 dark:bg-gray-900/50 dark:border-gray-800">
                            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-4xl mb-4 shadow-inner dark:bg-indigo-900/40 dark:text-indigo-400">
                                {customer.name ? customer.name.charAt(0).toUpperCase() : "?"}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 text-center dark:text-white">{customer.name}</h3>
                            <p className="text-sm text-gray-500 mb-1 text-center dark:text-gray-400">{customer.email}</p>
                            <p className="text-sm text-gray-500 text-center dark:text-gray-400">{customer.phone}</p>

                            {customer.totalSpent > 10000 && (
                                <div className="mt-4 px-4 py-1.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    VIP Customer
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30">
                                <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1 dark:text-emerald-500">Total Spent</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{customer.totalSpent.toLocaleString()} EGP</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30">
                                <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1 dark:text-blue-500">Total Orders</p>
                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{customer.purchaseHistory.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COL: PURCHASE HISTORY */}
                    <div className="lg:col-span-2 flex flex-col">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Purchase History</h3>

                        <div className="border border-gray-100 rounded-xl overflow-hidden flex-1 dark:border-gray-800">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left bg-white dark:bg-[#1a1b23]">
                                    <thead>
                                        <tr className="bg-gray-50/80 border-b border-gray-100 dark:bg-gray-800/80 dark:border-gray-700">
                                            <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                                            <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                            <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                                            <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                                        {sortedHistory.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-800/40">
                                                <td className="p-3">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">#{order.id.slice(0, 8).toUpperCase()}</span>
                                                    <div className="text-[10px] text-gray-400 mt-0.5">{order.items.length} items</div>
                                                </td>
                                                <td className="p-3 text-sm text-gray-500 dark:text-gray-400">
                                                    {order.createdAt?.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-3 text-sm font-bold text-gray-900 dark:text-white">
                                                    {(order.totals?.total || 0).toLocaleString()} EGP
                                                </td>
                                                <td className="p-3 text-center">
                                                    <StatusBadge status={order.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const colors = {
        pending: "bg-amber-50 text-amber-700 border-amber-100",
        confirmed: "bg-blue-50 text-blue-700 border-blue-100",
        shipped: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800",
        delivered: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800",
        cancelled: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-800",
    };

    return (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${colors[status] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
            {status}
        </span>
    );
}
