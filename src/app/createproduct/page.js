"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function CreateProduct() {
  const [form, setForm] = useState({
    name: "",
    category: "",
    status: "",
    price: "",
    stock: "",
    image: "",
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Load saved image from localStorage on page load
  useEffect(() => {
    const savedImage = localStorage.getItem("productImage");
    if (savedImage) {
      setForm((prev) => ({ ...prev, image: savedImage }));
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      alert(
        "Image too large! Please choose a smaller image (less than 800KB)."
      );
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;
      setForm((prev) => ({ ...prev, image: base64Image }));

      // Save to localStorage so it survives refresh
      localStorage.setItem("productImage", base64Image);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, category, status, price, stock, image } = form;
    if (!name || !category || !status || !price || !stock) {
      setError("All fields except image are required.");
      return;
    }

    try {
      await addDoc(collection(db, "products"), {
        Name: name,
        Category: category,
        Status: status,
        Price: parseFloat(price),
        Stock: parseInt(stock),
        Image: image || "/images/product-default.svg", 
        Created: serverTimestamp(),
      });

      setSuccess(true);
      setError("");
      setForm({
        name: "",
        category: "",
        status: "",
        price: "",
        stock: "",
        image: "",
      });

      // Clear localStorage after saving
      localStorage.removeItem("productImage");
    } catch (err) {
      console.error("Firestore Error:", err.message);
      setError("Failed to create product.");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 rounded-xl bg-white shadow">
      <h1 className="text-2xl font-bold mb-6">Create Product</h1>

      {success && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          ✅ Product created successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Product Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
            placeholder="Enter Product Name"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select Category</option>
            <option value="Electronics">Electronics</option>
            <option value="Accessories">Accessories</option>
            <option value="Furniture">Furniture</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Price ($)</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
            min="1"
            max="10000"
            className="w-full border px-3 py-2 rounded"
            placeholder="Enter price"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Stock</label>
          <input
            type="number"
            name="stock"
            value={form.stock}
            onChange={handleChange}
            required
            min="1"
            max="1000"
            className="w-full border px-3 py-2 rounded"
            placeholder="Enter stock quantity"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Product Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border px-3 py-2 rounded"
          />
          {form.image && (
            <img
              src={form.image}
              alt="preview"
              className="mt-3 h-24 rounded border object-cover"
            />
          )}
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded text-white w-full bg-[#111827] cursor-pointer hover:bg-blue-700"
        >
          Create Product
        </button>
      </form>
    </div>
  );
}
