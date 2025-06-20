import React from "react";
import Image from "next/image";

const Header = ({ toggleSidebar }) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="w-[94%] m-auto flex justify-between items-center h-[64px]">
        {/* Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="w-6 h-6 relative focus:outline-none"
        >
          <Image
            src="/icons/sidebar-icon.svg"
            alt="sidebar icon"
            fill
            className="cursor-pointer"
          />
        </button>

        {/* Profile Picture */}
        <div className="w-10 h-10 relative">
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
