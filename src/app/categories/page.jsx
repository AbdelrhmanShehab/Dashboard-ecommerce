"use client";

import { useEffect, useState } from "react";
import { db, storage } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

import RoleGuard from "../../components/RoleGuard";

export default function Categories() {
  return (
    <RoleGuard allowedRoles={["admin", "editor"]}>
      <CategoriesContent />
    </RoleGuard>
  );
}

function CategoriesContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);


  const categoriesRef = collection(db, "categories");

  const fetchCategories = async () => {
    const snap = await getDocs(categoriesRef);
    setCategories(
      snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* ---------------- ADD CATEGORY ---------------- */

  const addCategory = async () => {
    if (!name.trim()) return;

    setLoading(true);

    let imageUrl = "";

    if (imageFile) {
      const imgRef = ref(
        storage,
        `categories/${Date.now()}-${imageFile.name}`
      );
      await uploadBytes(imgRef, imageFile);
      imageUrl = await getDownloadURL(imgRef);
    }

    await addDoc(categoriesRef, {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      image: imageUrl,
      createdAt: serverTimestamp(),
    });

    setName("");
    setImageFile(null);
    setLoading(false);
    fetchCategories();
  };

  /* ---------------- EDIT CATEGORY ---------------- */

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditImageFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditImageFile(null);
  };

  const saveEdit = async (cat) => {
    let imageUrl = cat.image || "";

    if (editImageFile) {
      const imgRef = ref(
        storage,
        `categories/${Date.now()}-${editImageFile.name}`
      );
      await uploadBytes(imgRef, editImageFile);
      imageUrl = await getDownloadURL(imgRef);
    }

    await updateDoc(doc(db, "categories", cat.id), {
      name: editName,
      slug: editName.toLowerCase().replace(/\s+/g, "-"),
      image: imageUrl,
      updatedAt: serverTimestamp(),
    });

    cancelEdit();
    fetchCategories();
  };

  /* ---------------- DELETE CATEGORY ---------------- */

  const deleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;
    await deleteDoc(doc(db, "categories", id));
    fetchCategories();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto dark:text-white">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      {/* ADD CATEGORY */}
      <div className="bg-white p-4 rounded-xl shadow mb-8 flex gap-3 items-center dark:bg-gray-800 dark:border dark:border-gray-700">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Category name"
          className="border px-3 py-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={addCategory}
          disabled={loading}
          className="bg-black text-white px-5 py-2 rounded"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      {/* CATEGORIES GRID */}
      <div className="grid md:grid-cols-2 gap-4">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="border rounded-xl p-4 flex gap-4 items-center bg-white dark:bg-gray-800 dark:border-gray-700"
          >
            {/* IMAGE */}
            <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0 dark:bg-gray-700">
              {cat.image && (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* CONTENT */}
            <div className="flex-1">
              {editingId === cat.id ? (
                <>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="border px-2 py-1 rounded w-full mb-2"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={e =>
                      setEditImageFile(e.target.files?.[0] || null)
                    }
                  />
                </>
              ) : (
                <>
                  <p className="font-medium text-gray-900 dark:text-white">{cat.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {cat.slug}
                  </p>
                </>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col gap-2 text-sm">
              {editingId === cat.id ? (
                <>
                  <button
                    onClick={() => saveEdit(cat)}
                    className="text-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-500"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
