"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const RoleGuard = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1a1b23]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (!user) return null;

  if (role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#1a1b23] p-4 text-center">
        <div className="bg-white dark:bg-[#0D1321] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 max-w-md">
          <div className="text-red-500 text-5xl mb-4 text-center">🚫</div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white text-center">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">
            You don't have permission to access this page.
            This area is restricted to <strong>{allowedRoles.join(" or ")}</strong>.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-black/90 transition-all dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleGuard;
