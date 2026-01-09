"use client";

import { useState } from "react";
import { VideoDownloader } from "@/components/video-downloader";
import { VideoList } from "@/components/video-list";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "app-transcribe";

  const handleDownloadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
                  <VideoIcon className="h-5 w-5 text-background" />
                </div>
                <h1 className="text-xl font-semibold">{appName}</h1>
              </div>
              <nav className="flex items-center gap-4">
                <a
                  href="/api/health"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Health
                </a>
                <a
                  href="http://localhost:9003"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Storage
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Hero */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">
                Download Videos
              </h2>
              <p className="text-muted-foreground">
                Save videos from YouTube, TikTok, Instagram, and LinkedIn
              </p>
            </div>

            {/* Downloader */}
            <VideoDownloader onDownloadComplete={handleDownloadComplete} />

            {/* Video List */}
            <VideoList refreshTrigger={refreshTrigger} />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t mt-16">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              Built with Next.js 15 • PostgreSQL • MinIO • Cobalt
            </p>
          </div>
        </footer>
      </div>
      <Toaster />
    </>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}
