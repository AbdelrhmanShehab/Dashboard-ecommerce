"use client";
import Image from "next/image";
import darkmode from "../../public/icons/dark-mode-icon.svg";
import lightmode from "../../public/icons/light-mode-icon.svg";
import useTheme from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { memo, useState, useMemo, useEffect } from "react";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "../firebaseConfig";

const Header = memo(function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const { togglemode, setToggleMode } = useTheme();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);

  /* INITIALIZE LAST SEEN FROM LOCALSTORAGE */
  useEffect(() => {
    const saved = localStorage.getItem("lastSeenOrderTime");
    if (saved) setLastSeen(parseInt(saved));
  }, []);

  /* REAL-TIME ORDERS FOR NOTIFICATIONS */
  const notificationsQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc"),
    limit(5)
  );
  const [snapshot] = useCollection(notificationsQuery);

  const notifications = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }, [snapshot]);

  const pendingCount = useMemo(() => {
    return notifications.filter(n => {
      const isPending = n.status === "pending";
      const createdAt = n.createdAt?.toMillis() || 0;
      return isPending && createdAt > lastSeen;
    }).length;
  }, [notifications, lastSeen]);

  const handleToggleNotifications = () => {
    const newest = notifications[0]?.createdAt?.toMillis() || Date.now();
    if (!showNotifications) {
      // Opening
      setShowNotifications(true);
      setLastSeen(newest);
      localStorage.setItem("lastSeenOrderTime", newest.toString());
    } else {
      setShowNotifications(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="bg-white border-b dark:bg-[#1a1b23] relative z-50">
      <div className="w-[95%] m-auto flex justify-between items-center h-[64px]">

        <button onClick={toggleSidebar} className="w-6 h-6 relative">
          <Image src="/icons/sidebar-icon.svg" fill alt="menu" />
        </button>

        <div className="flex items-center gap-4">

          {/* NOTIFICATION BELL */}
          <div className="relative">
            <button
              onClick={handleToggleNotifications}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* DROPDOWN */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1a1b23] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white">Recent Orders</h3>
                    {pendingCount > 0 && <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{pendingCount} New</span>}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">No recent orders</div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            router.push("/orders");
                            setShowNotifications(false);
                          }}
                          className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-none transition-colors"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">#{notif.id.slice(0, 6).toUpperCase()}</span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${notif.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                              {notif.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {notif.delivery?.firstName} {notif.delivery?.lastName} — {notif.totals?.total} EGP
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div
                    onClick={() => {
                      router.push("/orders");
                      setShowNotifications(false);
                    }}
                    className="mt-2 mx-4 mb-2 p-2 text-center text-xs font-bold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer transition-all"
                  >
                    View All Orders
                  </div>
                </div>
              </>
            )}
          </div>

          <button onClick={() => setToggleMode(!togglemode)}>
            <Image
              src={togglemode ? lightmode : darkmode}
              width={22}
              height={22}
              alt="mode"
            />
          </button>

          {user && (
            <>
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Administrator</span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-none">{user.email?.split('@')[0]}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all group"
                title="Logout"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
});

export default Header;