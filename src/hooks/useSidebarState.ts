import { useState, useEffect, useCallback } from "react";

export const useSidebarState = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    // Initialize based on window width if available, default to false for SSR
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  const handleResize = useCallback(() => {
    const isMobile = window.innerWidth < 1024;
    setIsSidebarOpen(!isMobile);
  }, []);

  useEffect(() => {
    // Handle initial state
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  return [isSidebarOpen, setIsSidebarOpen] as const;
};
