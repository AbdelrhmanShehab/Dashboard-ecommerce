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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    status: "",
    price: "",
    stock: "",
    imageFile: null,
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
      if (!user) {
        setError("Not authenticated");
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      alert("Image too large (max 800KB)");
      return;
    }

    setForm(prev => ({ ...prev, imageFile: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }

      if (!form.category) {
        throw new Error("Category is required");
      }

      setLoading(true);

      let imageUrl = "";

      if (form.imageFile) {
        const imageRef = ref(
          storage,
          `products/${Date.now()}-${form.imageFile.name}`
        );
        await uploadBytes(imageRef, form.imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "products"), {
        title: form.name,
        category: form.category, // slug
        status: form.status,
        price: Number(form.price),
        stock: Number(form.stock),
        image: imageUrl,
        isBestSeller: form.isBestSeller,
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setForm({
        name: "",
        category: "",
        status: "",
        price: "",
        stock: "",
        imageFile: null,
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

      {success && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          Product created successfully ✅
        </div>
      )}

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product name"
          required
          className="w-full border px-3 py-2 rounded"
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

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">Select status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Price (EGP)"
          required
          className="w-full border px-3 py-2 rounded"
        />

        <input
          type="number"
          name="stock"
          value={form.stock}
          onChange={handleChange}
          placeholder="Stock"
          required
          className="w-full border px-3 py-2 rounded"
        />

        <input type="file" accept="image/*" onChange={handleImageChange} />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isBestSeller"
            checked={form.isBestSeller}
            onChange={handleChange}
          />
          Mark as Best Seller ⭐
        </label>

        <button
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded"
        >
          {loading ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
