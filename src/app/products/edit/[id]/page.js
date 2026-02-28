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
import { useAuth } from "../../../../context/AuthContext";
import { logActivity } from "../../../../utils/logger";
import VariantInput from "../../../../components/VariantInput";
import VariantTable from "../../../../components/VariantTable";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [originalData, setOriginalData] = useState(null);

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

      setOriginalData({
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

      const changes = {};
      if (originalData?.title !== form.title) changes.title = { from: originalData?.title, to: form.title };
      if (originalData?.description !== form.description) changes.description = { from: originalData?.description, to: form.description };
      if (originalData?.category !== form.category) changes.category = { from: originalData?.category, to: form.category };
      if (Number(originalData?.price) !== Number(form.price)) changes.price = { from: originalData?.price, to: form.price };
      if (originalData?.status !== form.status) changes.status = { from: originalData?.status, to: form.status };
      if (originalData?.isBestSeller !== form.isBestSeller) changes.isBestSeller = { from: originalData?.isBestSeller ? "Yes" : "No", to: form.isBestSeller ? "Yes" : "No" };

      await logActivity("Updated Product", `Edited product: ${form.title}`, user, changes);

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
      {/* STATUS */}
      <div className="mb-4">
        <label className="block text-sm mb-2 font-medium">
          Status
        </label>

        <select
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value })
          }
          className="w-full border p-3 rounded"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* BEST SELLER */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="checkbox"
          id="isBestSeller"
          checked={form.isBestSeller}
          onChange={(e) =>
            setForm({ ...form, isBestSeller: e.target.checked })
          }
          className="w-4 h-4"
        />

        <label htmlFor="isBestSeller" className="text-sm">
          Mark as Best Seller
        </label>
      </div>

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
