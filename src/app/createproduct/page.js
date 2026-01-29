"use client";
import { useState, useEffect } from "react"; // <-- add this
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "../../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function CreateProduct() {
  const handleCheckbox = (e) => {
    setForm({ ...form, [e.target.name]: e.target.checked });
  };

  const [form, setForm] = useState({
    name: "",
    category: "",
    status: "",
    price: "",
    stock: "",
    imageUrl: null,
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      console.log("AUTH USER:", user);
    });

    return () => unsub();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      alert("Image too large! Max 800KB");
      return;
    }
    setForm((prev) => ({ ...prev, imageFile: file }));
  };
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      console.log("🔥 AUTH CHECK:", user ? user.uid : "NO USER");
    });

    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("SUBMIT CLICKED");

    try {
      console.log("AUTH USER:", auth.currentUser);
      console.log("FORM DATA:", form);

      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }

      let imageUrl = "";

      if (form.imageFile) {
        console.log("Uploading image...");

        const imageRef = ref(
          storage,
          `hedoomyy/${Date.now()}-${form.imageFile.name}`,
        );

        await uploadBytes(imageRef, form.imageFile);
        imageUrl = await getDownloadURL(imageRef);

        console.log("Image uploaded:", imageUrl);
      }
      await addDoc(collection(db, "products"), {
        title: form.name, // 🔥 match frontend
        category: form.category,
        status: form.status,
        price: Number(form.price),
        stock: Number(form.stock),
        image: imageUrl, // 🔥 match frontend
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
        imageUrl: null,
      });
      alert("Product added ✅");
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      alert(err.message || "Something crashed ❌");
    }
  };
  console.log("AUTH USER:", auth.currentUser);

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
            <option value="upper-wear">Upper-wear</option>
            <option value="bottoms">Bottoms</option>
            <option value="jackets">Jackets</option>
            <option value="full-sets">Full-sets</option>
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
          <label className="block mb-1 font-medium">Price (EGP)</label>
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

          {form.imageFile && (
            <img
              src={URL.createObjectURL(form.imageFile)}
              alt="Preview"
              className="mt-3 h-24 rounded border object-cover"
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="isBestSeller"
            checked={form.isBestSeller}
            onChange={handleCheckbox}
            className="h-4 w-4"
          />
          <label className="text-sm font-medium">Mark as Best Seller ⭐</label>
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
