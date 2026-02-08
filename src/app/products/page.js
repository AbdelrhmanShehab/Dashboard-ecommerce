"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { db } from "../../firebaseConfig";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import format from "date-fns/format";
import defaultproduct from "../../../public/images/product-default.svg";
import MainBtn from "../../components/Mainbtn";
import sortIcon from "../../../public/icons/sort-icon.svg";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("Name");
  const [sortDirection, setSortDirection] = useState("asc");

  if (!user) router.push("/login");
  if (!user) return null;

  const [value, loading, error] = useCollection(
    collection(db, "products")
  );

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const products = value?.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.title ?? "Untitled",
      category: data.category ?? "-",
      imageUrl: data.image ?? null,
      images: data.images ?? [],
      price: Number(data.price ?? 0),
      stock: Number(data.stock ?? 0),
      status: data.status ?? "inactive",
      isBestSeller: data.isBestSeller ?? false,
      colors: data.colors ?? [],
      createdAt: data.createdAt ?? null,
    };
  });

  const sortedFilteredProducts = products
    ?.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortField === "Created") {
        const aDate = a.createdAt?.toDate?.() ?? new Date(0);
        const bDate = b.createdAt?.toDate?.() ?? new Date(0);
        return sortDirection === "asc"
          ? aDate - bDate
          : bDate - aDate;
      }

      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  return (
    <main className="p-4 dark:bg-[#1a1b23] h-[90vh] dark:text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Products</h2>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-md"
          />
          <Link href="/createproduct">
            <MainBtn content="Add Product" />
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white dark:bg-[#0D1321] rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100 dark:bg-[#6366f1] text-sm">
              <th>Image</th>
              {["Name", "Price", "Stock", "Category", "Created"].map(field => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className="cursor-pointer"
                >
                  {field}
                  <Image src={sortIcon} width={14} height={14} alt="" />
                </th>
              ))}
              <th>Info</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody className="text-center">
            {sortedFilteredProducts?.map(product => (
              <tr key={product.id} className="border-t">
                <td>
                  <img
                    src={product.imageUrl || defaultproduct.src}
                    className="w-12 h-12 mx-auto rounded object-cover"
                  />
                </td>
                <td>{product.name}</td>
                <td>EGP {product.price}</td>
                <td>{product.stock}</td>
                <td>{product.category}</td>
                <td>
                  {product.createdAt
                    ? format(product.createdAt.toDate(), "dd MMM yyyy")
                    : "-"}
                </td>

                {/* IMPORTANT INFO */}
                <td className="text-xs space-y-1">
                  {product.isBestSeller && (
                    <span className="text-green-600">★ Best Seller</span>
                  )}
                  <div>{product.images.length} images</div>
                  <div>{product.colors.length} colors</div>
                </td>

                <td className="flex gap-2 justify-center">
                  <button
                    onClick={() =>
                      router.push(`/products/edit/${product.id}`)
                    }
                    className="text-blue-600 text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan="9">Loading...</td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan="9" className="text-red-500">
                  {error.message}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
