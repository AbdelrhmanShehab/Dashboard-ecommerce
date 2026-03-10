"use client";

import { useEffect, useMemo, memo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit, getCountFromServer } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

import RoleGuard from "../../components/RoleGuard";

export default function DashboardPage() {
  return (
    <RoleGuard allowedRoles={["admin", "editor"]}>
      <DashboardContent />
    </RoleGuard>
  );
}

function DashboardContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // KPI counts fetched via aggregation (cheap single reads)
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  /* ---------------- FETCH COUNTS (aggregation - very cheap) ---------------- */
  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      try {
        const [prodSnap, ordSnap] = await Promise.all([
          getCountFromServer(collection(db, "products")),
          getCountFromServer(collection(db, "orders")),
        ]);
        setTotalProducts(prodSnap.data().count);
        setTotalOrders(ordSnap.data().count);
      } catch (err) {
        console.error("Count fetch error:", err);
      }
    };
    fetchCounts();
  }, [user]);

  /* ---------------- FIRESTORE QUERIES (limited) ---------------- */
  const recentProductsQuery = query(
    collection(db, "products"),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  const recentOrdersQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  // Fetch all orders (limited to 200) for revenue + low stock KPIs
  const ordersForMetricsQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc"),
    limit(200)
  );

  const productsForMetricsQuery = query(
    collection(db, "products"),
    orderBy("createdAt", "desc"),
    limit(200)
  );

  // LIVE STATS QUERIES
  const livePresenceQuery = query(collection(db, "activePresence"), limit(500));
  const activeCartsQuery = query(collection(db, "leads"), limit(500));

  const [recentProductsSnap] = useCollection(recentProductsQuery);
  const [recentOrdersSnap] = useCollection(recentOrdersQuery);
  const [ordersSnap] = useCollection(ordersForMetricsQuery);
  const [productsSnap] = useCollection(productsForMetricsQuery);
  const [liveSnap] = useCollection(livePresenceQuery);
  const [leadsSnap] = useCollection(activeCartsQuery);

  /* ---------------- LOADING STATE ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  /* ---------------- METRICS (memoized) ---------------- */
  const revenue = ordersSnap?.docs.reduce(
    (sum, doc) => sum + (doc.data().totals?.total || 0),
    0
  ) ?? 0;

  const lowStockCount = productsSnap?.docs.filter((doc) => {
    const variants = doc.data().variants || [];
    const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    return totalStock > 0 && totalStock < 5;
  }).length ?? 0;

  // Real-time Live Counters
  const liveCount = liveSnap?.size || 0;
  const activeCartsCount = leadsSnap?.docs.filter(d => d.data().status === 'pending' && d.data().lastActivity === 'cart').length || 0;

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-8 py-10 dark:bg-[#1a1b23] dark:text-white">
      {/* HEADER */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-2 text-sm">Real-time store overview</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <DashboardCard title="Live Now" value={liveCount} highlighted={liveCount > 0} />
        <DashboardCard title="Active Carts" value={activeCartsCount} highlighted={activeCartsCount > 0} />
        <DashboardCard title="Products" value={totalProducts} />
        <DashboardCard title="Orders" value={totalOrders} />
        <DashboardCard title="Revenue" value={`${revenue.toLocaleString()} EGP`} />
        <DashboardCard title="Low Stock" value={lowStockCount} />
      </div>

      {/* RECENT SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">

        {/* RECENT PRODUCTS */}
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 flex flex-col h-full dark:bg-[#1a1b23] dark:border-gray-800">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-900">Recent Products</h2>
            <Link href="/products" className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
              View All
            </Link>
          </div>

          <div className="flex-1 space-y-2">
            {recentProductsSnap?.docs.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-10">No products yet.</p>
            )}

            {!recentProductsSnap && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
                ))}
              </div>
            )}

            {recentProductsSnap?.docs.map((doc) => {
              const data = doc.data();
              // Support both legacy and new schemas
              const title = data.title || data.Name || "Untitled Product";
              const price = data.price || data.Price || 0;
              const image = data.images?.[0] || data.imageUrl;
              const stock = data.totalStock !== undefined ? data.totalStock : (data.Stock || 0);
              const category = data.category || "General";

              return (
                <div
                  key={doc.id}
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all cursor-pointer dark:hover:bg-gray-800 dark:hover:border-gray-700"
                  onClick={() => router.push(`/products`)}
                >
                  <div className="relative w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {image ? (
                      <Image
                        src={image}
                        fill
                        alt={title}
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-300">IMG</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate dark:text-white">{title}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{price} EGP</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stock > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      }`}>
                      {stock > 0 ? `${stock} in stock` : "Out of stock"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT ORDERS */}
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 flex flex-col h-full dark:bg-[#1a1b23] dark:border-gray-800">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full transition-colors">
              View All
            </Link>
          </div>

          <div className="flex-1 space-y-2">
            {recentOrdersSnap?.docs.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-10">No orders yet.</p>
            )}

            {!recentOrdersSnap && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
                ))}
              </div>
            )}

            {recentOrdersSnap?.docs.map((doc) => {
              const data = doc.data();
              const time = data.createdAt?.toMillis() ? formatDistanceToNow(data.createdAt.toMillis(), { addSuffix: true }) : "N/A";
              const itemCount = data.items?.reduce((sum, item) => sum + item.qty, 0) || 0;

              return (
                <div
                  key={doc.id}
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all cursor-pointer dark:hover:bg-gray-800 dark:hover:border-gray-700"
                  onClick={() => router.push(`/orders`)}
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 text-lg group-hover:bg-white transition-colors">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate dark:text-white">
                      {data.delivery?.firstName} {data.delivery?.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{time}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{itemCount} items</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{data.totals?.total} EGP</p>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${data.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      data.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                        data.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {data.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* REAL-TIME DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 mb-12">

          {/* LIVE NOW DETAILS */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 flex flex-col h-full dark:bg-[#1a1b23] dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Live Now Details</h2>
              <span className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
                {liveCount} Active
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {liveSnap?.docs.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-10">No users online.</p>
              ) : (
                liveSnap?.docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl dark:bg-gray-800/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs">👤</div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                          {doc.data().email || "Anonymous User"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{doc.data().path}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      ID: {doc.data().sessionId?.slice(0, 6)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ACTIVE CARTS DETAILS */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 flex flex-col h-full dark:bg-[#1a1b23] dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Active Carts Details</h2>
              <Link href="/leads" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors">
                View All Leads
              </Link>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {leadsSnap?.docs.filter(d => d.data().status === 'pending' && d.data().lastActivity === 'cart').length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-10">No active carts.</p>
              ) : (
                leadsSnap?.docs
                  .filter(d => d.data().status === 'pending' && d.data().lastActivity === 'cart')
                  .sort((a, b) => (b.data().updatedAt?.toMillis() || 0) - (a.data().updatedAt?.toMillis() || 0))
                  .map(doc => {
                    const data = doc.data();
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl dark:bg-gray-800/40">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs">🛒</div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{data.name || "Anonymous"}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{data.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                            Cart
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

/* ---------------- REUSABLE CARD (memoized) ---------------- */
const DashboardCard = memo(function DashboardCard({ title, value, highlighted }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border transition ${highlighted ? "border-indigo-500 ring-4 ring-indigo-50 shadow-md" : "border-gray-100 dark:border-gray-800"
      } hover:shadow-md dark:bg-[#1a1b23]`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        {highlighted && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
        )}
      </div>
      <h2 className="text-2xl font-semibold dark:text-white transition-all">{value}</h2>
    </div>
  );
});
