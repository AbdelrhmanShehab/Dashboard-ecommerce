"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  doc,
  updateDoc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useCollection } from "react-firebase-hooks/firestore";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [selectedOrder, setSelectedOrder] = useState(null);

  const ordersQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );

  const [snapshot, ordersLoading] = useCollection(ordersQuery);

  /* AUTH CHECK */
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) return <p className="p-10">Checking auth...</p>;
  if (!user) return null;

  /* MAP ORDERS */
  const orders = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
  }, [snapshot]);

  /* UPDATE STATUS + RESTORE STOCK */
  const updateStatus = async (order, newStatus) => {
    if (order.status === newStatus) return;

    if (newStatus === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) continue;

        const product = productSnap.data();
        const variants = product.variants || [];

        const updatedVariants = variants.map((v) => {
          if (v.id === item.variantId) {
            return {
              ...v,
              stock: (v.stock || 0) + item.qty,
            };
          }
          return v;
        });

        await updateDoc(productRef, {
          variants: updatedVariants,
          totalStock: updatedVariants.reduce(
            (sum, v) => sum + (v.stock || 0),
            0
          ),
        });
      }
    }

    await updateDoc(doc(db, "orders", order.id), {
      status: newStatus,
      updatedAt: new Date(),
    });
  };

  /* STATUS COLOR */
  const statusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "shipped":
        return "bg-purple-100 text-purple-700";
      case "delivered":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <main className="p-6 bg-gray-50 min-h-screen">

      <h1 className="text-2xl font-semibold mb-6">
        Orders
      </h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase">
            <tr>
              <th className="p-4 text-left">Order ID</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Total</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {ordersLoading && (
              <tr>
                <td colSpan={5} className="p-10 text-center">
                  Loading orders...
                </td>
              </tr>
            )}

            {orders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-4">{order.id.slice(0, 6)}...</td>
                <td className="p-4">
                  {order.delivery.firstName}{" "}
                  {order.delivery.lastName}
                </td>
                <td className="p-4">
                  {order.totals.total} EGP
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${statusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="p-4 space-x-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-black text-xs underline"
                  >
                    View
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(order, "confirmed")
                    }
                    className="text-blue-600 text-xs"
                  >
                    Confirm
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(order, "cancelled")
                    }
                    className="text-red-600 text-xs"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================== ORDER DETAILS MODAL ================== */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          updateStatus={updateStatus}
        />
      )}
    </main>
  );
}

/* ========================================================= */
/* ================== ORDER DETAILS MODAL ================== */
/* ========================================================= */

function OrderDetailsModal({ order, onClose, updateStatus }) {
  const timelineSteps = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
  ];

  const currentIndex = timelineSteps.indexOf(order.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[700px] max-h-[90vh] overflow-y-auto rounded-xl p-6">

        <h2 className="text-lg font-semibold mb-4">
          Order Details
        </h2>

        <p className="text-xs text-gray-500 mb-4">
          ID: {order.id}
        </p>

        {/* ================= TIMELINE ================= */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Order Timeline</h3>

          <div className="flex justify-between items-center">
            {timelineSteps.map((step, index) => (
              <div key={step} className="flex-1 text-center">
                <div
                  className={`w-6 h-6 mx-auto rounded-full ${
                    index <= currentIndex
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                <p className="text-xs mt-2 capitalize">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CUSTOMER */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">
            Customer Information
          </h3>
          <p>
            {order.delivery.firstName}{" "}
            {order.delivery.lastName}
          </p>
          <p>{order.delivery.phone}</p>
          <p>{order.customer.email}</p>
        </div>

        {/* ADDRESS */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">
            Delivery Address
          </h3>
          <p>{order.delivery.address}</p>
          <p>
            {order.delivery.city},{" "}
            {order.delivery.government}
          </p>
        </div>

        {/* ITEMS */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Items</h3>

          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between mb-2 text-sm"
            >
              <div>
                <p>{item.title}</p>
                <p className="text-gray-400">
                  {item.variant}
                </p>
              </div>
              <div>
                x{item.qty} —{" "}
                {item.price * item.qty} EGP
              </div>
            </div>
          ))}
        </div>

        {/* TOTALS */}
        <div className="border-t pt-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>
              {order.totals.subtotal} EGP
            </span>
          </div>

          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {order.totals.shipping} EGP
            </span>
          </div>

          <div className="flex justify-between font-semibold pt-2">
            <span>Total</span>
            <span>
              {order.totals.total} EGP
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full border py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
