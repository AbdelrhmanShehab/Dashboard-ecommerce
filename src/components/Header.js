import React from "react";
import Link from "next/link";
import Image from "next/image";

const Header = ({ toggleSidebar }) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="w-[94%] m-auto flex justify-between items-center h-[64px] ">
        <div className="w-[20px] h-[20px] relative">
          <button
            onClick={toggleSidebar}
            className="w-[20px] h-[20px] relative focus:outline-none"
          >
            <Image
              src="/icons/sidebar-icon.svg"
              alt="sidebar icon"
              fill
              className="cursor-pointer"
            />
          </button>
        </div>
        <div className="w-[40px] h-[40px] relative">
          <Image
            src="/images/profile-pic2.jpg"
            alt="profile picture"
            fill
            className="rounded-full"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
