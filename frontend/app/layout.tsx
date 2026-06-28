import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import {
  SearchPanelProvider,
} from "./context/SearchPanelContext";
import { TripProvider } from "./context/TripContext";
import { Toaster } from "react-hot-toast"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TripPlan",
  description: "AI Travel Planner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Toaster
              position="bottom-right"
            />

        <TripProvider>

          <SearchPanelProvider>

            {children}

            

          </SearchPanelProvider>

        </TripProvider>

      </body>
    </html>
  );
}