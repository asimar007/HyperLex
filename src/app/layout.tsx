import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Literata, Schibsted_Grotesk } from "next/font/google";
import { ChatProvider } from "@/context/ChatProvider";
import AppShell from "@/components/AppShell";

const serif = Literata({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-serif" });
const sans = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "HyperLex",
    template: "%s | HyperLex",
  },
  description:
    "Ask a question and HyperLex searches the web, reads the results, and writes an answer with numbered sources.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F6F8" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1420" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before hydration */}
      <body suppressHydrationWarning>
        <ChatProvider>
          <AppShell>{children}</AppShell>
        </ChatProvider>
      </body>
    </html>
  );
}
