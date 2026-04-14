import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "calio",
  description: "먹은 만큼 살고, 사는 만큼 태운다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
     <head>
  <link href="https://fonts.googleapis.com/..." rel="stylesheet"/>
  
  <link rel="manifest" href="/manifest.json"/>
  <link rel="apple-touch-icon" href="/icons/icon-180.png"/>
  <meta name="theme-color" content="#D85A30"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
  <meta name="apple-mobile-web-app-title" content="calio"/>
     </head>
      <body style={{ margin:0, padding:0, overflowX:'hidden' }}>
        {children}
        <BottomNav/>
      </body>
    </html>
  );
}