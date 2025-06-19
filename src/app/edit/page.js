"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Changed from 'next/router'
import { db } from "../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import Link from "next/link";

export default function Edit() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState(""); useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");

    if (!userData.id) {
      alert("No user selected for editing. Redirecting...");
      router.push("/users");
      return;
    }

    setId(userData.id);
    setName(userData.Name || "");
    setRole(userData.Role || "");
    setStatus(userData.Status || "");
  }, []);

  const [id, setId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");

    if (!userData.id) {
      alert("No user selected for editing. Redirecting...");
      router.push("/users");
      return;
    }

    setId(userData.id);
    setName(userData.Name || "");
    setRole(userData.Role || "");
    setStatus(userData.Status || "");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !role || !status || !id) {
      alert("All fields are required, including a valid ID.");
      return;
    }

    try {
      const userDoc = doc(db, "users", id);
      await updateDoc(userDoc, {
        Name: name,
        Role: role,
        Status: status,
      });
      router.push("/users");
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Error updating user. Check console for details.");
    }
  };


  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Edit User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="User Name"
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        <select
          value={role}
          required
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role (admin/editor)"
          className="w-full border border-gray-300 rounded px-4 py-2"
        >
          <option value="Role">Select Role</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2"
        >
          <option value="">Select Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="flex justify-center space-x-2">
          <button
            type="submit"
            className="border-1 text-[#111827] hover:bg-[#111827] hover:text-white px-4 py-2 rounded cursor-pointer"
          >
            Update
          </button>
          <Link href="/">
            <button className="border-1 text-[#111827] hover:text-white hover:bg-yellow-600 cursor-pointer px-4 py-2 rounded">
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}