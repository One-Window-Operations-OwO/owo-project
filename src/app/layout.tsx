import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "./AuthProvider";
import { AppProvider } from "@/context/AppProvider"; // <-- IMPORT

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spreadsheet Verifier",
  description: "Verify your spreadsheet data",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-gray-900`}>
        <AuthProvider>
          <AppProvider>{children}</AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}