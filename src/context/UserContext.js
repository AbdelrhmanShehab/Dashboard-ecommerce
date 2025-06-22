"use client";
import { createContext, useState, useContext } from "react";

// 1. Create the context
const UserContext = createContext();

// 2. Custom hook to use the context
export const useUser = () => useContext(UserContext);

// 3. Provider component
export const UserProvider = ({ children }) => {
  const [selectedUser, setSelectedUser] = useState(null); // initially no user

  return (
    <UserContext.Provider value={{ selectedUser, setSelectedUser }}>
      {children}
    </UserContext.Provider>
  );
};
