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
import Image from "next/image";
import { useCallback } from "react";
import { logActivity } from "../../utils/logger";

import RoleGuard from "../../components/RoleGuard";

export default function OrdersPage() {
  return (
    <RoleGuard allowedRoles={["admin", "editor"]}>
      <OrdersContent />
    </RoleGuard>
  );
}

function OrdersContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  /* MAP & FILTER ORDERS */
  const filteredOrders = useMemo(() => {
    if (!snapshot) return [];

    let list = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));

    if (statusFilter !== "all") {
      list = list.filter((order) => order.status === statusFilter);
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      list = list.filter((order) => {
        const fullName = `${order.delivery?.firstName || ""} ${order.delivery?.lastName || ""}`.toLowerCase();
        return (
          fullName.includes(term) ||
          order.id.toLowerCase().includes(term) ||
          (order.delivery?.phone && order.delivery.phone.includes(term))
        );
      });
    }

    return list;
  }, [snapshot, searchTerm, statusFilter]);

  /* UPDATE STATUS + RESTORE STOCK */
  const updateStatus = async (order, newStatus) => {
    if (order.status === newStatus) return;

    // IF CANCELLED -> ANY (EXCEPT CANCELLED): DECREASE STOCK
    if (order.status === "cancelled" && newStatus !== "cancelled") {
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
              stock: Math.max(0, (v.stock || 0) - item.qty),
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

    // IF ANY -> CANCELLED: INCREASE STOCK
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

    const orderRef = doc(db, "orders", order.id);
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: new Date(),
    });

    await logActivity("Updated Order Status", `Changed order #${order.id.slice(0, 6).toUpperCase()} status to ${newStatus}`, user, {
      status: { from: order.status, to: newStatus }
    });

    // Update local state if modal is open
    if (selectedOrder?.id === order.id) {
      setSelectedOrder({ ...order, status: newStatus });
    }
  };

  /* CONFIRM PAYMENT */
  const confirmPayment = async (order) => {
    const orderRef = doc(db, "orders", order.id);
    await updateDoc(orderRef, {
      "payment.paid": true,
      updatedAt: new Date(),
    });

    await logActivity("Confirmed Payment", `Marked order #${order.id.slice(0, 6).toUpperCase()} as paid`, user);

    if (selectedOrder?.id === order.id) {
      setSelectedOrder({
        ...order,
        payment: { ...order.payment, paid: true },
      });
    }
  };


  return (
    <main className="p-4 md:p-8 bg-[#f9fafb] min-h-screen dark:bg-[#1a1b23] dark:text-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
            <p className="text-gray-500 mt-1 text-sm dark:text-gray-400">Manage and track your customer orders.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 w-64 shadow-sm transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 shadow-sm transition-all outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto dark:bg-[#1a1b23] dark:border-gray-800">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {ordersLoading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
                      <span>Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-400">
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="group hover:bg-gray-50/80 cursor-pointer transition-colors dark:hover:bg-gray-800"
                  >
                    <td className="p-4">
                      <span className="font-medium text-gray-900 text-sm">#{order.id.slice(0, 6).toUpperCase()}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.delivery?.firstName} {order.delivery?.lastName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{order.customer?.email || order.delivery?.phone}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {order.createdAt?.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {order.totals?.total?.toLocaleString()} EGP
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================== ORDER DETAILS MODAL ================== */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          updateStatus={updateStatus}
          confirmPayment={confirmPayment}
        />
      )}
    </main>
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
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${colors[status] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
      {status}
    </span>
  );
}

