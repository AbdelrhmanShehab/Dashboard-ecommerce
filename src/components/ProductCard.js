// components/ProductCard.js
import { memo, useMemo } from "react";
import Image from "next/image";
import TitlePage from "./TitlePage";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebaseConfig";

const ProductCard = memo(function ProductCard() {
  const productsQuery = query(
    collection(db, "products"),
    orderBy("Created", "desc"),
    limit(3)
  );

  const [snapshot, loading, error] = useCollection(productsQuery);

  const products = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((p) => p.Created);
  }, [snapshot]);

  if (loading)
    return (
      <div className="bg-white rounded-xl shadow p-6 mt-10 w-full dark:bg-[#0b1120]">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (error)
    return <div className="p-6 text-red-500">Error: {error.message}</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-10 w-full dark:bg-[#1a1b23] dark:text-white">
      <TitlePage header="Recent Products" paragraph="Latest products added." />
      <ul className="space-y-4">
        {products.map((product) => (
          <li key={product.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 rounded-md overflow-hidden border border-gray-300 flex-shrink-0">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.Name || "product"}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100" />
                )}
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">
                  {product.Name}
                </p>
                <p className="text-sm text-gray-500">${product.Price}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">{product.Stock} in stock</p>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default ProductCard;
