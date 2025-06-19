"use client";

import { useState } from "react";
import { db } from "@/firebaseConfig"; // Adjust the path as needed
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function CreateUserPage() {
  const [form, setForm] = useState({
    user: "",
    role: "",
    status: "",
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { user, role, status } = form;

    if (!user || !role || !status) {
      setError("All fields are required.");
      return;
    }

    try {
      await addDoc(collection(db, "users"), {
        Name: user,
        Role: role,
        Status: status,
        Created: serverTimestamp(),
      });

      setSuccess(true);
      setError("");
      setForm({ user: "", role: "", status: "" });
    } catch (err) {
      console.error("Error adding user:", err);
      setError("Failed to create user.");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 rounded-xl bg-white shadow">
      <h1 className="text-2xl font-bold mb-6">Create User</h1>

      {success && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          ✅ User created successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">User</label>
          <input
            type="text"
            name="user"
            value={form.user}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
            placeholder="Enter user name"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select role</option>
            <option value="Admin">Admin</option>
            <option value="Editor">User</option>
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
            <option value="">Select status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-[#111827] text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create User
        </button>
      </form>
    </div>
  );
}