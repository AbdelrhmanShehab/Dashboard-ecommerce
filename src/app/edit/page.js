"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useUser } from "../../context/UserContext";
import MainBtn from "../../components/Mainbtn";

export default function Edit() {
  const router = useRouter();
  const { selectedUser } = useUser();

  const [name, setName] = useState("");
  const [role, setRole] = useState("editor");
  const [status, setStatus] = useState("active");
  const [id, setId] = useState("");

  useEffect(() => {
    if (!selectedUser) {
      router.push("/users");
      return;
    }

    setName(selectedUser.name ?? "");
    setRole(selectedUser.role ?? "editor");
    setStatus(selectedUser.status ?? "active");
    setId(selectedUser.id ?? "");
  }, [selectedUser, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateDoc(doc(db, "users", id), {
        name,
        role,
        status,
      });

      router.push("/users");
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto dark:text-white">
      <h2 className="text-xl font-bold mb-4">Edit User</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={name || ""}
          onChange={(e) => setName(e.target.value)}
          placeholder="User Name"
          className="w-full border rounded px-4 py-2"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border rounded px-4 py-2"
        >
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border rounded px-4 py-2"
        >
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>

        <div className="flex justify-center gap-3">
          <MainBtn content="Update" type="submit" />
          <Link href="/users">
            <MainBtn content="Cancel" />
          </Link>
        </div>
      </form>
    </div>
  );
}
