import Image from "next/image";
import TitlePage from "@/components/TitlePage";
import StatusCard from "@/components/StatusCard";
import UserCard from "../components/UserCard";
import ProductCard from "@/components/ProductCard";
export default function Home() {
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
            value="5"
            secondaryValue="4 active"
            iconSrc="/icons/user-icon.svg"
          />

          <StatusCard
            title="Products"
            value="5"
            secondaryValue="4 active"
            iconSrc="/icons/product-icon.svg"
          />
        </div>
        <div className="flex flex-col gap-4 md:gap-1 lg:flex-row md:w-[49%] lg:w-full">
          <StatusCard
            title="Revenue"
            value="$42,745.31"
            trend={{
              value: "+12.5% from last month",
              positive: true,
            }}
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
