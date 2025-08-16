"use client";

import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { db } from "@/firebaseConfig";
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

import TitlePage from "@/components/TitlePage";
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);
import LineChart from "@/components/LineChart";
export default function AnalyticsPage() {
  // retriving users data
  const [value, loading, error] = useCollection(collection(db, "users"));
  const users =
    value?.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) || [];
  // retriving products data
  const [productValue, productLoading, productError] = useCollection(
    collection(db, "products")
  );
  const products =
    productValue?.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) || [];
  // calculations for users analysis
  const activeCount = users.filter((u) => u.Status === "active").length;
  const inactiveCount = users.filter((u) => u.Status !== "active").length;
  const adminUsers = users.filter(
    (u) => u.Role == "Admin" || u.Role == "admin"
  ).length;
  const regularUsers = users.filter(
    (u) => u.Role !== "Admin" || u.Role !== "admin"
  ).length;
  // users analysis
  // Pie chart active inactive data
  const pieDataActivity = {
    labels: ["Active Users", "Inactive Users"],
    datasets: [
      {
        data: [activeCount, inactiveCount],
        backgroundColor: ["#064232", "#568F87"],
        hoverBackgroundColor: ["#064950", "#064950"],
      },
    ],
  };
  // Pie chart admin regular users data
  const pieDataAuth = {
    labels: ["Admin Users", "Regular Users"],
    datasets: [
      {
        data: [adminUsers, regularUsers],
        backgroundColor: ["#3b82f6", "#F5BABB"],
        hoverBackgroundColor: ["#064950", "#F5BA8B"],
      },
    ],
  };
  // products analysis calaculations

  // total products in each category
  const totalElectricCategory = products.filter(
    (p) => p.Category?.toLowerCase() === "electronics"
  ).length;

  const totalFurnitureCategory = products.filter(
    (p) => p.Category?.toLowerCase() === "furniture"
  ).length;

  const totalAccessoriesCategory = products.filter(
    (p) => p.Category?.toLowerCase() === "accessories"
  ).length;

  // total revenue for each category
  const revnueElecCategory = products
    .map((p) =>
      p.Category?.toLowerCase() === "electronics"
        ? Number(p.Price) * Number(p.Stock)
        : 0
    )
    .reduce((a, b) => a + b, 0);

  const revnueFurnCategory = products
    .map((p) =>
      p.Category?.toLowerCase() === "furniture"
        ? Number(p.Price) * Number(p.Stock)
        : 0
    )
    .reduce((a, b) => a + b, 0);

  const revnueAccesCategory = products
    .map((p) =>
      p.Category?.toLowerCase() === "accessories"
        ? Number(p.Price) * Number(p.Stock)
        : 0
    )
    .reduce((a, b) => a + b, 0);

  // total stock for each category
  const totalElectricCategoryStock = products
    .map((p) =>
      p.Category?.toLowerCase() === "electronics" ? Number(p.Stock) : 0
    )
    .reduce((a, b) => a + b, 0);

  const totalFurnitureCategoryStock = products
    .map((p) =>
      p.Category?.toLowerCase() === "furniture" ? Number(p.Stock) : 0
    )
    .reduce((a, b) => a + b, 0);

  const totalAccessoriesCategoryStock = products
    .map((p) =>
      p.Category?.toLowerCase() === "accessories" ? Number(p.Stock) : 0
    )
    .reduce((a, b) => a + b, 0);

  // Product Count Pie Chart
  const productCountData = {
    labels: ["Electronics", "Furniture", "Accessories"],
    datasets: [
      {
        label: "Products",
        data: [
          totalElectricCategory,
          totalFurnitureCategory,
          totalAccessoriesCategory,
        ],
        backgroundColor: ["#064232", "#568F87", "#B5E5CF"],
        hoverBackgroundColor: ["#046C4E", "#357E73", "#94D8BB"],
      },
    ],
  };

  // Stock Distribution Pie Chart
  const stockData = {
    labels: ["Electronics", "Furniture", "Accessories"],
    datasets: [
      {
        label: "Stock",
        data: [
          totalElectricCategoryStock,
          totalFurnitureCategoryStock,
          totalAccessoriesCategoryStock,
        ],
        backgroundColor: ["#FFB703", "#FB8500", "#8ECAE6"],
        hoverBackgroundColor: ["#FFA500", "#E06A00", "#62B5D9"],
      },
    ],
  };

  // Revenue per Category (Bar Chart)
  const revenueData = {
    labels: ["Electronics", "Furniture", "Accessories"],
    datasets: [
      {
        label: "Revenue ($)",
        data: [revnueElecCategory, revnueFurnCategory, revnueAccesCategory],
        backgroundColor: ["#023047", "#219EBC", "#FFB703"],
      },
    ],
  };
  return (
    <main className="container">
      <TitlePage
        header="Users Analytics"
        paragraph="Manage your users by analyzing their data."
      />
      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}

      {!loading && users.length > 0 && (
        <div className="max-w-sm h-[300px] flex flex-col md:flex-row justify-around w-[100%] mt-12 gap-20 mb-16">
          <Pie data={pieDataActivity} />
          <Pie data={pieDataAuth} />
          <LineChart users={users} />
        </div>
      )}
      <TitlePage
        header="Products Analytics"
        paragraph="Manage your products by analyzing their data."
      />
      {!loading && users.length === 0 && <p>No user data found.</p>}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Products per Category */}
        <div className="p-4 rounded-lg shadow dark:text-white">
          <h2 className="text-lg font-bold mb-4">Products per Category</h2>
          <Pie data={productCountData} />
        </div>

        {/* Stock Distribution */}
        <div className="p-4 rounded-lg shadow dark:text-white ">
          <h2 className="text-lg font-bold mb-4">Stock Distribution</h2>
          <Pie data={stockData} />
        </div>

        {/* Revenue */}
        <div className="p-4 rounded-lg shadow dark:text-white col-span-1 md:col-span-2 lg:col-span-1">
          <h2 className="text-lg font-bold mb-4">Revenue by Category</h2>
          <Bar data={revenueData} />
        </div>
      </div>
    </main>
  );
}
