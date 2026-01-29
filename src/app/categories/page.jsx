"use client";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export default function Categories() {
  const [name, setName] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const categoriesRef = collection(db, "categories");

  // Fetch categories
  const fetchCategories = async () => {
    const snapshot = await getDocs(categoriesRef);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setCategories(data);
  };

  // Add category
  const addCategory = async () => {
    if (!name.trim()) return;

    setLoading(true);

    await addDoc(categoriesRef, {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      createdAt: serverTimestamp(),
    });

    setName("");
    setLoading(false);
    fetchCategories();
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h2>Categories</h2>

      {/* Add category */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
        />
        <button onClick={addCategory} disabled={loading}>
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      {/* Categories list */}
      <ul>
        {categories.map((cat) => (
          <li key={cat.id}>
            <strong>{cat.name}</strong>
            <span style={{ color: "#888" }}> — {cat.slug}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
