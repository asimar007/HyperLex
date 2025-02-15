"use client";

import { Menu } from "lucide-react";
import BackgroundGrid from "./BackgroundGrid";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const Header = ({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) => {
  return (
    <>
      <BackgroundGrid />
      <div className="fixed top-0 left-0 right-0 flex h-16 z-[100] backdrop-blur-md lg:backdrop-blur-none">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1 m-2.5 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200 active:scale-95"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-gray-600 transition-transform duration-300 ease-in-out transform hover:scale-110" />
        </button>

        <div className="flex-1 flex items-center px-4 md:px-6">
          <h1 className="relative group">
            <span className="text-xl md:text-3xl font-serif font-black tracking-tight">
              <span className="inline-block transform transition-transform group-hover:scale-110 duration-300">
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600">
                  HyperLex
                </span>
              </span>{" "}
              <span className="inline-block transform transition-transform group-hover:scale-110 duration-300 delay-75">
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">
                  AI
                </span>
              </span>
            </span>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          </h1>
        </div>
      </div>
    </>
  );
};

export default Header;