function OrderDetailsModal({ order, onClose, updateStatus, confirmPayment }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const handleConfirmPayment = async () => {
    setConfirmingPayment(true);
    try {
      await confirmPayment(order);
    } finally {
      setConfirmingPayment(false);
    }
  };

  const timelineSteps = [
    { id: "pending", label: "Pending", icon: "🕒" },
    { id: "confirmed", label: "Confirmed", icon: "📄" },
    { id: "shipped", label: "Shipped", icon: "🚚" },
    { id: "delivered", label: "Delivered", icon: "✅" },
  ];

  const currentStepIndex = timelineSteps.findIndex(s => s.id === order.status);

  const payment = order.payment || {};
  const hasScreenshot = !!payment.paymentPhotoUrl;
  const isOnline = payment.method === "online";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col dark:bg-[#1a1b23] dark:border dark:border-gray-800">

        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h2>
            <p className="text-xs text-gray-500 font-mono dark:text-gray-400">ID: {order.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">

          {/* STEPPER / TIMELINE */}
          <div className="mb-10 px-4">
            <div className="flex items-center justify-between relative">
              {/* Connector Line */}
              <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>
              <div className="absolute top-5 left-0 h-0.5 bg-emerald-500 transition-all duration-500 -z-10" style={{ width: `${(currentStepIndex / (timelineSteps.length - 1)) * 100}%` }}></div>

              {timelineSteps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${idx <= currentStepIndex
                    ? "bg-white border-emerald-500 text-lg"
                    : "bg-white border-gray-100 text-lg opacity-40"
                    }`}>
                    {step.icon}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold mt-2 uppercase tracking-tight ${idx <= currentStepIndex ? "text-gray-900 dark:text-white" : "text-gray-300 dark:text-gray-700"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT COLUMN: INFO */}
            <div className="space-y-8">
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Customer info</h3>
                <div className="p-4 bg-gray-50 rounded-xl space-y-1 dark:bg-gray-800/50">
                  <p className="font-semibold text-gray-900 dark:text-white">{order.delivery.firstName} {order.delivery.lastName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.delivery.phone}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer.email}</p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Delivery address</h3>
                <div className="p-4 bg-gray-50 rounded-xl dark:bg-gray-800/50">
                  <p className="text-sm text-gray-800 leading-relaxed dark:text-gray-300">
                    {order.delivery.address}<br />
                    {order.delivery.city}, {order.delivery.government}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Quick actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => updateStatus(order, "confirmed")}
                    disabled={order.status !== "pending"}
                    className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed dark:bg-indigo-600 dark:hover:bg-indigo-700 h-10 min-w-[120px]"
                  >
                    Confirm Order
                  </button>
                  <button
                    onClick={() => updateStatus(order, "shipped")}
                    disabled={order.status !== "confirmed"}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed h-10 min-w-[120px]"
                  >
                    Mark Shipped
                  </button>
                  <button
                    onClick={() => updateStatus(order, "delivered")}
                    disabled={order.status !== "shipped"}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer h-10 min-w-[120px]"
                  >
                    Mark Delivered
                  </button>
                  <button
                    onClick={() => updateStatus(order, "cancelled")}
                    disabled={order.status === "cancelled" || order.status === "delivered"}
                    className="px-4 py-2 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed h-10 min-w-[120px] dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                  >
                    Cancel Order
                  </button>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: ITEMS */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Order items</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 dark:border-gray-800 dark:divide-gray-800">
                {order.items.map((item, i) => (
                  <div key={i} className="p-4 flex items-center gap-4 bg-white hover:bg-gray-50/50 transition-colors dark:bg-[#1a1b23] dark:hover:bg-gray-800">
                    <div className="relative w-14 h-14 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                      {item.image || (item.images && item.images[0]) ? (
                        <Image
                          src={item.image || item.images[0]}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-300 uppercase bg-gray-50">
                          No IMG
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate dark:text-white">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">{item.variant}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">x{item.qty}</p>
                      <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">{(item.price * item.qty).toLocaleString()} EGP</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTALS TABLE */}
              <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-100 space-y-3">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">{order.totals.subtotal.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900 dark:text-white">{order.totals.shipping.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-base font-black pt-3 text-gray-900 border-t border-gray-50 dark:text-white dark:border-gray-800">
                  <span>Grand Total</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{order.totals.total.toLocaleString()} EGP</span>
                </div>
              </div>

              {/* ── PAYMENT INFO CARD ── */}
              <div className="mt-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Payment</h3>
                <div className={`rounded-xl border-2 p-4 space-y-4 ${payment.paid
                  ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/60 dark:bg-emerald-900/20"
                  : "border-amber-200 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-900/20"
                  }`}>

                  {/* Method + Status row */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${isOnline ? "" : ""}`}>
                        {isOnline ? "💳" : "💵"}
                      </span>
                      <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                        {isOnline ? "Online Payment (Instapay)" : "Cash on Delivery"}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${payment.paid
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-700"
                      : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700"
                      }`}>
                      {payment.paid ? "✓ Paid" : "Pending"}
                    </span>
                  </div>

                  {/* Deposit / Amount row */}
                  {payment.depositAmount != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        {payment.depositType === "deposit" ? "Deposit (10%)" : "Amount"}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {payment.depositAmount.toLocaleString()} EGP
                      </span>
                    </div>
                  )}

                  {/* Screenshot */}
                  {hasScreenshot && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instapay Receipt</p>
                      <div
                        className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-zoom-in group"
                        onClick={() => setLightboxOpen(true)}
                      >
                        <Image
                          src={payment.paymentPhotoUrl}
                          alt="Instapay receipt"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 400px"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs bg-black/60 px-3 py-1.5 rounded-full">
                            🔍 Click to enlarge
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No screenshot notice */}
                  {!hasScreenshot && isOnline && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-lg px-3 py-2">
                      <span>⚠️</span>
                      <span>No payment screenshot uploaded yet.</span>
                    </div>
                  )}

                  {/* Confirm Payment button */}
                  {!payment.paid && hasScreenshot && (
                    <button
                      onClick={handleConfirmPayment}
                      disabled={confirmingPayment}
                      className="w-full mt-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {confirmingPayment ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Confirming...
                        </>
                      ) : (
                        <>✅ Confirm Payment</>
                      )}
                    </button>
                  )}

                  {payment.paid && (
                    <p className="text-xs text-center text-emerald-700 dark:text-emerald-400 font-semibold">
                      ✓ Payment has been verified
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end dark:bg-gray-800/50 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
          >
            Done
          </button>
        </div>
      </div>

      {/* ── SCREENSHOT LIGHTBOX ── */}
      {lightboxOpen && hasScreenshot && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={payment.paymentPhotoUrl}
              alt="Instapay receipt full size"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <a
              href={payment.paymentPhotoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-xs bg-white text-gray-700 px-4 py-1.5 rounded-full shadow-lg font-semibold hover:bg-gray-50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Open original ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
