"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface DownloadedVideo {
    id: string;
    title: string;
    fileName: string;
    fileKey: string;
    fileSize: number;
    mimeType: string;
    platform: string;
}

interface VideoDownloaderProps {
    onDownloadComplete?: (video: DownloadedVideo) => void;
}

export function VideoDownloader({ onDownloadComplete }: VideoDownloaderProps) {
    const [url, setUrl] = useState("");
    const [quality, setQuality] = useState<string>("720");
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDownload = async () => {
        if (!url.trim()) {
            toast.error("Please enter a video URL");
            return;
        }

        setIsDownloading(true);
        setProgress(10);

        try {
            // Simulate progress while downloading
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 500);

            const response = await fetch("/api/download", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url: url.trim(),
                    videoQuality: quality,
                }),
            });

            clearInterval(progressInterval);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Download failed");
            }

            setProgress(100);
            toast.success("Video downloaded successfully!");

            if (onDownloadComplete && data.video) {
                onDownloadComplete(data.video);
            }

            // Reset form
            setUrl("");
            setProgress(0);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Download failed");
            setProgress(0);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Download Video</CardTitle>
                <CardDescription>
                    Paste a link from YouTube, TikTok, Instagram, or LinkedIn
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* URL Input */}
                <div className="space-y-2">
                    <Label htmlFor="url">Video URL</Label>
                    <Input
                        id="url"
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isDownloading}
                        className="font-mono text-sm"
                    />
                </div>

                {/* Quality Selector */}
                <div className="space-y-2">
                    <Label htmlFor="quality">Quality</Label>
                    <Select value={quality} onValueChange={setQuality} disabled={isDownloading}>
                        <SelectTrigger id="quality">
                            <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1080">1080p (HD)</SelectItem>
                            <SelectItem value="720">720p (default)</SelectItem>
                            <SelectItem value="480">480p</SelectItem>
                            <SelectItem value="360">360p</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Progress Bar */}
                {isDownloading && (
                    <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-sm text-muted-foreground text-center">
                            Downloading... {progress}%
                        </p>
                    </div>
                )}

                {/* Platform Icons */}
                <div className="flex items-center justify-center gap-6 py-4 text-muted-foreground">
                    <div className="flex flex-col items-center gap-1">
                        <YoutubeIcon className="h-6 w-6" />
                        <span className="text-xs">YouTube</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <TikTokIcon className="h-6 w-6" />
                        <span className="text-xs">TikTok</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <InstagramIcon className="h-6 w-6" />
                        <span className="text-xs">Instagram</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <LinkedInIcon className="h-6 w-6" />
                        <span className="text-xs">LinkedIn</span>
                    </div>
                </div>

                {/* Download Button */}
                <Button
                    onClick={handleDownload}
                    disabled={isDownloading || !url.trim()}
                    className="w-full"
                    size="lg"
                >
                    {isDownloading ? "Downloading..." : "Download Video"}
                </Button>
            </CardContent>
        </Card>
    );
}

// Platform Icons
function YoutubeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43l6.27 3.57-6.27 3.57z" />
        </svg>
    );
}

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
    );
}

function InstagramIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.73 3.73 0 0 1-1.38-.9 3.73 3.73 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.78.3-1.44.71-2.1 1.37A5.9 5.9 0 0 0 .67 4.1c-.3.77-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.78.71 1.44 1.37 2.1a5.9 5.9 0 0 0 2.1 1.37c.77.3 1.64.5 2.91.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.1-1.37 5.9 5.9 0 0 0 1.37-2.1c.3-.77.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.37-2.1A5.9 5.9 0 0 0 19.9.67c-.77-.3-1.64-.5-2.91-.56C15.71.01 15.3 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
        </svg>
    );
}

function LinkedInIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.23 0z" />
        </svg>
    );
}
