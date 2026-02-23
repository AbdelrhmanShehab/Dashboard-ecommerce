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
      } else if (role && !allowedRoles.includes(role)) {
        // Redirect to a safe page if role not allowed
        router.replace("/products");
      }
    }
  }, [user, role, loading, router, allowedRoles]);

  if (loading || !user || (role && !allowedRoles.includes(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1a1b23]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return children;
};

export default RoleGuard;
