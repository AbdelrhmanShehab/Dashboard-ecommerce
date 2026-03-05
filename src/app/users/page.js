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


  if (!user) return null;

  return (
    <main className="p-4 dark:bg-[#1a1b23] dark:text-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <TitlePage
          header="Users"
          paragraph="Manage your user accounts and roles."
        />
        <div className="flex flex-col md:flex-row items-center gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-md border dark:bg-[#0d1321] dark:border-gray-600 dark:text-white"
          />
          {(role === "admin" || role === "editor") && (
            <Link href="/create">
              <MainBtn content="Add User" />
            </Link>
          )}
        </div>
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
              {filteredUsers?.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
              {filteredUsers?.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-gray-200 dark:border-gray-600"
                >
                  <td className="py-3 px-4 font-semibold">{user.name || "N/A"}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="capitalize">{user.role}</td>
                  <td className="py-3 px-4">
                    {user.createdAt
                      ? format(new Date(user.createdAt), "dd MMM yyyy")
                      : "—"}
                  </td>
                  <td className="py-3 px-4 space-x-2 flex justify-center flex-col md:flex-row items-center">
                    <Link href="/users/edit">
                      <button
                        onClick={() => handleSetUserData(user)}
                        className="px-2 py-1 rounded cursor-pointer"
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
                      className="px-2 py-1 rounded cursor-pointer"
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
              {error && (
                <tr>
                  <td colSpan={5} className="p-8 text-red-500">
                    <div className="max-w-md mx-auto bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-900/30">
                      <p className="font-bold text-lg mb-2">Error loading users</p>
                      <p className="text-sm mb-4">The system was unable to fetch the user list from Firebase Authentication.</p>

                      {error.message?.includes("Failed to fetch") && (
                        <div className="text-left text-xs bg-white dark:bg-[#0D1321] p-4 rounded-lg border border-red-200 dark:border-red-800 mb-4 space-y-2">
                          <p className="font-bold text-red-600 italic">Possible Cause: Missing Credentials</p>
                          <p>It looks like the <strong>Firebase Admin SDK</strong> is not configured yet.</p>
                          <p>Please ensure you have filled the <code>.env.local</code> file in the project root with your service account keys.</p>
                        </div>
                      )}

                      <button
                        onClick={fetchUsers}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                      >
                        Try Refreshing
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
