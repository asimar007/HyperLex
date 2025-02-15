"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { History, Home, MessageSquarePlus, Newspaper } from "lucide-react";

const menuItems = [
  {
    title: "Home",
    icon: Home,
    href: "/",
  },
  {
    title: "New Chat",
    icon: MessageSquarePlus,
    href: "/chat/new",
  },
  {
    title: "Hackernews",
    icon: Newspaper,
    href: "/hackernews",
  },
  {
    title: "Chat History",
    icon: History,
    href: "/chat/history",
  },
];

interface SidebarProps {
  isSidebarOpen: boolean;
}

const Sidebar = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  const pathname = usePathname(); // Add this line to get the current path
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Handle window resize with useEffect
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    // Check initial size
    checkScreenSize();

    // Add event listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <div
      className={`fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white border-r border-gray-200
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0 shadow-lg" : "-translate-x-full"}
        w-[80vw] md:w-64
        ${isLargeScreen ? "" : "will-change-transform"}`}
    >
      <nav className="px-3 py-4 space-y-1.5">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium 
              transition-all duration-200 group relative overflow-hidden
              ${
                pathname === item.href
                  ? "bg-gray-900 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <item.icon
              className={`h-4.5 w-4.5 transition-all duration-200 group-hover:scale-110 
                ${pathname === item.href ? "text-white" : "text-gray-500"}`}
            />
            <span className="font-medium relative z-10">{item.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
