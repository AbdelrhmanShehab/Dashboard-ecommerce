"use client";

import { useEffect, useState, useMemo } from "react";
import { db, storage } from "../../firebaseConfig";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import VariantInput from "../../components/VariantInput";
import VariantTable from "../../components/VariantTable";
export default function CreateProductPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);

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

  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");

  const [variants, setVariants] = useState([]);

  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  /* ---------------- FETCH CATEGORIES ---------------- */
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

  /* ---------------- GENERATE VARIANTS ---------------- */
  useEffect(() => {
    setVariants(prevVariants => {
      const generated = [];

      colors.forEach(color => {
        sizes.forEach(size => {
          const id = `${color}-${size}`
            .toLowerCase()
            .replace(/\s/g, "");

          const existing = prevVariants.find(v => v.id === id);

          generated.push({
            id,
            color,
            size,
            stock: existing ? existing.stock : 0,
          });
        });
      });

      return generated;
    });
  }, [colors, sizes]);


  /* ---------------- IMAGE SELECT ---------------- */
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length + newImages.length > 7) {
      setError("Maximum 7 images allowed");
      return;
    }

    setNewImages(prev => [...prev, ...files]);

    const previews = files.map(file =>
      URL.createObjectURL(file)
    );

    setImagePreviews(prev => [...prev, ...previews]);
  };

  /* ---------------- IMAGE UPLOAD ---------------- */
  const uploadImages = async () => {
    const uploaded = [];

    for (const file of newImages) {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
      });

      const imageRef = ref(
        storage,
        `products/${Date.now()}-${file.name}`
      );

      await uploadBytes(imageRef, compressed);
      const url = await getDownloadURL(imageRef);
      uploaded.push(url);
    }

    return uploaded;
  };

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    if (!form.title.trim()) return "Title required";
    if (!form.description.trim()) return "Description required";
    if (!form.category) return "Category required";
    if (!form.price || Number(form.price) <= 0) return "Valid price required";
    if (!colors.length) return "Add at least one color";
    if (!sizes.length) return "Add at least one size";
    if (!variants.length) return "Variants not generated";
    if (variants.some(v => v.stock < 0)) return "Invalid stock value";
    if (!newImages.length) return "Add at least one image";

    return null;
  };

  /* ---------------- SAVE PRODUCT ---------------- */
  const handleSave = async () => {
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const uploadedImages = await uploadImages();
      const totalStock = variants.reduce(
        (sum, v) => sum + v.stock,
        0
      );

      await addDoc(collection(db, "products"), {
        title: form.title,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        status: form.status,
        isBestSeller: form.isBestSeller,
        images: uploadedImages,
        variants,
        totalStock, // ✅ ADD THIS
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push("/products");

    } catch (err) {
      console.error(err);
      setError("Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Create Product</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* TITLE */}
      <input
        placeholder="Title"
        className="w-full border p-3 rounded mb-4"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
      />

      {/* DESCRIPTION */}
      <textarea
        placeholder="Description"
        className="w-full border p-3 rounded mb-4"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
      />

      {/* CATEGORY */}
      <select
        className="w-full border p-3 rounded mb-4"
        value={form.category}
        onChange={e => setForm({ ...form, category: e.target.value })}
      >
        <option value="">Select Category</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* PRICE */}
      <input
        type="number"
        placeholder="Price"
        className="w-full border p-3 rounded mb-6"
        value={form.price}
        onChange={e => setForm({ ...form, price: e.target.value })}
      />

      {/* COLORS */}
      <VariantInput
        label="Colors"
        value={colorInput}
        setValue={setColorInput}
        items={colors}
        setItems={setColors}
      />

      {/* SIZES */}
      <VariantInput
        label="Sizes"
        value={sizeInput}
        setValue={setSizeInput}
        items={sizes}
        setItems={setSizes}
      />

      {/* VARIANT STOCK TABLE */}
      <VariantTable variants={variants} setVariants={setVariants} />

      {/* IMAGE UPLOAD */}
      <div className="mt-6">
        <input type="file" multiple accept="image/*" onChange={handleImageSelect} />
        <div className="flex gap-3 mt-3 flex-wrap">
          {imagePreviews.map((img, i) => (
            <img key={i} src={img} className="w-20 h-20 object-cover rounded" />
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 bg-black text-white py-3 rounded-xl"
      >
        {saving ? "Saving..." : "Create Product"}
      </button>
    </div>
  );
}
