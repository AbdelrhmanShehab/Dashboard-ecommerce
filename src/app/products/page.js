"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { db } from "../../firebaseConfig";
import imageCompression from "browser-image-compression";
import { limit } from "firebase/firestore";

import {
  collection,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import format from "date-fns/format";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");

const uploadNewImages = async (files) => {
  const uploadedUrls = [];

  for (const file of files) {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    });

    const imageRef = ref(
      storage,
      `products/${Date.now()}-${file.name}`
    );

    await uploadBytes(imageRef, compressedFile, {
      contentType: compressedFile.type,
      cacheControl: "public,max-age=31536000",
    });

    const url = await getDownloadURL(imageRef);
    uploadedUrls.push(url);
  }

  return uploadedUrls;
};
  /* ---------------- AUTH REDIRECT (FIXED) ---------------- */
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user, router]);

  if (user === null) return null;

  /* ---------------- FIRESTORE QUERY (OPTIMIZED) ---------------- */
  const productsQuery = query(
    collection(db, "products"),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  const [value, loading, error] = useCollection(productsQuery);

  /* ---------------- DELETE PRODUCT ---------------- */
  const deleteProduct = async (id) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this product?"
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete product.");
    }
  };

  /* ---------------- SORT HANDLER ---------------- */
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  /* ---------------- MAP DATA ---------------- */
  const products = useMemo(() => {
    if (!value) return [];

    return value.docs.map((docItem) => {
      const data = docItem.data();

      return {
        id: docItem.id,
        title: data.title || "Untitled",
        price: Number(data.price || 0),
        stock: Number(data.stock || 0),
        category: data.category || "-",
        status: data.status || "inactive",
        isBestSeller: data.isBestSeller || false,
        images: data.images || [],
        colors: data.colors || [],
        createdAt: data.createdAt || null,
      };
    });
  }, [value]);

  /* ---------------- FILTER + SORT (MEMOIZED) ---------------- */
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) =>
        product.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (sortField === "createdAt") {
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);

          return sortDirection === "asc"
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }

        if (typeof aVal === "number") {
          return sortDirection === "asc"
            ? aVal - bVal
            : bVal - aVal;
        }

        return sortDirection === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
  }, [products, searchTerm, sortField, sortDirection]);

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">
          Products
        </h1>

        <div className="flex gap-4 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-300 bg-white"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              🔍
            </span>
          </div>

          <Link href="/createproduct">
            <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition">
              Add Product
            </button>
          </Link>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-4 text-left">Image</th>
              <th className="p-4 cursor-pointer" onClick={() => handleSort("title")}>
                Name
              </th>
              <th className="p-4 cursor-pointer" onClick={() => handleSort("price")}>
                Price
              </th>
              <th className="p-4 cursor-pointer" onClick={() => handleSort("stock")}>
                Stock
              </th>
              <th className="p-4">Category</th>
              <th className="p-4 cursor-pointer" onClick={() => handleSort("createdAt")}>
                Created
              </th>
              <th className="p-4">Info</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="p-10 text-center text-gray-400">
                  Loading products…
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan={8} className="p-10 text-center text-red-500">
                  Failed to load products.
                </td>
              </tr>
            )}

            {!loading && filteredProducts.length === 0 && (
              <tr>
                <td colSpan={8} className="p-10 text-center text-gray-400">
                  No products found.
                </td>
              </tr>
            )}

            {filteredProducts.map((product) => (
              <tr
                key={product.id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="p-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border">
                    {product.images[0] && (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        width={48}
                        height={48}
                        className="object-cover hover:scale-110 transition"
                      />
                    )}
                  </div>
                </td>

                <td className="p-4 font-medium">
                  {product.title}
                </td>

                <td className="p-4">
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                    EGP {product.price}
                  </span>
                </td>

                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium
                    ${
                      product.stock === 0
                        ? "bg-red-100 text-red-700"
                        : product.stock < 5
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {product.stock} in stock
                  </span>
                </td>

                <td className="p-4 capitalize">
                  {product.category}
                </td>

                <td className="p-4">
                  {product.createdAt
                    ? format(
                        product.createdAt.toDate(),
                        "dd MMM yyyy"
                      )
                    : "-"}
                </td>

                <td className="p-4 text-xs space-y-1">
                  {product.isBestSeller && (
                    <div className="text-green-600 font-medium">
                      ⭐ Best Seller
                    </div>
                  )}
                  <div>{product.images.length} 📷</div>
                  <div>{product.colors.length} 🎨</div>
                </td>

                <td className="p-4 space-x-3">
                  <button
                    onClick={() =>
                      router.push(`/products/edit/${product.id}`)
                    }
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
