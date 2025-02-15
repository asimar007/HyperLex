"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  Home,
  MessageSquarePlus,
  Newspaper,
  Menu,
} from "lucide-react";

const menuItems = [
  {
    title: "Home",
    icon: Home,
    href: "/",
  },
  {
    title: "Hackernews",
    icon: Newspaper,
    href: "/hackernews",
  },
  {
    title: "New Chat",
    icon: MessageSquarePlus,
    href: "/chat/new",
  },
  {
    title: "Chat History",
    icon: History,
    href: "/chat/history",
  },
];

import Header from "./Header";
import Sidebar from "./Sidebar";

interface TopBarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const TopBar = ({ isSidebarOpen, setIsSidebarOpen }: TopBarProps) => {
  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <Sidebar isSidebarOpen={isSidebarOpen} />
    </>
  );
};

export default TopBar;
