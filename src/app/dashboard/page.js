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

export default function DashboardPage() {
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

  const [recentProductsSnap] = useCollection(recentProductsQuery);
  const [recentOrdersSnap] = useCollection(recentOrdersQuery);
  const [ordersSnap] = useCollection(ordersForMetricsQuery);
  const [productsSnap] = useCollection(productsForMetricsQuery);

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

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-8 py-10">
      {/* HEADER */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-2 text-sm">Real-time store overview</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Products" value={totalProducts} />
        <DashboardCard title="Orders" value={totalOrders} />
        <DashboardCard title="Revenue" value={`${revenue.toLocaleString()} EGP`} />
        <DashboardCard title="Low Stock" value={lowStockCount} />
      </div>

      {/* RECENT SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">

        {/* RECENT PRODUCTS */}
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 flex flex-col h-full">
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
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all cursor-pointer"
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
                    <p className="font-bold text-sm text-gray-900 truncate">{title}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">{price} EGP</p>
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
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 flex flex-col h-full">
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
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all cursor-pointer"
                  onClick={() => router.push(`/orders`)}
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 text-lg group-hover:bg-white transition-colors">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {data.delivery?.firstName} {data.delivery?.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{time}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{itemCount} items</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">{data.totals?.total} EGP</p>
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

      </div>
    </main>
  );
}

/* ---------------- REUSABLE CARD (memoized) ---------------- */
const DashboardCard = memo(function DashboardCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <h2 className="text-2xl font-semibold">{value}</h2>
    </div>
  );
});
