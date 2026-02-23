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
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LineChart({ users = [] }) {
  // Count users per month
  const monthlyCounts = {};

  users.forEach((user) => {
    const dateField = user.createdAt || user.Created;
    if (dateField && dateField.toDate) {
      const date = dateField.toDate();
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
        fill: true,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#6366f1",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1a1b23",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(0,0,0,0.05)",
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };

  return (
    <div className="h-[300px] w-full">
      <Line data={data} options={options} />
    </div>
  );
}
