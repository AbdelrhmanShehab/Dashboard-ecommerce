
"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { db } from "../../firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import format from "date-fns/format";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

import RoleGuard from "../../components/RoleGuard";

export default function ProductsPage() {
  return (
    <RoleGuard allowedRoles={["admin", "editor"]}>
      <ProductsContent />
    </RoleGuard>
  );
}

function ProductsContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [productToDelete, setProductToDelete] = useState(null);


  /* ---------------- FIRESTORE QUERY ---------------- */
  const productsQuery = query(
    collection(db, "products"),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const [value, loading, error] = useCollection(productsQuery);

  /* ---------------- DELETE ---------------- */
  const deleteProduct = async () => {
    if (!productToDelete) return;

    await deleteDoc(doc(db, "products", productToDelete));
    setProductToDelete(null);
  };

  /* ---------------- MAP DATA ---------------- */
  const products = useMemo(() => {
    if (!value) return [];

    return value.docs.map((docItem) => {
      const data = docItem.data();

      const totalStock = data.variants
        ? data.variants.reduce((sum, v) => sum + v.stock, 0)
        : 0;

      return {
        id: docItem.id,
        title: data.title || "Untitled",
        price: Number(data.price || 0),
        category: data.category || "-",
        status: data.status || "inactive",
        isBestSeller: data.isBestSeller || false,
        images: data.images || [],
        variants: data.variants || [],
        totalStock,
        createdAt: data.createdAt || null,
      };
    });
  }, [value]);

  /* ---------------- FILTER ---------------- */
  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="p-6 bg-gray-50 min-h-screen dark:bg-[#1a1b23] dark:text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">
          Products
        </h1>

        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            className="border px-4 py-2 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />

          <Link href="/createproduct">
            <button className="bg-black text-white px-6 py-2 rounded-lg">
              Add Product
            </button>
          </Link>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden dark:bg-[#1a1b23] dark:border dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs dark:bg-gray-800 dark:text-gray-400">
            <tr>
              <th className="p-4 text-left">Image</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Price</th>
              <th className="p-4 text-left">Stock</th>
              <th className="p-4 text-left">Variants</th>
              <th className="p-4 text-left">Created</th>
              <th className="p-4 text-left">Actions</th>
              <th className="p-4 text-left">Best Seller</th>

            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="p-10 text-center">
                  Loading products…
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-red-500">
                  Failed to load products
                </td>
              </tr>
            )}

            {!loading &&
              filteredProducts.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="p-4">
                    {product.images[0] && (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        width={50}
                        height={50}
                        className="rounded object-cover"
                      />
                    )}
                  </td>

                  <td className="p-4 font-medium dark:text-white">
                    {product.title}
                  </td>

                  <td className="p-4 dark:text-gray-300">
                    EGP {product.price}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${product.totalStock === 0
                        ? "bg-red-100 text-red-700"
                        : product.totalStock < 5
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                        }`}
                    >
                      {product.totalStock} total
                    </span>
                  </td>

                  <td className="p-4">
                    {product.variants.length}
                  </td>

                  <td className="p-4">
                    {product.createdAt
                      ? format(
                        product.createdAt.toDate(),
                        "dd MMM yyyy"
                      )
                      : "-"}
                  </td>

                  <td className="p-4">
                    {product.isBestSeller ? (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                        ★ Best Seller
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-4 space-x-3">
                    <button
                      onClick={() =>
                        router.push(`/products/edit/${product.id}`)
                      }
                      className="text-blue-600"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        setProductToDelete(product.id)
                      }
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* DELETE MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="bg-white p-6 rounded-xl w-[400px] dark:bg-[#1a1b23] dark:border dark:border-gray-800 dark:text-white">
            <h2 className="font-semibold mb-4">
              Delete Product?
            </h2>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setProductToDelete(null)}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={deleteProduct}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
