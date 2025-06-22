"use client";

import Image from "next/image";
import Link from "next/link";
import { db } from "@/firebaseConfig";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import format from "date-fns/format";
import defaultproduct from "../../../public/images/product-default.svg";
import MainBtn from "@/components/Mainbtn";
export default function ProductsPage() {
  const [value, loading, error] = useCollection(collection(db, "products"));

  const deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
  };

  return (
    <main className="p-4 dark:bg-[#1a1b23] h-[90vh] dark:text-white">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Products</h2>
        <Link href="/createproduct">
          <MainBtn content="Add Product" />
        </Link>
      </div>

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-white border dark:border-gray-600 border-gray-200 rounded-lg shadow">
          <thead className="">
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm dark:bg-[#6366f1] dark:text-white">
              <th className="py-3 px-4">Image</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className=" dark:bg-[#0D1321] text-center">
            {loading && (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            )}

            {value?.docs.map((doc) => {
              const data = doc.data();
              return (
                <tr
                  key={doc.id}
                  className="border-t border-gray-200 dark:border-gray-600 text-center"
                >
                  <td className="py-3 px-4">
                    <img
                      src={data.Image ? data.Image : defaultproduct}
                      alt={data.Name}
                      className="w-12 h-12 object-cover mx-auto rounded"
                    />
                  </td>
                  <td className="py-3 px-4">{data.Name}</td>
                  <td className="py-3 px-4">${data.Price}</td>
                  <td className="py-3 px-4">{data.Stock}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
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
                    <button
                      onClick={() => deleteProduct(doc.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
