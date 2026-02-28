"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "../../firebaseConfig";
import {
    collection,
    addDoc,
    getDocs,
    serverTimestamp,
    deleteDoc,
    doc,
    query,
    orderBy,
    writeBatch,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import RoleGuard from "../../components/RoleGuard";
import { logActivity } from "../../utils/logger";
import format from "date-fns/format";

export default function OffersPage() {
    return (
        <RoleGuard allowedRoles={["admin", "editor"]}>
            <OffersContent />
        </RoleGuard>
    );
}

function OffersContent() {
    const { user } = useAuth();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState("");
    const [type, setType] = useState("all"); // 'product', 'category', 'all'
    const [targetId, setTargetId] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");

    // Target Options (Products or Categories)
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);

    // Fetch initial data
    useEffect(() => {
        fetchOffers();
        fetchCategoriesAndProducts();
    }, []);

    const fetchOffers = async () => {
        setFetchLoading(true);
        try {
            const q = query(collection(db, "offers"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const offersData = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setOffers(offersData);
        } catch (err) {
            console.error("Error fetching offers: ", err);
        } finally {
            setFetchLoading(false);
        }
    };

    const fetchCategoriesAndProducts = async () => {
        try {
            // Fetch Categories
            const catSnap = await getDocs(collection(db, "categories"));
            setCategories(catSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));

            // Fetch Products
            const prodSnap = await getDocs(collection(db, "products"));
            setProducts(prodSnap.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title,
                category: doc.data().category,
                price: doc.data().price,
                originalPrice: doc.data().originalPrice,
                offerId: doc.data().offerId
            })));
        } catch (err) {
            console.error("Error fetching dependencies: ", err);
        }
    };

    // Open/Close Modal
    const openModal = () => {
        setName("");
        setType("all");
        setTargetId("");
        setDiscountPercentage("");
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);

    // Apply Offer Logic
    const handleCreateOffer = async (e) => {
        e.preventDefault();
        if (!name || !discountPercentage || isNaN(discountPercentage)) {
            alert("Please provide a valid name and discount percentage.");
            return;
        }

        if ((type === "product" || type === "category") && !targetId) {
            alert("Please select a target.");
            return;
        }

        setLoading(true);
        try {
            // 1. Create the Offer Document
            const offerData = {
                name,
                type,
                targetId: type === "all" ? null : targetId,
                discountPercentage: Number(discountPercentage),
                targetName: "", // We'll populate this for display purposes
                isActive: true,
                createdAt: serverTimestamp(),
            };

            if (type === "product") {
                offerData.targetName = products.find(p => p.id === targetId)?.title || "Unknown Product";
            } else if (type === "category") {
                // Find the category matching the ID (note: products collection stores category name usually, so targetId might be the category name or ID, we need to match)
                // Let's assume targetId is the category name for easier product matching later
                offerData.targetName = targetId;
            }

            const offerDocRef = await addDoc(collection(db, "offers"), offerData);
            const newOfferId = offerDocRef.id;

            // 2. Apply Offer to Products using Batch Update
            let matchingProducts = [];
            if (type === "all") {
                matchingProducts = products;
            } else if (type === "category") {
                matchingProducts = products.filter(p => p.category === targetId);
            } else if (type === "product") {
                matchingProducts = products.filter(p => p.id === targetId);
            }

            // Filter out products that already have an active offer to avoid overriding (optional, but requested per implementation to just set)
            // Actually, if we override, we should respect the originalPrice.

            if (matchingProducts.length > 0) {
                const batch = writeBatch(db);
                let updatedCount = 0;

                for (const prod of matchingProducts) {
                    const productRef = doc(db, "products", prod.id);

                    let pOriginalPrice = prod.originalPrice;
                    let currentPrice = Number(prod.price);

                    // If it doesn't have an originalPrice yet, set it now.
                    if (!pOriginalPrice) {
                        pOriginalPrice = currentPrice;
                    }

                    // Calculate new price based on the original price
                    const newPrice = Math.round(pOriginalPrice * (1 - (Number(discountPercentage) / 100)));

                    batch.update(productRef, {
                        originalPrice: pOriginalPrice,
                        price: newPrice,
                        offerId: newOfferId
                    });
                    updatedCount++;
                }

                await batch.commit();
                await logActivity("Offer Applied", `Applied ${discountPercentage}% off to ${updatedCount} products via offer: ${name}`, user);
            } else {
                await logActivity("Offer Created", `Created offer: ${name} (No products matched)`, user);
            }

            closeModal();
            fetchOffers();
            fetchCategoriesAndProducts(); // Refresh products with new prices
            alert("Offer created and applied successfully!");

        } catch (err) {
            console.error("Error creating offer: ", err);
            alert("Error creating offer: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Remove Offer Logic
    const handleRemoveOffer = async (offerId, offerName) => {
        if (!confirm(`Are you sure you want to remove offer "${offerName}" and revert prices?`)) return;

        setLoading(true);
        try {
            // Find products that have this offerId
            const productsToRevert = products.filter(p => p.offerId === offerId);

            if (productsToRevert.length > 0) {
                const batch = writeBatch(db);

                for (const prod of productsToRevert) {
                    const productRef = doc(db, "products", prod.id);

                    let revertedPrice = prod.originalPrice || prod.price; // Fallback to current if something went wrong

                    // Revert price and remove offer fields USING deleteField() if possible, but resetting is safer
                    batch.update(productRef, {
                        price: revertedPrice,
                        originalPrice: null, // Clear it
                        offerId: null // Clear it
                    });
                }
                await batch.commit();
            }

            // Delete the offer doc
            await deleteDoc(doc(db, "offers", offerId));

            await logActivity("Offer Removed", `Removed offer: ${offerName} and reverted ${productsToRevert.length} products`, user);

            fetchOffers();
            fetchCategoriesAndProducts(); // Refresh
            alert("Offer removed successfully!");

        } catch (err) {
            console.error("Error removing offer: ", err);
            alert("Error removing offer: " + err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <main className="p-6 bg-gray-50 min-h-screen dark:bg-[#1a1b23] dark:text-white">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-semibold">Offers & Discounts</h1>
                <button onClick={openModal} className="bg-black text-white px-6 py-2 rounded-lg">
                    Create Offer
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto dark:bg-[#1a1b23] dark:border dark:border-gray-800">
                <table className="w-full min-w-[800px] text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs dark:bg-gray-800 dark:text-gray-400">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Target</th>
                            <th className="p-4">Discount</th>
                            <th className="p-4">Created Date</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fetchLoading && <tr><td colSpan={6} className="p-10 text-center">Loading...</td></tr>}
                        {!fetchLoading && offers.length === 0 && <tr><td colSpan={6} className="p-10 text-center">No active offers.</td></tr>}
                        {!fetchLoading && offers.map((offer) => (
                            <tr key={offer.id} className="border-t dark:border-gray-700">
                                <td className="p-4 font-medium">{offer.name}</td>
                                <td className="p-4 capitalize">{offer.type}</td>
                                <td className="p-4">{offer.targetName || "All Products"}</td>
                                <td className="p-4 text-green-600 font-semibold">{offer.discountPercentage}%</td>
                                <td className="p-4">
                                    {offer.createdAt ? format(offer.createdAt.toDate(), "dd MMM yyyy, HH:mm") : "-"}
                                </td>
                                <td className="p-4">
                                    <button onClick={() => handleRemoveOffer(offer.id, offer.name)} className="text-red-500 hover:text-red-700 font-medium disabled:opacity-50" disabled={loading}>
                                        End Offer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CREATE OFFER MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#1a1b23] p-6 rounded-xl w-full max-w-md shadow-lg border dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-4">Create New Offer</h2>

                        <form onSubmit={handleCreateOffer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Offer Name</label>
                                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer Sale" className="w-full border p-2 rounded dark:bg-gray-800 dark:border-gray-600" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Discount Type</label>
                                <select value={type} onChange={(e) => { setType(e.target.value); setTargetId(""); }} className="w-full border p-2 rounded dark:bg-gray-800 dark:border-gray-600">
                                    <option value="all">All Products</option>
                                    <option value="category">Specific Category</option>
                                    <option value="product">Specific Product</option>
                                </select>
                            </div>

                            {type === "category" && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Select Category</label>
                                    <select required={type === "category"} value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-800 dark:border-gray-600">
                                        <option value="">-- Choose Category --</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.name}>{c.name}</option> // using name as targetId because products reference category by name
                                        ))}
                                    </select>
                                </div>
                            )}

                            {type === "product" && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Select Product</label>
                                    <select required={type === "product"} value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-800 dark:border-gray-600">
                                        <option value="">-- Choose Product --</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>{p.title} (EGP {p.price})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Discount Percentage (%)</label>
                                <input required type="number" min="1" max="99" value={discountPercentage} onChange={(e) => setDiscountPercentage(e.target.value)} placeholder="20" className="w-full border p-2 rounded dark:bg-gray-800 dark:border-gray-600" />
                            </div>

                            <div className="flex gap-4 justify-end mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg text-gray-600 dark:text-gray-300">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50">
                                    {loading ? "Applying..." : "Apply Offer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </main>
    );
}
