"use client";
import { useState } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Image from "next/image";
import Link from "next/link";
import format from "date-fns/format";
import TitlePage from "@/components/TitlePage";
import MainBtn from "@/components/Mainbtn";
import { useUser } from "@/context/UserContext";
import sortIcon from "../../../public/icons/sort-icon.svg";

export default function UserPage() {
  const [sortField, setSortField] = useState("Name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [value, loading, error] = useCollection(collection(db, "users"));
  const { setSelectedUser } = useUser();

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
      user.Name?.toLowerCase().startsWith(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "Created") {
        aVal = aVal?.toDate?.() ?? new Date(0);
        bVal = bVal?.toDate?.() ?? new Date(0);
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const handleSetUserData = (user) => {
    const { id, Name, Role, Status, Created } = user;
    setSelectedUser({
      id,
      Name,
      Role,
      Status,
      Created: Created?.toDate() || null,
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
          {/* ✅ Search input */}
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

      <div className="overflow-x-auto dark:bg-[#a0a0b0] roundeds">
        <table className="md:min-w-full w-[90%] bg-white border dark:border-gray-600 border-gray-200 rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm dark:bg-[#6366f1] dark:text-white">
              {["Name", "Role", "Status", "Created"].map((field) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="py-3 px-4 text-center cursor-pointer"
                >
                  {field}
                  <Image
                    src={sortIcon}
                    className={`inline-block ml-2 cursor-pointer dark:invert dark:brightness-200 ${
                      sortField === field ? "opacity-100" : "opacity-50"
                    }`}
                    width={18}
                    height={18}
                    alt="Sort"
                  />
                </th>
              ))}
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-center dark:bg-[#0D1321]">
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
                <td className="py-3 px-4">{user.Name}</td>
                <td className="py-3 px-4">{user.Role}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-1 rounded-lg text-xs ${
                      user.Status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.Status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {user.Created
                    ? format(user.Created.toDate(), "dd MMM yyyy")
                    : "N/A"}
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
    </main>
  );
}
