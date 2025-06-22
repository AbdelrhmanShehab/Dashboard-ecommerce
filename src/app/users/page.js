"use client";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Image from "next/image";
import Link from "next/link";
import format from "date-fns/format";
import TitlePage from "@/components/TitlePage";
import MainBtn from "@/components/Mainbtn";
export default function UserPage() {
  const [value, loading, error] = useCollection(collection(db, "users"));

  const handleSetUserData = (user) => {
    const { id, Name, Role, Status, Created } = user;
    const userData = {
      id,
      Name,
      Role,
      Status,
      Created: Created?.toDate() || null,
    };
    localStorage.setItem("user", JSON.stringify(userData));
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
      <div className="flex justify-between items-center mb-4">
        <TitlePage
          header="Users"
          paragraph="Manage your user accounts and roles."
        />
        <Link href="/create">
          <MainBtn content='Add User' />
        </Link>
      </div>

      <div className="overflow-x-auto dark:bg-[#a0a0b0] roundeds">
        <table className="min-w-full bg-white border dark:border-gray-600 border-gray-200 rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm dark:bg-[#6366f1] dark:text-white">
              <th className="py-3 px-4 text-center ">User</th>
              <th className="py-3 px-4 text-center">Role</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Created</th>
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
            {value?.docs.map((doc) => {
              const data = doc.data();
              const user = {
                id: doc.id,
                ...data,
              };
              return (
                <tr key={doc.id} className="border-t border-gray-200 dark:border-gray-600">
                  <td className="py-3 px-4">{data.Name}</td>
                  <td className="py-3 px-4">{data.Role}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded-lg text-xs ${data.Status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                        }`}
                    >
                      {data.Status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {data.Created
                      ? format(data.Created.toDate(), "dd MMM yyyy")
                      : "N/A"}
                  </td>
                  <td className="py-3 px-4 space-x-2">
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
                      onClick={() => handleDelete(doc.id)}
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
              );
            })}
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
