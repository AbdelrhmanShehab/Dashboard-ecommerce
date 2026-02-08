"use client";

import { useEffect, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "../../firebaseConfig";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function CreateProduct() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    status: "", 
    price: "",
    stock: "",
    colors: [],
    imageFiles: [],
    isBestSeller: false,
  });

  // 🔹 Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, "categories"));
      setCategories(
        snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    };
    fetchCategories();
  }, []);

  // 🔹 Auth check
  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      if (!user) setError("Not authenticated");
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleColorsChange = (e) => {
    setForm(prev => ({
      ...prev,
      colors: e.target.value
        .split(",")
        .map(c => c.trim())
        .filter(Boolean),
    }));
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }
    setForm(prev => ({ ...prev, imageFiles: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      if (!auth.currentUser) throw new Error("Not authenticated");

      setLoading(true);

      const imageUrls = [];

      for (const file of form.imageFiles) {
        const imageRef = ref(
          storage,
          `products/${Date.now()}-${file.name}`
        );
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        imageUrls.push(url);
      }

      await addDoc(collection(db, "products"), {
        title: form.name,
        description: form.description,
        category: form.category,
        status: form.status,
        price: Number(form.price),
        stock: Number(form.stock),
        colors: form.colors,
        images: imageUrls,
        isBestSeller: form.isBestSeller,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
      setForm({
        name: "",
        description: "",
        category: "",
        status: "",
        price: "",
        stock: "",
        colors: [],
        imageFiles: [],
        isBestSeller: false,
      });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 rounded-xl bg-white shadow">
      <h1 className="text-2xl font-bold mb-6">Create Product</h1>

      {error && <p className="bg-red-100 text-red-700 p-2 rounded">{error}</p>}
      {success && <p className="bg-green-100 text-green-700 p-2 rounded">Product created ✅</p>}

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product name"
          required
          className="w-full border px-3 py-2 rounded"
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Product description"
          required
          className="w-full border px-3 py-2 rounded min-h-[120px]"
        />

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">Select category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Colors (comma separated)"
          onChange={handleColorsChange}
          className="w-full border px-3 py-2 rounded"
        />

        <input type="file" multiple accept="image/*" onChange={handleImagesChange} />

        <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="Price" required className="w-full border px-3 py-2 rounded" />
        <input type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="Stock" required className="w-full border px-3 py-2 rounded" />

        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="isBestSeller" checked={form.isBestSeller} onChange={handleChange} />
          Best Seller ⭐
        </label>

        <button disabled={loading} className="w-full bg-black text-white py-2 rounded">
          {loading ? "Saving..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
