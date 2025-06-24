"use client";
import { use, useEffect, useState } from "react";
import Image from "next/image";
import TitlePage from "@/components/TitlePage";
import StatusCard from "@/components/StatusCard";
import UserCard from "../components/UserCard";
import ProductCard from "@/components/ProductCard";
import { db } from "@/firebaseConfig";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import products from "data/products";
export default function Home() {
  const [products] = useCollection(collection(db, "products"));
  const [users] = useCollection(collection(db, "users"));
  // getting all the active users
  const usersActive =
    users?.docs
      .map((doc) => doc.data().Status)
      .filter((status) => status === "active").length || 0;
  // getting all the active products
  const productsActive =
    products?.docs
      .map((doc) => doc.data().Status)
      .filter((status) => status === "active").length || 0;
  console.log(productsActive);
  // adding them into variables
  let ProductValue = `${productsActive} active`;
  let UserValue = `${usersActive} active`;
  let totalPrice = 0;
  products?.docs.forEach((doc) => {
    totalPrice += doc.data().Price; // or doc.data().price (ensure case matches your data)
  });
  return (
    <main className="w-full md:w-[97%] m-auto mb-10 dark:bg-[#1a1b23] h-[81.5vh]">
      <TitlePage
        header="Dashboard"
        paragraph={"Welcome back! Here's what's happening."}
      />
      <div className="flex flex-col gap-4 md:gap-1 lg:gap-4 md:flex-row  md:justify-between dark:bg-[#1a1b23]">
        <div className="flex flex-col gap-4 md:gap-1 lg:flex-row md:w-[49%] lg:w-full">
          <StatusCard
            title="Total Users"
            value={users?.docs.length}
            secondaryValue={UserValue}
            iconSrc="/icons/user-icon.svg"
          />

          <StatusCard
            title="Products"
            value={products?.docs.length}
            secondaryValue={ProductValue}
            iconSrc="/icons/product-icon.svg"
          />
        </div>
        <div className="flex flex-col gap-4 md:gap-1 lg:flex-row md:w-[49%] lg:w-full">
          <StatusCard
            title="Total Products Price"
            value={totalPrice}
            secondaryValue="."
            iconSrc="/icons/dollar-icon.svg"
          />
          <StatusCard
            title="Growth"
            value="+23%"
            secondaryValue="vs last month"
            iconSrc="/icons/growth-icon.svg"
          />
        </div>
      </div>
      <div className="w-full flex flex-row gap-4  md:justify-between [@media(max-width:900px)]:flex-col">
        <UserCard />
        <ProductCard />
      </div>
    </main>
  );
}
