"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import format from "date-fns/format";

import RoleGuard from "../../components/RoleGuard";

export default function ActivityLogsPage() {
    return (
        <RoleGuard allowedRoles={["admin"]}>
            <ActivityContent />
        </RoleGuard>
    );
}

function ActivityContent() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [logs, setLogs] = useState([]);
    const [fetchingLogs, setFetchingLogs] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        // Fetch last 100 activity logs
        const q = query(
            collection(db, "activity_logs"),
            orderBy("timestamp", "desc"),
            limit(100)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedLogs = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setLogs(fetchedLogs);
                setFetchingLogs(false);
            },
            (err) => {
                console.error("Error fetching logs:", err);
                setFetchingLogs(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const getActionColor = (action) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes("create") || actionLower.includes("add")) {
            return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
        }
        if (actionLower.includes("delete") || actionLower.includes("remove") || actionLower.includes("cancel")) {
            return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800";
        }
        if (actionLower.includes("update") || actionLower.includes("edit")) {
            return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
        }
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    };

    return (
        <main className="p-4 md:p-8 bg-[#f9fafb] min-h-screen dark:bg-[#1a1b23] dark:text-white">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
                    <p className="text-gray-500 mt-1 text-sm dark:text-gray-400">
                        Audit trail of administrative actions across the application.
                    </p>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden dark:bg-[#1a1b23] dark:border-gray-800">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 dark:bg-gray-800/80 dark:border-gray-700">
                                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin User</th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/2">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                                {fetchingLogs ? (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
                                                <span>Loading audit trail...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center text-gray-400">
                                            No activity logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-800/40">
                                            <td className="p-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {log.timestamp ? format(log.timestamp.toDate(), "dd MMM yyyy, HH:mm") : "Just now"}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-bold dark:bg-gray-700 dark:text-gray-300">
                                                        {log.user?.email?.charAt(0).toUpperCase() || "?"}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {log.user?.email || "Unknown User"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold tracking-wide border ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                                <div>{log.details}</div>

                                                {/* RENDER DETAILED CHANGES IF AVAILABLE */}
                                                {log.changes && Object.keys(log.changes).length > 0 && (
                                                    <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700 text-xs shadow-inner">
                                                        <span className="font-semibold text-gray-500 uppercase tracking-widest text-[10px] mb-2 block dark:text-gray-400">Changed Fields</span>
                                                        <div className="space-y-1.5 overflow-hidden">
                                                            {Object.entries(log.changes).map(([field, diff]) => (
                                                                <div key={field} className="grid grid-cols-[100px_1fr] gap-2 items-start">
                                                                    <span className="font-medium text-gray-500 capitalize dark:text-gray-400">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                                                    <div className="flex flex-wrap items-center gap-2 font-mono">
                                                                        <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded truncate max-w-[200px] dark:bg-rose-900/30 dark:text-rose-300 line-through decoration-rose-400/50">
                                                                            {String(diff.from === "" || diff.from == null ? "(empty)" : diff.from)}
                                                                        </span>
                                                                        <span className="text-gray-400 dark:text-gray-500">→</span>
                                                                        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded truncate max-w-[200px] dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
                                                                            {String(diff.to === "" || diff.to == null ? "(empty)" : diff.to)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
