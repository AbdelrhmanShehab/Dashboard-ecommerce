"use client";
import { useState, useEffect } from "react";

import Image from "next/image";
import Link from "next/link";
import format from "date-fns/format";
import TitlePage from "../../components/TitlePage";
import MainBtn from "../../components/Mainbtn";
import { useUser } from "../../context/UserContext";
import sortIcon from "../../../public/icons/sort-icon.svg";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { logActivity } from "../../utils/logger";

import RoleGuard from "../../components/RoleGuard";

export default function UserPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <UserContent />
    </RoleGuard>
  );
}

function UserContent() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [sortField, setSortField] = useState("email");
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { setSelectedUser } = useUser();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUsers(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    } else {
      router.push("/login");
    }
  }, [user, router]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredUsers = users
    .filter((user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "createdAt") {
        return sortDirection === "asc"
          ? new Date(aVal) - new Date(bVal)
          : new Date(bVal) - new Date(aVal);
      }

      return sortDirection === "asc"
        ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
        : String(bVal ?? "").localeCompare(String(aVal ?? ""));
    });

  const handleSetUserData = (user) => {
    setSelectedUser(user);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user from BOTH Authentication and Database?")) return;
    try {
      const userToDeleteEmail = users.find((u) => u.id === id)?.email || "Unknown User";
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      await logActivity("Deleted User", `Removed user: ${userToDeleteEmail}`, user);
      fetchUsers(); // Refresh list
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user: " + err.message);
    }
  };


  const staffUsers = filteredUsers.filter(u => u.role === "admin" || u.role === "worker");
  const customerUsers = filteredUsers.filter(u => u.role === "editor" || !u.role);

  const getDisplayRole = (role) => {
    if (role === "admin") return "Admin";
    if (role === "worker") return "Worker";
    if (role === "editor" || !role) return "Customer";
    return role;
  };

  const UserTable = ({ data, title, loading }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold dark:text-white px-2">
          {title} <span className="text-sm font-normal text-gray-500 ml-2">({data.length})</span>
        </h2>
      </div>
      <div className="w-full bg-white rounded-xl overflow-x-auto shadow-sm dark:bg-[#1a1b23] dark:border dark:border-gray-800">
        <div className="inline-block min-w-[800px] w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm dark:bg-[#6366f1] dark:text-white">
                {["name", "email", "role", "createdAt"].map((field) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className="py-3 px-4 text-center whitespace-nowrap cursor-pointer"
                  >
                    {field}
                    <Image
                      src={sortIcon}
                      className={`inline-block ml-2 cursor-pointer dark:invert dark:brightness-200 ${sortField === field ? "opacity-100" : "opacity-50"
                        }`}
                      width={18}
                      height={18}
                      alt="Sort"
                    />
                  </th>
                ))}
                <th className="py-3 px-4 text-center whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-center dark:bg-[#1a1b23]">
              {loading && (
                <tr>
                  <td colSpan={5} className="p-4">
                    Loading...
                  </td>
                </tr>
              )}
              {data.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-500">
                    No users found in this category.
                  </td>
                </tr>
              )}
              {data.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold">{user.name || "N/A"}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      user.role === "admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                      user.role === "worker" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {getDisplayRole(user.role)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user.createdAt
                      ? format(new Date(user.createdAt), "dd MMM yyyy")
                      : "—"}
                  </td>
                  <td className="py-3 px-4 space-x-2 flex justify-center flex-col md:flex-row items-center">
                    <Link href="/users/edit">
                      <button
                        onClick={() => handleSetUserData(user)}
                        className="px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Image
                          src="/icons/edit-icon.svg"
                          width={20}
                          height={20}
                          alt="Edit"
                          className="dark:invert dark:brightness-200"
                        />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="px-2 py-1 rounded cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Image
                        src="/icons/delete-icon.svg"
                        width={20}
                        height={20}
                        alt="Delete"
                        className="dark:invert dark:brightness-200"
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <main className="p-4 dark:bg-[#1a1b23] dark:text-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <TitlePage
          header="User Management"
          paragraph="Oversee staff permissions and customer accounts."
        />
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:bg-[#0d1321] dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {(role === "admin" || role === "worker") && (
            <Link href="/create">
              <MainBtn content="Add Staff" />
            </Link>
          )}
        </div>
      </div>

      {error ? (
        <div className="max-w-md mx-auto bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-900/30 text-center">
          <p className="font-bold text-lg mb-2 text-red-600">Error loading users</p>
          <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">{error.message}</p>
          <button
            onClick={fetchUsers}
            className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Try Refreshing
          </button>
        </div>
      ) : (
        <>
          <UserTable data={staffUsers} title="Staff Members" loading={loading} />
          <UserTable data={customerUsers} title="Registered Customers" loading={loading} />
        </>
      )}
    </main>
  );
}
