import type { ChatSection } from "@/types";

const STORAGE_KEY = "hyperlex_chat_history";

export const chatStorage = {
  // Save chat sections to localStorage
  saveChatHistory: (chatSections: ChatSection[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatSections));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  },

  // Load chat sections from localStorage
  loadChatHistory: (): ChatSection[] => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error("Error loading chat history:", error);
      return [];
    }
  },

  // Clear chat history from localStorage
  clearChatHistory: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  },
};
