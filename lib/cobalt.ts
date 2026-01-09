/**
 * Cobalt API Client
 * Handles video downloads from various platforms:
 * - YouTube
 * - TikTok
 * - Instagram
 * - LinkedIn
 * - And many more...
 */

const COBALT_API_URL = process.env.COBALT_API_URL || "http://cobalt:9000";

// Supported platforms
export const SUPPORTED_PLATFORMS = [
    { name: "YouTube", pattern: /youtube\.com|youtu\.be/i, icon: "youtube" },
    { name: "TikTok", pattern: /tiktok\.com/i, icon: "tiktok" },
    { name: "Instagram", pattern: /instagram\.com/i, icon: "instagram" },
    { name: "LinkedIn", pattern: /linkedin\.com/i, icon: "linkedin" },
    { name: "Twitter/X", pattern: /twitter\.com|x\.com/i, icon: "twitter" },
    { name: "Vimeo", pattern: /vimeo\.com/i, icon: "vimeo" },
] as const;

export type Platform = (typeof SUPPORTED_PLATFORMS)[number]["name"];

// Cobalt API request options
export interface CobaltDownloadOptions {
    url: string;
    videoQuality?: "max" | "4320" | "2160" | "1440" | "1080" | "720" | "480" | "360" | "240" | "144";
    audioFormat?: "best" | "mp3" | "ogg" | "wav" | "opus";
    audioBitrate?: "320" | "256" | "128" | "96" | "64" | "8";
    downloadMode?: "auto" | "audio" | "mute";
    filenameStyle?: "classic" | "pretty" | "basic" | "nerdy";
    youtubeVideoCodec?: "h264" | "av1" | "vp9";
}

// Cobalt API response types
export interface CobaltTunnelResponse {
    status: "tunnel" | "redirect";
    url: string;
    filename: string;
}

export interface CobaltPickerResponse {
    status: "picker";
    picker: Array<{
        type: "video" | "photo";
        url: string;
        thumb?: string;
    }>;
}

export interface CobaltErrorResponse {
    status: "error";
    error: {
        code: string;
        context?: {
            service?: string;
        };
    };
}

export type CobaltResponse = CobaltTunnelResponse | CobaltPickerResponse | CobaltErrorResponse;

/**
 * Detect the platform from a URL
 */
export function detectPlatform(url: string): Platform | null {
    for (const platform of SUPPORTED_PLATFORMS) {
        if (platform.pattern.test(url)) {
            return platform.name;
        }
    }
    return null;
}

/**
 * Validate if a URL is supported by Cobalt
 */
export function isUrlSupported(url: string): boolean {
    return detectPlatform(url) !== null;
}

/**
 * Request a video download from Cobalt API
 */
export async function requestDownload(
    options: CobaltDownloadOptions
): Promise<CobaltResponse> {
    const response = await fetch(COBALT_API_URL, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url: options.url,
            videoQuality: options.videoQuality || "1080",
            audioFormat: options.audioFormat || "mp3",
            audioBitrate: options.audioBitrate || "128",
            downloadMode: options.downloadMode || "auto",
            filenameStyle: options.filenameStyle || "basic",
            youtubeVideoCodec: options.youtubeVideoCodec || "h264",
        }),
    });

    if (!response.ok) {
        throw new Error(`Cobalt API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * Download the video content from a tunnel/redirect URL
 */
export async function downloadFromUrl(url: string): Promise<{
    buffer: Buffer;
    contentType: string;
    contentLength: number;
}> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "video/mp4";
    const contentLength = parseInt(response.headers.get("content-length") || "0", 10);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
        buffer,
        contentType,
        contentLength: contentLength || buffer.length,
    };
}

/**
 * Extract video title from filename
 */
export function extractTitleFromFilename(filename: string): string {
    // Remove extension
    const withoutExt = filename.replace(/\.[^/.]+$/, "");
    // Replace underscores and dashes with spaces
    const cleaned = withoutExt.replace(/[_-]/g, " ");
    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Check if Cobalt API is available
 */
export async function checkCobaltHealth(): Promise<boolean> {
    try {
        const response = await fetch(COBALT_API_URL, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });
        return response.ok;
    } catch {
        return false;
    }
}
