import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import {
  SearchPanelProvider,
} from "./context/SearchPanelContext";
import { TripProvider } from "./context/TripContext";
import { Toaster } from "react-hot-toast"
import Script from "next/script";

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
      <Script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
        integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
        crossOrigin="anonymous"
        strategy="beforeInteractive" />

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