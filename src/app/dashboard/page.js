"use client";

import TitlePage from "../../components/TitlePage";
import StatusCard from "../../components/StatusCard";
import UserCard from "../../components/UserCard";
import ProductCard from "../../components/ProductCard";
import { db } from "../../firebaseConfig";
import { collection } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {}, [user]);

  const [productsSnap] = useCollection(collection(db, "products"));
  const [usersSnap] = useCollection(collection(db, "users"));
  if (!user) router.push("/login");
  if (!user) return null;

  const usersActive =
    usersSnap?.docs.filter((doc) => doc.data().Status === "active").length || 0;

  const productsActive =
    productsSnap?.docs.filter((doc) => doc.data().Status === "active").length ||
    0;

  const totalPrice =
    productsSnap?.docs.reduce((sum, doc) => sum + (doc.data().price || 0), 0) ||
    0;

  return (
    <main className="w-full md:w-[97%] m-auto mb-10 dark:bg-[#1a1b23] min-h-[81.5vh]">
      <TitlePage
        header="Dashboard"
        paragraph="Welcome back! Here's what's happening."
      />

      {/* STATUS CARDS */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <StatusCard
          title="Users"
          value={usersSnap?.docs.length || 0}
          secondaryValue={`${usersActive} active`}
          iconSrc="/icons/user-icon.svg"
          onClick={() => router.push("/users")}
        />

        <StatusCard
          title="Products"
          value={productsSnap?.docs.length || 0}
          secondaryValue={`${productsActive} active`}
          iconSrc="/icons/product-icon.svg"
          onClick={() => router.push("/products")}
        />

        <StatusCard
          title="Total Products Price"
          value={totalPrice}
          secondaryValue="EGP"
          iconSrc="/icons/dollar-icon.svg"
        />

        <StatusCard
          title="Growth"
          value="+23%"
          secondaryValue="vs last month"
          iconSrc="/icons/growth-icon.svg"
        />
      </div>

      {/* SUMMARY SECTIONS */}
      <div className="w-full flex flex-col lg:flex-row gap-4 mt-6">
        <UserCard />
        <ProductCard />
      </div>
    </main>
  );
}
