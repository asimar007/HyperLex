"use client";

import React, { useState } from "react";
import BackgroundGrid from "@/components/BackgroundGrid";
import TopBar from "@/components/TopBar";
import { motion } from "framer-motion";
import { useSidebarState } from "@/hooks/useSidebarState";

export default function ChatHistory() {
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState();

  return (
    <div className="min-h-screen">
      <BackgroundGrid />
      <TopBar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "pl-64" : "pl-0"
        } pt-16`}
      >
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-gray-800 mb-8"
          >
            Chat History
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="p-8  border-gray-200 max-w-md w-full backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-semibold text-gray-800 mb-3">
                Coming Soon
              </p>
              <p className="text-gray-600 mb-6">
                I am working on bringing you a complete chat history feature.
                Check back soon!
              </p>
              <div className="mt-2 h-1 w-24 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
