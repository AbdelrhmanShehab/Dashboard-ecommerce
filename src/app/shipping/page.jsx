"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import {
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import RoleGuard from "../../components/RoleGuard";

export default function Shipping() {
    return (
        <RoleGuard allowedRoles={["admin", "worker"]}>
            <ShippingContent />
        </RoleGuard>
    );
}

function ShippingContent() {
    const { role } = useAuth();
    const [cityName, setCityName] = useState("");
    const [fee, setFee] = useState("");
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const citiesRef = collection(db, "cities");

    const fetchCities = async () => {
        const snap = await getDocs(citiesRef);
        const citiesList = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        // Sort cities by name for better UX
        citiesList.sort((a, b) => a.id.localeCompare(b.id));
        setCities(citiesList);
    };

    useEffect(() => {
        fetchCities();
    }, []);

    const handleSave = async () => {
        if (!cityName.trim() || !fee) return;

        setLoading(true);
        try {
            const cityId = cityName.trim();
            await setDoc(doc(db, "cities", cityId), {
                fee: Number(fee),
                updatedAt: serverTimestamp(),
            });

            setCityName("");
            setFee("");
            setEditingId(null);
            await fetchCities();
        } catch (error) {
            console.error("Error saving city:", error);
            alert("Failed to save city. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (city) => {
        setEditingId(city.id);
        setCityName(city.id);
        setFee(city.fee.toString());
    };

    const cancelEdit = () => {
        setEditingId(null);
        setCityName("");
        setFee("");
    };

    const handleDelete = async (id) => {
        if (!confirm(`Delete shipping info for ${id}?`)) return;
        try {
            await deleteDoc(doc(db, "cities", id));
            await fetchCities();
        } catch (error) {
            console.error("Error deleting city:", error);
            alert("Failed to delete city.");
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto dark:text-white">
            <h1 className="text-2xl font-bold mb-6">Shipping Fees Management</h1>

            {/* ADD / EDIT CITY */}
            {role === "admin" && (
                <div className="bg-white p-6 rounded-xl shadow mb-8 dark:bg-gray-800 dark:border dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
                        {editingId ? `Edit ${editingId}` : "Add New City"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            value={cityName}
                            onChange={(e) => setCityName(e.target.value)}
                            placeholder="City name (e.g. Cairo)"
                            disabled={editingId !== null}
                            className="border px-4 py-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="number"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                            placeholder="Shipping fee (EGP)"
                            className="border px-4 py-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-1 bg-black text-white px-5 py-2 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Saving..." : editingId ? "Update Fee" : "Add City"}
                            </button>
                            {editingId && (
                                <button
                                    onClick={cancelEdit}
                                    className="px-5 py-2 border rounded text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">
                        * City name is used as the unique identifier.
                    </p>
                </div>
            )}

            {/* CITIES LIST */}
            <div className="bg-white rounded-xl shadow overflow-hidden dark:bg-gray-800 dark:border dark:border-gray-700">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <tr>
                            <th className="px-6 py-3 font-semibold">City</th>
                            <th className="px-6 py-3 font-semibold">Fee (EGP)</th>
                            {role === "admin" && <th className="px-6 py-3 font-semibold text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {cities.length === 0 ? (
                            <tr>
                                <td colSpan={role === "admin" ? 3 : 2} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No shipping fees defined yet.
                                </td>
                            </tr>
                        ) : (
                            cities.map((city) => (
                                <tr key={city.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                    <td className="px-6 py-4 font-medium">{city.id}</td>
                                    <td className="px-6 py-4">{city.fee} EGP</td>
                                    {role === "admin" && (
                                        <td className="px-6 py-4 text-right flex justify-end gap-3 text-sm">
                                            <button
                                                onClick={() => startEdit(city)}
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(city.id)}
                                                className="text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
