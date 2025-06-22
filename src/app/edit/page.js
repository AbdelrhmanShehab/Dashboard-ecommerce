"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useUser } from "@/context/UserContext"; // 1. import the context
import MainBtn from "@/components/Mainbtn"; // Import MainBtn if needed

export default function Edit() {
  const router = useRouter();

  // 2. access user from context
  const { selectedUser } = useUser();

  // 3. local state for form fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [id, setId] = useState("");

  // 4. set initial values when context updates
  useEffect(() => {
    if (selectedUser) {
      setName(selectedUser.Name || "");
      setRole(selectedUser.Role || "");
      setStatus(selectedUser.Status || "");
      setId(selectedUser.id || "");
    }
  }, [selectedUser]); // only run when selectedUser is ready
  // 5. form submission logic
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !role || !status) {
      alert("All fields are required");
      return;
    }

    try {
      const userDoc = doc(db, "users", id);
      await updateDoc(userDoc, {
        Name: name,
        Role: role,
        Status: status,
      });
      router.push("/users"); // go back to users page
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  // 6. render the form
  return (
    <div className="p-8 max-w-xl mx-auto dark:text-white">
      <h2 className="text-xl font-bold mb-4">Edit User</h2>
      <form onSubmit={handleSubmit} className="space-y-4 dark:text-white">
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
          className="w-full border border-gray-300 rounded px-4 py-2 dark:text-white"
        >
          <option className="dark:text-gray-800" value="">
            Select Role
          </option>
          <option className="dark:text-gray-800" value="admin">
            Admin
          </option>
          <option className="dark:text-gray-800" value="user">
            User
          </option>
        </select>
        <select
          value={status}
          required
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2 "
        >
          <option value="">Select Status</option>
          <option className="dark:text-gray-800" value="active">
            Active
          </option>
          <option className="dark:text-gray-800" value="inactive">
            Inactive
          </option>
        </select>
        <div className="flex justify-center mt-4 space-x-2">
          <MainBtn content="Update" type="submit" />
          <Link href="/">
            <MainBtn content="Cancel" />
          </Link>
        </div>
      </form>
    </div>
  );
}
