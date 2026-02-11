"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";
import imageCompression from "browser-image-compression";

export default function EditProductPage() {
  const params = useParams();
  const id = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;


  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    status: "active",
    isBestSeller: false,
    colors: [],
    sizes: [],
    images: [],
  });

  const [newImages, setNewImages] = useState([]);
const uploadNewImages = async (files) => {
    const uploadedUrls = [];

    for (const file of files) {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });

      const imageRef = ref(
        storage,
        `products/${Date.now()}-${file.name}`
      );

      await uploadBytes(imageRef, compressedFile, {
        contentType: compressedFile.type,
        cacheControl: "public,max-age=31536000",
      });

      const url = await getDownloadURL(imageRef);
      uploadedUrls.push(url);
    }

    return uploadedUrls;
  };
  // 🔹 Fetch Categories
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

  // 🔹 Fetch Product
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }


    const fetchProduct = async () => {
      try {
        const snap = await getDoc(doc(db, "products", id));

        if (!snap.exists()) {
          router.push("/products");
          return;
        }

        const data = snap.data();

        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          category: data.category ?? "",
          price: data.price ?? "",
          stock: data.stock ?? "",
          status: data.status ?? "active",
          isBestSeller: data.isBestSeller ?? false,
          colors: data.colors ?? [],
          sizes: data.sizes ?? [],
          images: data.images ?? [],
        });

      } catch (err) {
        console.error("Firestore error:", err);
        setError("Failed to load product");
      }
      finally {
        setLoading(false); // 🚨 Always stop loading
      }
    };

    fetchProduct();

  }, [id]);


  // ---------- VALIDATION ----------
  const validateForm = () => {
    if (!form.title.trim()) return "Title is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.category.trim()) return "Category is required";

    if (!form.price || Number(form.price) <= 0)
      return "Price must be greater than 0";

    if (form.stock === "" || Number(form.stock) < 0)
      return "Stock must be 0 or more";

    if (!form.status) return "Status is required";

    if (!form.colors.length) return "Add at least one color";
    if (!form.sizes.length) return "Add at least one size";

    if (!form.images.length && !newImages.length)
      return "Add at least one image";

    if (form.images.length + newImages.length > 5)
      return "Maximum 5 images allowed";

    return null;
  };

  // ---------- IMAGE UPLOAD ----------
  
  // ---------- SAVE ----------
  const handleSave = async () => {
    setError("");
    const validationError = validateForm();

    if (newImages.length > 0) {
      const uploaded = await uploadNewImages(newImages);
      updatedImages = [...updatedImages, ...uploaded];
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      let updatedImages = [...form.images];

      if (newImages.length > 0) {
        const uploaded = await uploadNewImages();
        updatedImages = [...updatedImages, ...uploaded];
      }

      await updateDoc(doc(db, "products", id), {
        title: form.title,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        status: form.status,
        isBestSeller: form.isBestSeller,
        colors: form.colors,
        sizes: form.sizes,
        images: updatedImages,
        updatedAt: serverTimestamp(),
      });

      router.push("/products");

    } catch (err) {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Edit Product</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* TITLE */}
      <input
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        placeholder="Product Title"
        className="w-full border p-3 rounded mb-4"
      />

      {/* DESCRIPTION */}
      <textarea
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        placeholder="Description"
        className="w-full border p-3 rounded mb-4 min-h-[120px]"
      />

      {/* CATEGORY */}
      <select
        value={form.category}
        onChange={e => setForm({ ...form, category: e.target.value })}
        className="w-full border p-3 rounded mb-4"
      >
        <option value="">Select Category</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* PRICE + STOCK */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="number"
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
          placeholder="Price"
          className="border p-3 rounded"
        />
        <input
          type="number"
          value={form.stock}
          onChange={e => setForm({ ...form, stock: e.target.value })}
          placeholder="Stock"
          className="border p-3 rounded"
        />
      </div>

      {/* STATUS */}
      <select
        value={form.status}
        onChange={e => setForm({ ...form, status: e.target.value })}
        className="w-full border p-3 rounded mb-4"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* BEST SELLER */}
      <label className="flex items-center gap-2 mb-6">
        <input
          type="checkbox"
          checked={form.isBestSeller}
          onChange={e =>
            setForm({ ...form, isBestSeller: e.target.checked })
          }
        />
        Best Seller ⭐
      </label>

      {/* COLORS */}
      <h3 className="font-semibold mb-2">Colors</h3>
      <input
        type="text"
        placeholder="Add color and press Enter"
        onKeyDown={e => {
          if (e.key === "Enter" && e.target.value.trim()) {
            e.preventDefault();
            setForm(prev => ({
              ...prev,
              colors: [...prev.colors, e.target.value.trim()],
            }));
            e.target.value = "";
          }
        }}
        className="border p-2 rounded mb-2 w-full"
      />
      <div className="flex flex-wrap gap-2 mb-6">
        {form.colors.map((color, i) => (
          <span
            key={i}
            className="bg-purple-100 px-3 py-1 rounded-full text-sm flex gap-2"
          >
            {color}
            <button
              onClick={() =>
                setForm(prev => ({
                  ...prev,
                  colors: prev.colors.filter(c => c !== color),
                }))
              }
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* SIZES */}
      <h3 className="font-semibold mb-2">Sizes</h3>
      <input
        type="text"
        placeholder="Add size (e.g. 80kg) and press Enter"
        onKeyDown={e => {
          if (e.key === "Enter" && e.target.value.trim()) {
            e.preventDefault();
            setForm(prev => ({
              ...prev,
              sizes: [...prev.sizes, e.target.value.trim()],
            }));
            e.target.value = "";
          }
        }}
        className="border p-2 rounded mb-2 w-full"
      />
      <div className="flex flex-wrap gap-2 mb-6">
        {form.sizes.map((size, i) => (
          <span
            key={i}
            className="bg-blue-100 px-3 py-1 rounded-full text-sm flex gap-2"
          >
            {size}
            <button
              onClick={() =>
                setForm(prev => ({
                  ...prev,
                  sizes: prev.sizes.filter(s => s !== size),
                }))
              }
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* EXISTING IMAGES */}
      <h3 className="font-semibold mb-2">Images</h3>
      <div className="flex gap-3 flex-wrap mb-4">
        {form.images.map((img, i) => (
          <div key={i} className="relative w-24 h-24">
            <img
              src={img}
              className="w-full h-full rounded object-cover"
            />
            <button
              className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
              onClick={() =>
                setForm(prev => ({
                  ...prev,
                  images: prev.images.filter((_, index) => index !== i),
                }))
              }
            >
              X
            </button>
          </div>
        ))}
      </div>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={e =>
          setNewImages(Array.from(e.target.files || []))
        }
        className="mb-6"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-black text-white py-3 rounded-xl"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
