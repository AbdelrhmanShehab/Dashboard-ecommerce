"use client";
import { useRouter } from "next/router";
import Image from "next/image";

import Link from "next/link";
import { db } from "../../firebaseConfig";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import TitlePage from "@/components/TitlePage";
import format from "date-fns/format";
export default function Home() {
  const [value, loading, error] = useCollection(collection(db, "users"));

  const setID = (id, name, role, status, created) => {
    localStorage.setItem("id", id);
    localStorage.setItem("Name", name);
    localStorage.setItem("Role", role);
    localStorage.setItem("Status", status);
    localStorage.setItem("Created", created);
  };

  const deleted = async (id) => {
    await deleteDoc(doc(db, "users", id));
  };

  return (
    <div className="p-4">
      <div className="flex justify-between">
        <TitlePage
          header={"Products"}
          paragraph={"Manage your product inventory."}
        />
        <Link href="/create">
          <button className="p-4 bg-[#111827]  text-white rounded-lg cursor-pointer">
            Add User
          </button>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
              <th className="py-3 px-4 text-center">User</th>
              <th className="py-3 px-4 text-center">Role</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Created</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {loading && (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  Loading...
                </td>
              </tr>
            )}
            {value?.docs.map((doc) => {
              const data = doc.data();
              return (
                <tr key={doc.id} className="border-t border-gray-200">
                  <td className="py-3 px-4">{data.Name}</td>
                  <td className="py-3 px-4">{data.Role}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded-lg text-xs ${
                        data.Status === "active"
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
                        onClick={() =>
                          setID(
                            doc.id,
                            data.Name,
                            data.Role,
                            data.Status,
                            data.Created?.toDate()
                          )
                        }
                        className="px-2 py-1 rounded cursor-pointer"
                      >
                        <Image
                          src="/icons/edit-icon.svg"
                          width={20}
                          height={20}
                          alt="Picture of the author"
                        />{" "}
                      </button>
                    </Link>
                    <button
                      onClick={() => deleted(doc.id)}
                      className=" px-2 py-1 rounded cursor-pointer"
                    >
                      <Image
                        src="/icons/delete-icon.svg"
                        width={20}
                        height={20}
                        alt="Picture of the author"
                      />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
