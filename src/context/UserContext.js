"use client"; // ✅ Needed in Next.js App Router
import { createContext, useState, useContext } from "react";

// 1. Create the context (just a container)
const UserContext = createContext();

// 2. Create a hook to access context from other components
export const useUser = () => useContext(UserContext);

// 3. Provider Component — wraps your app and holds global state
export const UserProvider = ({ children }) => {
  const [selectedUser, setSelectedUser] = useState(null); // store selected user

  return (
    <UserContext.Provider value={{ selectedUser, setSelectedUser }}>
      {children}
    </UserContext.Provider>
  );
};
