"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { chatStorage } from "@/lib/chatStorage";

export default function NewChat() {
  const router = useRouter();

  useEffect(() => {
    // Clear chat history
    chatStorage.clearChatHistory();
    // Redirect to home page
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}