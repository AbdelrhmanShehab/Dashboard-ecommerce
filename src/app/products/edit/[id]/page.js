"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "../../../../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    price: "",
    stock: "",
    status: "",
    description: "",
    colors: [],
    images: [],
  });

  useEffect(() => {
    const fetchProduct = async () => {
      const snap = await getDoc(doc(db, "products", id));
      if (!snap.exists()) return router.push("/products");

      const data = snap.data();
      setForm({
        title: data.title ?? "",
        price: data.price ?? "",
        stock: data.stock ?? "",
        status: data.status ?? "",
        description: data.description ?? "",
        colors: data.colors ?? [],
        images: data.images ?? [],
      });

      setLoading(false);
    };

    fetchProduct();
  }, [id, router]);

  const handleSave = async () => {
    setSaving(true);

    await updateDoc(doc(db, "products", id), {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      updatedAt: serverTimestamp(),
    });

    router.push("/products");
  };

  if (loading) return <p className="p-6">Loading product...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Edit Product</h1>

      <input
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        placeholder="Title"
        className="w-full border p-2 mb-3"
      />

      <textarea
        value={form.description}
        onChange={e =>
          setForm({ ...form, description: e.target.value })
        }
        placeholder="Description"
        className="w-full border p-2 mb-3"
      />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          type="number"
          value={form.price}
          onChange={e =>
            setForm({ ...form, price: e.target.value })
          }
          placeholder="Price"
          className="border p-2"
        />
        <input
          type="number"
          value={form.stock}
          onChange={e =>
            setForm({ ...form, stock: e.target.value })
          }
          placeholder="Stock"
          className="border p-2"
        />
      </div>

      <select
        value={form.status}
        onChange={e =>
          setForm({ ...form, status: e.target.value })
        }
        className="w-full border p-2 mb-4"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-black text-white py-2 rounded"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
