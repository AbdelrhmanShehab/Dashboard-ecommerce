"use client";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import TitlePage from "./TitlePage";

const UserCard = () => {
  const [snapshot, loading, error] = useCollection(collection(db, "users"));

  if (loading)
    return (
      <div className=" w-full h-full p-6 text-2xl flex justify-center content-center dark:text-white">
        Loading users...
      </div>
    );
  if (error)
    return <div className="p-6 text-red-500">Error: {error.message}</div>;

  // Convert docs to array with id + data
  const users = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((user) => user.Created) // only users with created dates
    .sort(
      (a, b) => b.Created.toDate().getTime() - a.Created.toDate().getTime() // sort by date (latest first)
    )
    .slice(0, 3); // get latest 3 users

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-10 w-full dark:bg-[#0D1321] text-white">
      <TitlePage header="Recent Users" paragraph="Latest user registrations." />

      <ul className="space-y-4">
        {users.map((user) => (
          <li key={user.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 font-semibold dark:bg-blue-900 dark:text-blue-200">
                {user.Name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium dark:text-white">{user.Name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.Email || "No email"}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                user.Status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {user.Status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserCard;
