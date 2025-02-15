import { useState } from "react";
import type { ChatSection } from "@/types";

export const useShareChat = () => {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const handleShareChat = async (section: ChatSection) => {
    try {
      const shareData = {
        query: section.query,
        response: section.response,
        searchResults: section.searchResults,
        reasoning: section.reasoning,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shareData),
      });

      const { shareId } = await response.json();
      const url = `${window.location.origin}/share/${shareId}`;
      setShareUrl(url);
      setShareModalOpen(true);

      // Copy to clipboard
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error("Error sharing chat:", error);
    }
  };

  return {
    shareModalOpen,
    setShareModalOpen,
    shareUrl,
    handleShareChat,
  };
};
