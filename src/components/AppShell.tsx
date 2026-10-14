"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import Logo from "./Logo";
import Sidebar from "./Sidebar";
import { useChat } from "@/context/ChatProvider";
import { classNames } from "@/lib/utils";

const DESKTOP = "(min-width: 1024px)";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { setActiveId } = useChat();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  // Close the drawer after navigating
  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia(DESKTOP).matches) setDesktopOpen((v) => !v);
    else setMobileOpen((v) => !v);
  }, []);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-rule bg-paper/90 px-3 backdrop-blur">
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-md p-2 text-muted transition-colors hover:bg-rule/60 hover:text-ink"
          aria-label="Toggle sidebar"
          aria-controls="sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          href="/"
          onClick={() => setActiveId(null)}
          className="rounded-md px-1 py-1"
          aria-label="HyperLex, start new research"
        >
          <Logo />
        </Link>
      </header>

      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        className={classNames(
          "fixed inset-x-0 bottom-0 top-14 z-30 bg-ink/30 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        id="sidebar"
        className={classNames(
          "fixed bottom-0 left-0 top-14 z-40 w-72 border-r border-rule bg-paper transition-[transform,visibility] duration-200 lg:w-64",
          mobileOpen ? "visible translate-x-0" : "invisible -translate-x-full",
          desktopOpen ? "lg:visible lg:translate-x-0" : "lg:invisible lg:-translate-x-full"
        )}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className={classNames("pt-14 transition-[padding] duration-200", desktopOpen && "lg:pl-64")}>
        <main id="main">{children}</main>
      </div>
    </div>
  );
}
