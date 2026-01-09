import type { Metadata } from "next";
import { Zain, Afacad } from "next/font/google";
import "./globals.css";

const zain = Zain({
  variable: "--font-zain",
  subsets: ["latin"],
  weight: ["300", "400", "800", "900"],
});

const afacad = Afacad({
  variable: "--font-afacad",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "app-transcribe | Video Downloader",
  description: "Download videos from YouTube, TikTok, Instagram, and LinkedIn",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${zain.variable} ${afacad.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
