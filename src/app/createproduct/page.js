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
    status: "active",
    price: "",
    stock: "",
    colors: [],
    sizes: [],
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

  // 🔥 ADD COLOR
  const addColor = (color) => {
    if (!color || form.colors.includes(color)) return;
    setForm(prev => ({
      ...prev,
      colors: [...prev.colors, color],
    }));
  };

  const removeColor = (color) => {
    setForm(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== color),
    }));
  };

  // 🔥 ADD SIZE
  const addSize = (size) => {
    if (!size || form.sizes.includes(size)) return;
    setForm(prev => ({
      ...prev,
      sizes: [...prev.sizes, size],
    }));
  };

  const removeSize = (size) => {
    setForm(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== size),
    }));
  };

  // 🔥 IMAGES
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }
    setForm(prev => ({ ...prev, imageFiles: files }));
  };

  // 🔥 SUBMIT
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
        sizes: form.sizes,
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
        status: "active",
        price: "",
        stock: "",
        colors: [],
        sizes: [],
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
    <div className="max-w-2xl mx-auto mt-10 p-8 rounded-2xl bg-white shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Create Product</h1>

      {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
      {success && <p className="bg-green-100 text-green-700 p-3 rounded mb-4">Product created successfully ✅</p>}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* NAME */}
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product name"
          required
          className="w-full border px-4 py-3 rounded-xl"
        />

        {/* DESCRIPTION */}
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Product description"
          required
          className="w-full border px-4 py-3 rounded-xl min-h-[120px]"
        />

        {/* CATEGORY */}
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
          className="w-full border px-4 py-3 rounded-xl"
        >
          <option value="">Select category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* PRICE + STOCK */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price (EGP)"
            required
            className="border px-4 py-3 rounded-xl"
          />
          <input
            type="number"
            name="stock"
            value={form.stock}
            onChange={handleChange}
            placeholder="Stock"
            required
            className="border px-4 py-3 rounded-xl"
          />
        </div>

        {/* COLORS */}
        <div>
          <h3 className="font-semibold mb-2">Colors</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              id="colorInput"
              placeholder="Add color"
              className="border px-3 py-2 rounded flex-1"
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById("colorInput");
                addColor(input.value.trim());
                input.value = "";
              }}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.colors.map((color, i) => (
              <div key={i} className="px-3 py-1 bg-purple-100 rounded-full text-sm flex gap-2">
                {color}
                <button type="button" onClick={() => removeColor(color)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* SIZES */}
        <div>
          <h3 className="font-semibold mb-2">Sizes (kg)</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              id="sizeInput"
              placeholder="Example: 80kg"
              className="border px-3 py-2 rounded flex-1"
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById("sizeInput");
                addSize(input.value.trim());
                input.value = "";
              }}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.sizes.map((size, i) => (
              <div key={i} className="px-3 py-1 bg-blue-100 rounded-full text-sm flex gap-2">
                {size}
                <button type="button" onClick={() => removeSize(size)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* IMAGES */}
        <div>
          <h3 className="font-semibold mb-2">Images (Max 5)</h3>
          <input type="file" multiple accept="image/*" onChange={handleImagesChange} />
          <div className="flex gap-3 mt-3 flex-wrap">
            {form.imageFiles.map((file, i) => (
              <img
                key={i}
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-20 h-20 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>

        {/* BEST SELLER */}
        <label className="flex gap-2 text-sm items-center">
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
          className="w-full bg-black text-white py-3 rounded-xl"
        >
          {loading ? "Saving..." : "Create Product"}
        </button>

      </form>
    </div>
  );
}
