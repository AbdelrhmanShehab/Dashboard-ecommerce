"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "../../../../firebaseConfig"; // ✅ FIXED PATH
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id; // ✅ safe access
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    status: "active",
    isBestSeller: false,
    colors: [],
    images: [],
  });

  const [newImages, setNewImages] = useState([]);

  // ✅ FETCH PRODUCT SAFELY
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const snap = await getDoc(doc(db, "products", id));

        if (!snap.exists()) {
          router.push("/products");
          return;
        }

        const data = snap.data();

        setForm({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          price: data.price || "",
          stock: data.stock || "",
          status: data.status || "active",
          isBestSeller: data.isBestSeller || false,
          colors: data.colors || [],
          images: data.images || [],
        });
      } catch (err) {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ✅ VALIDATION (NOW ACTUALLY USED)
  const validateForm = () => {
    if (!form.title.trim()) return "Title is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.category.trim()) return "Category is required";
    if (!form.price || Number(form.price) <= 0)
      return "Valid price required";
    if (form.stock === "" || Number(form.stock) < 0)
      return "Valid stock required";
    if (!form.status) return "Status required";
    if (!form.colors.length)
      return "Add at least one color";
    if (!form.images.length && !newImages.length)
      return "Add at least one image";

    return null;
  };

  // ✅ IMAGE UPLOAD
  const uploadNewImages = async () => {
    const uploadedUrls = [];

    for (const file of newImages) {
      const imageRef = ref(
        storage,
        `products/${Date.now()}-${file.name}`
      );

      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      uploadedUrls.push(url);
    }

    return uploadedUrls;
  };

  // ✅ SAVE WITH VALIDATION
  const handleSave = async () => {
    setError("");

    const validationError = validateForm();
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
        ...form,
        images: updatedImages,
        price: Number(form.price),
        stock: Number(form.stock),
        updatedAt: serverTimestamp(),
      });

      router.push("/products");
    } catch (err) {
      setError("Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-semibold mb-6">
        Edit Product
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* TITLE */}
      <input
        value={form.title}
        onChange={e =>
          setForm({ ...form, title: e.target.value })
        }
        placeholder="Product Title"
        className="w-full border p-3 rounded mb-4"
      />

      {/* DESCRIPTION */}
      <textarea
        value={form.description}
        onChange={e =>
          setForm({ ...form, description: e.target.value })
        }
        placeholder="Description"
        className="w-full border p-3 rounded mb-4 min-h-[120px]"
      />

      {/* PRICE + STOCK */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="number"
          value={form.price}
          onChange={e =>
            setForm({ ...form, price: e.target.value })
          }
          placeholder="Price"
          className="border p-3 rounded"
        />
        <input
          type="number"
          value={form.stock}
          onChange={e =>
            setForm({ ...form, stock: e.target.value })
          }
          placeholder="Stock"
          className="border p-3 rounded"
        />
      </div>

      {/* STATUS */}
      <select
        value={form.status}
        onChange={e =>
          setForm({ ...form, status: e.target.value })
        }
        className="w-full border p-3 rounded mb-4"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* BEST SELLER */}
      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={form.isBestSeller}
          onChange={e =>
            setForm({
              ...form,
              isBestSeller: e.target.checked,
            })
          }
        />
        Best Seller ⭐
      </label>

      {/* COLORS */}
      <div className="mb-4">
        <h3 className="font-medium mb-2">
          Colors
        </h3>

        <input
          type="text"
          placeholder="Type color and press Enter"
          className="border p-2 rounded w-full mb-2"
          onKeyDown={e => {
            if (e.key === "Enter" && e.target.value.trim()) {
              e.preventDefault();
              setForm(prev => ({
                ...prev,
                colors: [
                  ...prev.colors,
                  e.target.value.trim(),
                ],
              }));
              e.target.value = "";
            }
          }}
        />

        <div className="flex flex-wrap gap-2">
          {form.colors.map((color, i) => (
            <div
              key={i}
              className="px-3 py-1 bg-purple-100 rounded-full text-sm flex gap-2"
            >
              {color}
              <button
                onClick={() =>
                  setForm(prev => ({
                    ...prev,
                    colors: prev.colors.filter(
                      (_, index) => index !== i
                    ),
                  }))
                }
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* EXISTING IMAGES */}
      <div className="mb-4">
        <h3 className="font-medium mb-2">
          Images
        </h3>

        <div className="flex gap-3 flex-wrap">
          {form.images.map((img, i) => (
            <div key={i} className="relative w-24 h-24">
              <img
                src={img}
                className="w-full h-full object-cover rounded"
              />
              <button
                className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
                onClick={() =>
                  setForm(prev => ({
                    ...prev,
                    images: prev.images.filter(
                      (_, index) => index !== i
                    ),
                  }))
                }
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* NEW IMAGES */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={e =>
          setNewImages(
            Array.from(e.target.files || [])
          )
        }
        className="mb-6"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-black text-white py-3 rounded"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
