"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function LineChart({ users = [] }) {
  // Count users per month
  const monthlyCounts = {};

  users.forEach((user) => {
    if (user.Created && user.Created.toDate) {
      const date = user.Created.toDate();
      const monthYear = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
    }
  });

  const labels = Object.keys(monthlyCounts);
  const data = {
    labels,
    datasets: [
      {
        label: "New Users",
        data: Object.values(monthlyCounts),
        fill: false,
        borderColor: "#6366f1",
        backgroundColor: "#6366f1",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-[#0D1321] p-4 rounded-md shadow-md w-[300px]">
      <h2 className="text-lg font-semibold mb-4 dark:text-white">
        📈 User Growth
      </h2>
      <Line data={data} />
    </div>
  );
}
