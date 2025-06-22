// components/Header.jsx
"use client";
import Image from "next/image";
import darkmode from "../../public/icons/dark-mode-icon.svg";
import lightmode from "../../public/icons/light-mode-icon.svg";
import useTheme from "@/context/ThemeContext";

const Header = ({ toggleSidebar }) => {
  const { togglemode, setToggleMode } = useTheme();

  return (
    <header className="bg-white border-b border-gray-200 dark:bg-[#1a1b23]">
      <div className="w-[95%] m-auto flex justify-between items-center h-[64px]">
        {/* Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="w-6 h-6 relative focus:outline-none"
        >
          <Image
            src="/icons/sidebar-icon.svg"
            alt="sidebar icon"
            fill
            className="cursor-pointer dark:invert dark:brightness-200"
          />
        </button>

        {/* Dark mode toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setToggleMode(!togglemode)}
            className="w-6 h-6 relative focus:outline-none"
          >
            <Image
              src={togglemode ? lightmode : darkmode}
              alt="dark mode icon"
              width={22}
              height={22}
              className="cursor-pointer dark:invert dark:brightness-200"
            />
          </button>

          {/* Profile picture */}
          <div className="w-10 h-10 relative">
            <Image
              src="/images/profile-pic2.jpg"
              alt="profile picture"
              fill
              className="rounded-full"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
