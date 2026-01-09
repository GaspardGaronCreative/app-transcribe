"use client";

import { useState } from "react";
import { VideoDownloader } from "@/components/video-downloader";
import { VideoList } from "@/components/video-list";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDownloadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="flex h-screen w-full bg-white font-sans overflow-hidden">
      {/* Left Sidebar - Clean White */}
      <aside className="w-[320px] flex-shrink-0 h-full bg-white z-10 flex flex-col">
        {/* Logo / Brand Area */}
        <div className="px-6 pt-8 pb-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Maison Egard</h1>
        </div>

        {/* Downloader Component */}
        <div className="flex-1 overflow-hidden">
          <VideoDownloader onDownloadComplete={handleDownloadComplete} />
        </div>
      </aside>

      {/* Main Content - Grey Card Container */}
      <section className="flex-1 h-full p-4 pl-0">
        <div className="h-full w-full bg-[#F5F5F7] rounded-[22px] overflow-hidden flex flex-col relative">

          {/* Scrollable Grid Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-[1800px] mx-auto pb-10">
              <VideoList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
