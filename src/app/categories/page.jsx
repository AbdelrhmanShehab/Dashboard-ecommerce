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
    <main className="p-4 md:p-8 bg-gray-50/50 min-h-screen dark:bg-[#1a1b23] dark:text-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Product Categories</h1>
            <p className="text-gray-500 mt-1 dark:text-gray-400 font-medium">Manage your store's department structure and navigation labels.</p>
          </div>
        </header>

        {/* ADD CATEGORY FORM */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 mb-12 dark:bg-gray-900/40 dark:border-gray-800 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center dark:bg-white dark:text-black">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            Create New Category
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Category Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Menswear, Electronics, Home Decor..."
                className="w-full bg-gray-50/50 border border-gray-200 px-5 py-3 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-black/5 transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-white/5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Icon / Image</label>
              <div className="relative group overflow-hidden rounded-2xl">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="px-6 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-500 group-hover:bg-gray-100 transition-colors flex items-center gap-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="truncate max-w-[150px]">
                    {imageFile ? imageFile.name : 'Upload Category Image'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={addCategory}
              disabled={loading || !name.trim()}
              className="bg-black text-white px-10 py-3 rounded-2xl text-sm font-black h-[50px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 disabled:hover:scale-100 dark:bg-white dark:text-black shadow-lg shadow-black/10 dark:shadow-white/5"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin dark:border-black/20 dark:t-black" />
                  Processing...
                </div>
              ) : "Create Category"}
            </button>
          </div>
        </div>

        {/* CATEGORIES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 dark:bg-gray-900/20 dark:border-gray-800">
              <p className="text-gray-400 font-medium">No categories found. Start by creating one above.</p>
            </div>
          ) : (
            categories.map(cat => (
              <div
                key={cat.id}
                className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 dark:bg-gray-900/40 dark:border-gray-800"
              >
                <div className="flex flex-col items-center text-center gap-5">
                  {/* IMAGE */}
                  <div className="relative w-32 h-32 bg-gray-50 rounded-2xl p-1 overflow-hidden transition-all duration-500 group-hover:rotate-2 dark:bg-gray-800 shadow-inner">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-xl shadow-sm"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="w-full">
                    {editingId === cat.id ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                        <div className="relative">
                           <input
                            type="file"
                            accept="image/*"
                            onChange={e => setEditImageFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          <div className="text-[10px] uppercase font-black tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-900/20 py-2 rounded-lg cursor-pointer">
                            {editImageFile ? 'Ready to Change' : 'Update Icon'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{cat.name}</h3>
                        <p className="inline-block px-3 py-1 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-lg dark:bg-gray-800/50">
                          /{cat.slug}
                        </p>
                      </>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="w-full flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800/50">
                    {editingId === cat.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(cat)}
                          className="flex-1 text-xs font-bold text-green-600 hover:bg-green-50 py-2.5 rounded-xl transition-all dark:hover:bg-green-900/20"
                        >
                          Save Changes
                        </button>
                        <div className="w-px h-6 bg-gray-100 dark:bg-gray-800 mx-2" />
                        <button
                          onClick={cancelEdit}
                          className="flex-1 text-xs font-bold text-gray-400 hover:bg-gray-50 py-2.5 rounded-xl transition-all dark:hover:bg-gray-800/50"
                        >
                          Discard
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(cat)}
                          className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 py-2.5 rounded-xl transition-all dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Labels
                        </button>
                        <div className="w-px h-6 bg-gray-100 dark:bg-gray-800 mx-2" />
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-rose-500 hover:bg-rose-50 py-2.5 rounded-xl transition-all dark:text-rose-400 dark:hover:bg-rose-900/20"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 2 0 00-1-1h-4a1 2 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
