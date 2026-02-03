    "use client";

    import { signInWithEmailAndPassword } from "firebase/auth";
    import { auth } from "../../../firebaseConfig";
    import { useState } from "react";
    import { useRouter } from "next/navigation";

    export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e) => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/dashboard");
    } catch {
        setError("Invalid credentials");
    }
    };



    return (
        <div className="h-screen flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-96 p-6 shadow rounded">
            <h1 className="text-xl font-bold mb-4">Dashboard Login</h1>

            {error && <p className="text-red-500">{error}</p>}

            <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 border p-2"
            onChange={(e) => setEmail(e.target.value)}
            />

            <input
            type="password"
            placeholder="Password"
            className="w-full mb-3 border p-2"
            onChange={(e) => setPassword(e.target.value)}
            />

            <button className="w-full bg-black text-white py-2">
            Login
            </button>
        </form>
        </div>
    );
    }
