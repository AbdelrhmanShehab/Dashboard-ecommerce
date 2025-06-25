"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/firebaseConfig";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import format from "date-fns/format";
import defaultproduct from "../../../public/images/product-default.svg";
import MainBtn from "@/components/Mainbtn";
import sortIcon from "../../../public/icons/sort-icon.svg";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("Name");
  const [sortDirection, setSortDirection] = useState("asc");

  const [value, loading, error] = useCollection(collection(db, "products"));

  const deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedFilteredProducts = value?.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((product) =>
      product.Name?.toLowerCase().startsWith(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "Created") {
        aVal = aVal?.toDate?.() ?? new Date(0);
        bVal = bVal?.toDate?.() ?? new Date(0);
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  return (
    <main className="p-4 dark:bg-[#1a1b23] h-[90vh] dark:text-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold">Products</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-md border dark:bg-[#0d1321] dark:border-gray-600 dark:text-white"
          />
          <Link href="/createproduct">
            <MainBtn content="Add Product" />
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-white border dark:border-gray-600 border-gray-200 rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm dark:bg-[#6366f1] dark:text-white">
              <th className="py-3 px-4">Image</th>

              {["Name", "Price", "Stock", "Status", "Created"].map((field) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="py-3 px-4 cursor-pointer text-center"
                >
                  {field}
                  <Image
                    src={sortIcon}
                    alt="Sort"
                    width={18}
                    height={18}
                    className={`inline-block ml-2 dark:invert dark:brightness-200 ${
                      sortField === field ? "opacity-100" : "opacity-50"
                    }`}
                  />
                </th>
              ))}

              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="dark:bg-[#0D1321] text-center">
            {loading && (
              <tr>
                <td colSpan="7" className="py-4">
                  Loading...
                </td>
              </tr>
            )}

            {sortedFilteredProducts?.length === 0 && !loading && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No products found.
                </td>
              </tr>
            )}

            {sortedFilteredProducts?.map((product) => (
              <tr
                key={product.id}
                className="border-t border-gray-200 dark:border-gray-600"
              >
                <td className="py-3 px-4">
                  <img
                    src={product.Image || defaultproduct}
                    alt={product.Name}
                    className="w-12 h-12 object-cover mx-auto rounded"
                  />
                </td>
                <td className="py-3 px-4">{product.Name}</td>
                <td className="py-3 px-4">${product.Price}</td>
                <td className="py-3 px-4">{product.Stock}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      product.Status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.Status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {product.Created
                    ? format(product.Created.toDate(), "dd MMM yyyy")
                    : "N/A"}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => deleteProduct(product.id)}
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
                <td colSpan="7" className="py-4 text-red-500 text-center">
                  Error: {error.message}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
