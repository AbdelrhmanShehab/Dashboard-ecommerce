"use client";
import Image from "next/image";
import darkmode from "../../public/icons/dark-mode-icon.svg";
import lightmode from "../../public/icons/light-mode-icon.svg";
import useTheme from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { togglemode, setToggleMode } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="bg-white border-b dark:bg-[#1a1b23]">
      <div className="w-[95%] m-auto flex justify-between items-center h-[64px]">

        <button onClick={toggleSidebar} className="w-6 h-6 relative">
          <Image src="/icons/sidebar-icon.svg" fill alt="menu" />
        </button>

        <div className="flex items-center gap-4">

          <button onClick={() => setToggleMode(!togglemode)}>
            <Image
              src={togglemode ? lightmode : darkmode}
              width={22}
              height={22}
              alt="mode"
            />
          </button>

          {user && (
            <>
              <span className="text-sm">{user.email}</span>


              <button
                onClick={handleLogout}
                className="text-red-500 text-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;