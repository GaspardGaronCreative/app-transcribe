"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Video {
    id: string;
    title: string;
    description: string | null;
    fileName: string;
    fileKey: string;
    fileSize: number;
    mimeType: string;
    duration: number | null;
    status: string;
    createdAt: string;
    downloadUrl: string | null;
}

interface VideoListProps {
    refreshTrigger?: number;
}

export function VideoList({ refreshTrigger }: VideoListProps) {
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

    const fetchVideos = async () => {
        try {
            const response = await fetch("/api/videos");
            const data = await response.json();
            if (data.videos) {
                setVideos(data.videos);
            }
        } catch (error) {
            console.error("Failed to fetch videos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [refreshTrigger]);

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/videos?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Delete failed");
            }

            toast.success("Video deleted");
            setVideos((prev) => prev.filter((v) => v.id !== id));
            if (playingVideoId === id) {
                setPlayingVideoId(null);
            }
        } catch {
            toast.error("Failed to delete video");
        }
    };

    const togglePlay = (id: string) => {
        setPlayingVideoId(playingVideoId === id ? null : id);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Downloaded Videos</CardTitle>
                    <CardDescription>Your downloaded videos will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        Loading...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (videos.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Downloaded Videos</CardTitle>
                    <CardDescription>Your downloaded videos will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <VideoIcon className="h-12 w-12 mb-4 opacity-50" />
                        <p>No videos yet</p>
                        <p className="text-sm">Download a video to get started</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Downloaded Videos</CardTitle>
                <CardDescription>{videos.length} video{videos.length !== 1 ? "s" : ""}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {videos.map((video, index) => (
                    <div key={video.id}>
                        {index > 0 && <Separator className="my-4" />}

                        {/* Video Player */}
                        {playingVideoId === video.id && video.downloadUrl && (
                            <div className="mb-4 rounded-lg overflow-hidden bg-black">
                                <video
                                    src={video.downloadUrl}
                                    controls
                                    autoPlay
                                    className="w-full max-h-[400px]"
                                    onError={() => {
                                        toast.error("Failed to load video");
                                        setPlayingVideoId(null);
                                    }}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        )}

                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{video.title}</h4>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <Badge variant="secondary" className="text-xs">
                                        {formatFileSize(video.fileSize)}
                                    </Badge>
                                    <span>{formatDate(video.createdAt)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Play/Stop Button */}
                                {video.downloadUrl && (
                                    <Button
                                        variant={playingVideoId === video.id ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => togglePlay(video.id)}
                                    >
                                        {playingVideoId === video.id ? (
                                            <>
                                                <StopIcon className="h-4 w-4 mr-1" />
                                                Stop
                                            </>
                                        ) : (
                                            <>
                                                <PlayIcon className="h-4 w-4 mr-1" />
                                                Play
                                            </>
                                        )}
                                    </Button>
                                )}
                                {/* Download Button */}
                                {video.downloadUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                    >
                                        <a href={video.downloadUrl} download={video.fileName} target="_blank" rel="noopener noreferrer">
                                            <DownloadIcon className="h-4 w-4 mr-1" />
                                            Download
                                        </a>
                                    </Button>
                                )}
                                {/* Delete Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(video.id)}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

// Icons
function VideoIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
    );
}

function PlayIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    );
}

function StopIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        </svg>
    );
}

function DownloadIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function TrashIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    );
}
