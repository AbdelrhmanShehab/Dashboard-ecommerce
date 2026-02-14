"use client";

import { useEffect, useState } from "react";
import { db, storage } from "../../../../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter, useParams } from "next/navigation";
import VariantInput from "../../../../components/VariantInput";
import VariantTable from "../../../../components/VariantTable";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    status: "active",
    isBestSeller: false,
  });

  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  /* ---------------- LOAD PRODUCT ---------------- */
  useEffect(() => {
    const fetchProduct = async () => {
      const snap = await getDoc(doc(db, "products", id));

      if (!snap.exists()) {
        router.push("/products");
        return;
      }

      const data = snap.data();

      setForm({
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        status: data.status,
        isBestSeller: data.isBestSeller,
      });

      setVariants(data.variants || []);
      setImages(data.images || []);

      // Extract colors + sizes from variants
      const uniqueColors = [...new Set(data.variants.map(v => v.color))];
      const uniqueSizes = [...new Set(data.variants.map(v => v.size))];

      setColors(uniqueColors);
      setSizes(uniqueSizes);

      setLoading(false);
    };

    if (id) fetchProduct();
  }, [id]);

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    setError("");

    if (!form.title.trim()) return setError("Title required");
    if (!variants.length) return setError("No variants");

    try {
      setSaving(true);

      let uploaded = [];

      for (const file of newImages) {
        const refPath = ref(storage, `products/${Date.now()}-${file.name}`);
        await uploadBytes(refPath, file);
        const url = await getDownloadURL(refPath);
        uploaded.push(url);
      }

      await updateDoc(doc(db, "products", id), {
        ...form,
        price: Number(form.price),
        variants,
        images: [...images, ...uploaded],
        updatedAt: serverTimestamp(),
      });

      router.push("/products");

    } catch (err) {
      setError("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow">
      <h1 className="text-2xl font-semibold mb-6">
        Edit Product
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <input
        value={form.title}
        onChange={(e) =>
          setForm({ ...form, title: e.target.value })
        }
        placeholder="Title"
        className="w-full border p-3 rounded mb-4"
      />

      <textarea
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
        placeholder="Description"
        className="w-full border p-3 rounded mb-4"
      />

      <input
        type="number"
        value={form.price}
        onChange={(e) =>
          setForm({ ...form, price: e.target.value })
        }
        placeholder="Price"
        className="w-full border p-3 rounded mb-4"
      />

      <VariantTable
        variants={variants}
        setVariants={setVariants}
      />

      <input
        type="file"
        multiple
        onChange={(e) =>
          setNewImages(Array.from(e.target.files))
        }
        className="mt-6"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 bg-black text-white py-3 rounded-xl"
      >
        {saving ? "Saving..." : "Update Product"}
      </button>
    </div>
  );
}
