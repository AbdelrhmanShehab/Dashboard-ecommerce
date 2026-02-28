"use client";

import { useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { logActivity } from "../../utils/logger";

import RoleGuard from "../../components/RoleGuard";

export default function CreateUserPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <CreateUserContent />
    </RoleGuard>
  );
}

function CreateUserContent() {
  const { user: currentAdmin } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "editor",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleCreateUser = async () => {
    if (!form.name || !form.email || !form.password) {
      return setError("All fields are required.");
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: form.name,
        email: form.email,
        role: form.role,
        status: "active",
        createdAt: serverTimestamp(),
      });

      await logActivity("Created User", `Added new user: ${form.email} as ${form.role}`, currentAdmin);

      setSuccess("User created successfully 🎉");
      setForm({ name: "", email: "", password: "", role: "editor" });
    } catch (err) {
      setError(getFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-[#0d1321] rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Create Employee</h1>

      {error && <p className="text-red-500 mb-3">{error}</p>}
      {success && <p className="text-green-500 mb-3">{success}</p>}

      <input
        name="name"
        placeholder="Full Name"
        className="input"
        value={form.name}
        onChange={handleChange}
      />

      <input
        name="email"
        placeholder="Email"
        className="input"
        value={form.email}
        onChange={handleChange}
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        className="input"
        value={form.password}
        onChange={handleChange}
      />

      <select
        name="role"
        className="input"
        value={form.role}
        onChange={handleChange}
      >
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
      </select>

      <button
        disabled={loading}
        onClick={handleCreateUser}
        className="w-full bg-black text-white py-2 rounded mt-2 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create User"}
      </button>
    </div>
  );
}
