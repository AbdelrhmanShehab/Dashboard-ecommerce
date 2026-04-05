"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useUser } from "../../../context/UserContext";
import { useAuth } from "../../../context/AuthContext";
import { logActivity } from "../../../utils/logger";
import RoleGuard from "../../../components/RoleGuard";

export default function EditUserPage() {
    return (
        <RoleGuard allowedRoles={["admin", "worker"]}>
            <EditUserContent />
        </RoleGuard>
    );
}

function EditUserContent() {
    const { selectedUser } = useUser();
    const { user: currentAdmin } = useAuth();
    const router = useRouter();

    const [form, setForm] = useState({
        name: "",
        role: "worker",
        status: "active",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!selectedUser) {
            router.push("/users");
            return;
        }
        setForm({
            name: selectedUser.name || "",
            role: selectedUser.role || "worker",
            status: selectedUser.status || "active",
        });
    }, [selectedUser, router]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
        setSuccess("");
    };

    const handleUpdate = async () => {
        if (!form.name) {
            return setError("Name is required.");
        }

        try {
            setLoading(true);
            const userRef = doc(db, "users", selectedUser.id);

            await updateDoc(userRef, {
                name: form.name,
                role: form.role,
                status: form.status,
                updatedAt: serverTimestamp(),
            });

            await logActivity(
                "Updated User",
                `Modified user ${selectedUser.email}: Name to '${form.name}', Role to '${form.role}', Status to '${form.status}'`,
                currentAdmin
            );

            setSuccess("User updated successfully!");
            setTimeout(() => router.push("/users"), 1500);
        } catch (err) {
            console.error("Error updating user:", err);
            setError("Failed to update user.");
        } finally {
            setLoading(false);
        }
    };

    if (!selectedUser) return null;

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-[#0d1321] rounded-lg shadow mt-10">
            <h1 className="text-2xl font-bold mb-6">Edit User</h1>

            {error && <p className="text-red-500 mb-3">{error}</p>}
            {success && <p className="text-green-500 mb-3">{success}</p>}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Email (Read-only)</label>
                    <input
                        className="w-full px-4 py-2 rounded-md border bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                        value={selectedUser.email}
                        readOnly
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                        name="name"
                        placeholder="Full Name"
                        className="w-full px-4 py-2 rounded-md border dark:bg-[#1a1b23] dark:border-gray-600"
                        value={form.name}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                        name="role"
                        className="w-full px-4 py-2 rounded-md border dark:bg-[#1a1b23] dark:border-gray-600"
                        value={form.role}
                        onChange={handleChange}
                    >
                        <option value="admin">Admin</option>
                        <option value="worker">Worker</option>
                        <option value="editor">Customer</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                        name="status"
                        className="w-full px-4 py-2 rounded-md border dark:bg-[#1a1b23] dark:border-gray-600"
                        value={form.status}
                        onChange={handleChange}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        onClick={() => router.push("/users")}
                        className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={loading}
                        onClick={handleUpdate}
                        className="flex-1 bg-black text-white py-2 rounded-md disabled:opacity-50 dark:bg-blue-600"
                    >
                        {loading ? "Updating..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
