"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  /* ---------------- FIRESTORE QUERIES ---------------- */

  const productsQuery = query(
    collection(db, "products"),
    orderBy("createdAt", "desc")
  );

  const ordersQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );

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

  const [productsSnap] = useCollection(productsQuery);
  const [ordersSnap] = useCollection(ordersQuery);
  const [recentProductsSnap] = useCollection(recentProductsQuery);
  const [recentOrdersSnap] = useCollection(recentOrdersQuery);

  /* ---------------- LOADING STATE ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking authentication...
      </div>
    );
  }

  if (!user) return null;

  /* ---------------- METRICS ---------------- */

  const totalProducts = productsSnap?.docs.length || 0;
  const totalOrders = ordersSnap?.docs.length || 0;

  const revenue =
    ordersSnap?.docs.reduce(
      (sum, doc) => sum + (doc.data().totals?.total || 0),
      0
    ) || 0;

  const lowStockCount =
    productsSnap?.docs.filter((doc) => {
      const variants = doc.data().variants || [];
      const totalStock = variants.reduce(
        (sum, v) => sum + (v.stock || 0),
        0
      );
      return totalStock > 0 && totalStock < 5;
    }).length || 0;

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-8 py-10">
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Real-time store overview
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Products" value={totalProducts} />
        <DashboardCard title="Orders" value={totalOrders} />
        <DashboardCard title="Revenue" value={`${revenue} EGP`} />
        <DashboardCard title="Low Stock" value={lowStockCount} />
      </div>

      {/* RECENT SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">

        {/* RECENT PRODUCTS */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-6">
            Recent Products
          </h2>

          {recentProductsSnap?.docs.length === 0 && (
            <p className="text-gray-400 text-sm">
              No products yet.
            </p>
          )}

          {recentProductsSnap?.docs.map((doc) => {
            const data = doc.data();

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between py-4 border-b border-gray-100 last:border-none"
              >
                <div>
                  <p className="font-medium text-sm">
                    {data.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {doc.id.slice(0, 8)}
                  </p>
                </div>

                <p className="font-semibold">
                  {data.price} EGP
                </p>
              </div>
            );
          })}
        </div>

        {/* RECENT ORDERS */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-6">
            Recent Orders
          </h2>

          {recentOrdersSnap?.docs.length === 0 && (
            <p className="text-gray-400 text-sm">
              No orders yet.
            </p>
          )}

          {recentOrdersSnap?.docs.map((doc) => {
            const data = doc.data();

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between py-4 border-b border-gray-100 last:border-none"
              >
                <div>
                  <p className="font-medium text-sm">
                    {data.delivery?.firstName}{" "}
                    {data.delivery?.lastName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {doc.id.slice(0, 8)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    {data.totals?.total} EGP
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-600">
                    {data.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}

/* ---------------- REUSABLE CARD ---------------- */

function DashboardCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
      <p className="text-sm text-gray-500 mb-2">
        {title}
      </p>
      <h2 className="text-2xl font-semibold">
        {value}
      </h2>
    </div>
  );
}
