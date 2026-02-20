"use client";

import { useEffect, useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, limit } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import TitlePage from "../../components/TitlePage";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import LineChart from "../../components/LineChart";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (user === null) router.push("/login");
  }, [user, router]);

  /* ---------------- FIRESTORE: limited queries ---------------- */
  const usersQuery = query(collection(db, "users"), limit(500));
  const productsQuery = query(collection(db, "products"), limit(500));

  const [value, loading, error] = useCollection(usersQuery);
  const [productValue, productLoading] = useCollection(productsQuery);

  /* ---------------- MEMOIZED: users data + calculations ---------------- */
  const { users, activeCount, inactiveCount, adminUsers, regularUsers } = useMemo(() => {
    const users = value?.docs.map((doc) => ({ id: doc.id, ...doc.data() })) || [];
    const activeCount = users.filter((u) => u.Status === "active").length;
    const inactiveCount = users.filter((u) => u.Status !== "active").length;
    const adminUsers = users.filter((u) => u.Role === "Admin" || u.Role === "admin").length;
    const regularUsers = users.filter((u) => u.Role !== "Admin" && u.Role !== "admin").length;
    return { users, activeCount, inactiveCount, adminUsers, regularUsers };
  }, [value]);

  /* ---------------- MEMOIZED: products data + calculations ---------------- */
  const {
    products,
    totalElectricCategory,
    totalFurnitureCategory,
    totalAccessoriesCategory,
    revnueElecCategory,
    revnueFurnCategory,
    revnueAccesCategory,
    totalElectricCategoryStock,
    totalFurnitureCategoryStock,
    totalAccessoriesCategoryStock,
  } = useMemo(() => {
    const products = productValue?.docs.map((doc) => ({ id: doc.id, ...doc.data() })) || [];

    const totalElectricCategory = products.filter((p) => p.Category?.toLowerCase() === "electronics").length;
    const totalFurnitureCategory = products.filter((p) => p.Category?.toLowerCase() === "furniture").length;
    const totalAccessoriesCategory = products.filter((p) => p.Category?.toLowerCase() === "accessories").length;

    const revnueElecCategory = products.reduce((a, p) =>
      a + (p.Category?.toLowerCase() === "electronics" ? Number(p.Price) * Number(p.Stock) : 0), 0);
    const revnueFurnCategory = products.reduce((a, p) =>
      a + (p.Category?.toLowerCase() === "furniture" ? Number(p.Price) * Number(p.Stock) : 0), 0);
    const revnueAccesCategory = products.reduce((a, p) =>
      a + (p.Category?.toLowerCase() === "accessories" ? Number(p.Price) * Number(p.Stock) : 0), 0);

    const totalElectricCategoryStock = products.reduce((a, p) =>
      a + (p.Category?.toLowerCase() === "electronics" ? Number(p.Stock) : 0), 0);
    const totalFurnitureCategoryStock = products.reduce((a, p) =>
      a + (p.Category?.toLowerCase() === "furniture" ? Number(p.Stock) : 0), 0);
    const totalAccessoriesCategoryStock = products.reduce((a, p) =>
      a + (p.Category?.toLowerCase() === "accessories" ? Number(p.Stock) : 0), 0);

    return {
      products,
      totalElectricCategory,
      totalFurnitureCategory,
      totalAccessoriesCategory,
      revnueElecCategory,
      revnueFurnCategory,
      revnueAccesCategory,
      totalElectricCategoryStock,
      totalFurnitureCategoryStock,
      totalAccessoriesCategoryStock,
    };
  }, [productValue]);

  /* ---------------- MEMOIZED: chart data objects ---------------- */
  const pieDataActivity = useMemo(() => ({
    labels: ["Active Users", "Inactive Users"],
    datasets: [{ data: [activeCount, inactiveCount], backgroundColor: ["#064232", "#568F87"], hoverBackgroundColor: ["#064950", "#064950"] }],
  }), [activeCount, inactiveCount]);

  const pieDataAuth = useMemo(() => ({
    labels: ["Admin Users", "Regular Users"],
    datasets: [{ data: [adminUsers, regularUsers], backgroundColor: ["#3b82f6", "#F5BABB"], hoverBackgroundColor: ["#064950", "#F5BA8B"] }],
  }), [adminUsers, regularUsers]);

  const productCountData = useMemo(() => ({
    labels: ["Electronics", "Furniture", "Accessories"],
    datasets: [{ label: "Products", data: [totalElectricCategory, totalFurnitureCategory, totalAccessoriesCategory], backgroundColor: ["#064232", "#568F87", "#B5E5CF"], hoverBackgroundColor: ["#046C4E", "#357E73", "#94D8BB"] }],
  }), [totalElectricCategory, totalFurnitureCategory, totalAccessoriesCategory]);

  const stockData = useMemo(() => ({
    labels: ["Electronics", "Furniture", "Accessories"],
    datasets: [{ label: "Stock", data: [totalElectricCategoryStock, totalFurnitureCategoryStock, totalAccessoriesCategoryStock], backgroundColor: ["#FFB703", "#FB8500", "#8ECAE6"], hoverBackgroundColor: ["#FFA500", "#E06A00", "#62B5D9"] }],
  }), [totalElectricCategoryStock, totalFurnitureCategoryStock, totalAccessoriesCategoryStock]);

  const revenueData = useMemo(() => ({
    labels: ["Electronics", "Furniture", "Accessories"],
    datasets: [{ label: "Revenue ($)", data: [revnueElecCategory, revnueFurnCategory, revnueAccesCategory], backgroundColor: ["#023047", "#219EBC", "#FFB703"] }],
  }), [revnueElecCategory, revnueFurnCategory, revnueAccesCategory]);

  if (user === null) return null;

  return (
    <main className="container">
      <TitlePage header="Users Analytics" paragraph="Manage your users by analyzing their data." />

      {loading && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && <p className="text-red-500">Error: {error.message}</p>}

      {!loading && users.length > 0 && (
        <div className="max-w-sm h-[300px] flex flex-col md:flex-row justify-around w-[100%] mt-12 gap-20 mb-16">
          <Pie data={pieDataActivity} />
          <Pie data={pieDataAuth} />
          <LineChart users={users} />
        </div>
      )}

      <TitlePage header="Products Analytics" paragraph="Manage your products by analyzing their data." />

      {!loading && users.length === 0 && <p>No user data found.</p>}

      {productLoading && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!productLoading && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-4 rounded-lg shadow dark:text-white">
            <h2 className="text-lg font-bold mb-4">Products per Category</h2>
            <Pie data={productCountData} />
          </div>
          <div className="p-4 rounded-lg shadow dark:text-white">
            <h2 className="text-lg font-bold mb-4">Stock Distribution</h2>
            <Pie data={stockData} />
          </div>
          <div className="p-4 rounded-lg shadow dark:text-white col-span-1 md:col-span-2 lg:col-span-1">
            <h2 className="text-lg font-bold mb-4">Revenue by Category</h2>
            <Bar data={revenueData} />
          </div>
        </div>
      )}
    </main>
  );
}
