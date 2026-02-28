"use client";
import { useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Image from "next/image";
import Link from "next/link";
import format from "date-fns/format";
import TitlePage from "../../components/TitlePage";
import MainBtn from "../../components/Mainbtn";
import { useUser } from "../../context/UserContext";
import sortIcon from "../../../public/icons/sort-icon.svg";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

import RoleGuard from "../../components/RoleGuard";

export default function UserPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <UserContent />
    </RoleGuard>
  );
}

function UserContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [sortField, setSortField] = useState("email");
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [value, loading, error] = useCollection(collection(db, "users"));
  const { setSelectedUser } = useUser();
  if (!user) router.push("/login");
  if (!user) return null;
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const users = value?.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "createdAt") {
        return sortDirection === "asc"
          ? (aVal?.toDate?.() ?? 0) - (bVal?.toDate?.() ?? 0)
          : (bVal?.toDate?.() ?? 0) - (aVal?.toDate?.() ?? 0);
      }

      return sortDirection === "asc"
        ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
        : String(bVal ?? "").localeCompare(String(aVal ?? ""));
    });

  const handleSetUserData = (user) => {
    const { id, name, role, status, createdAt } = user;
    setSelectedUser({
      id,
      name,
      role,
      status,
      createdAt: createdAt?.toDate() || null,
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "users", id));
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

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
          <Link href="/create">
            <MainBtn content="Add User" />
          </Link>
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
              {users?.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
              {users?.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-gray-200 dark:border-gray-600"
                >
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="capitalize">{user.role}</td>
                  <td>
                    <span
                      className={`inline-block px-2 py-1 rounded-lg text-xs ${user.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {user.createdAt
                      ? format(user.createdAt.toDate(), "dd MMM yyyy")
                      : "—"}
                  </td>
                  <td className="py-3 px-4 space-x-2 flex justify-center flex-col md:flex-row items-center">
                    <Link href="/edit">
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
                  <td colSpan={5} className="p-4 text-red-500">
                    Error loading users: {error.message}
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
