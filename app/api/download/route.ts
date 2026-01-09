import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadFile, generateFileKey } from "@/lib/storage";
import {
    requestDownload,
    downloadFromUrl,
    detectPlatform,
    isUrlSupported,
    extractTitleFromFilename,
    CobaltDownloadOptions,
} from "@/lib/cobalt";
import { compressVideo, checkFFmpegAvailable } from "@/lib/compress";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for video downloads

interface DownloadRequest {
    url: string;
    videoQuality?: CobaltDownloadOptions["videoQuality"];
    downloadMode?: CobaltDownloadOptions["downloadMode"];
    compress?: boolean; // Option to skip compression
}

// Check if compression is enabled (default: true)
const COMPRESSION_ENABLED = process.env.VIDEO_COMPRESSION_ENABLED !== "false";

export async function POST(request: NextRequest) {
    try {
        const body: DownloadRequest = await request.json();

        // Validate URL
        if (!body.url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        // Check if URL is supported
        if (!isUrlSupported(body.url)) {
            return NextResponse.json(
                { error: "URL is not supported. Try YouTube, TikTok, Instagram, or LinkedIn." },
                { status: 400 }
            );
        }

        const platform = detectPlatform(body.url);
        const shouldCompress = body.compress !== false && COMPRESSION_ENABLED;

        // Request download from Cobalt
        const cobaltResponse = await requestDownload({
            url: body.url,
            videoQuality: body.videoQuality || "1080",
            downloadMode: body.downloadMode || "auto",
        });

        // Handle error response
        if (cobaltResponse.status === "error") {
            return NextResponse.json(
                { error: `Download failed: ${cobaltResponse.error.code}` },
                { status: 400 }
            );
        }

        // Handle picker response (multiple items)
        if (cobaltResponse.status === "picker") {
            // For now, just pick the first video
            const firstVideo = cobaltResponse.picker.find((item) => item.type === "video");
            if (!firstVideo) {
                return NextResponse.json(
                    { error: "No video found in the content" },
                    { status: 400 }
                );
            }

            // Download the first video
            let { buffer, contentType } = await downloadFromUrl(firstVideo.url);
            let finalSize = buffer.length;

            // Compress video if enabled
            if (shouldCompress && await checkFFmpegAvailable()) {
                try {
                    const compressed = await compressVideo(buffer, contentType);
                    buffer = compressed.buffer;
                    finalSize = compressed.compressedSize;
                    contentType = "video/mp4"; // Always MP4 after compression
                    console.log(`Compression saved ${((compressed.compressionRatio)).toFixed(1)}%`);
                } catch (compressError) {
                    console.error("Compression failed, using original:", compressError);
                    // Continue with uncompressed video
                }
            }

            const fileKey = generateFileKey("video.mp4");
            await uploadFile(fileKey, buffer, contentType);

            // Save to database
            const video = await prisma.video.create({
                data: {
                    title: `Video from ${platform}`,
                    fileName: "video.mp4",
                    fileKey,
                    fileSize: finalSize,
                    mimeType: contentType,
                    status: "COMPLETED",
                    platform,
                    originalUrl: body.url,
                },
            });

            return NextResponse.json({
                success: true,
                video: {
                    id: video.id,
                    title: video.title,
                    fileKey: video.fileKey,
                    fileSize: video.fileSize,
                    platform,
                },
            });
        }

        // Handle tunnel/redirect response
        if (cobaltResponse.status === "tunnel" || cobaltResponse.status === "redirect") {
            const downloadUrl = cobaltResponse.url;
            const filename = cobaltResponse.filename;

            // Download the video
            let { buffer, contentType } = await downloadFromUrl(downloadUrl);
            const originalSize = buffer.length;
            let finalSize = originalSize;

            // Compress video if enabled
            if (shouldCompress && await checkFFmpegAvailable()) {
                try {
                    console.log(`Starting compression of ${(originalSize / 1024 / 1024).toFixed(1)}MB video...`);
                    const compressed = await compressVideo(buffer, contentType);
                    buffer = compressed.buffer;
                    finalSize = compressed.compressedSize;
                    contentType = "video/mp4"; // Always MP4 after compression
                    console.log(`Compression complete: ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(finalSize / 1024 / 1024).toFixed(1)}MB (${compressed.compressionRatio.toFixed(1)}% saved)`);
                } catch (compressError) {
                    console.error("Compression failed, using original:", compressError);
                    // Continue with uncompressed video
                }
            }

            // Generate storage key (always use .mp4 after compression)
            const compressedFilename = filename.replace(/\.[^/.]+$/, ".mp4");
            const fileKey = generateFileKey(compressedFilename);

            // Upload to MinIO
            await uploadFile(fileKey, buffer, contentType);

            // Extract title from filename
            const title = extractTitleFromFilename(filename);

            // Save metadata to database
            const video = await prisma.video.create({
                data: {
                    title,
                    fileName: compressedFilename,
                    fileKey,
                    fileSize: finalSize,
                    mimeType: contentType,
                    status: "COMPLETED",
                    platform,
                    originalUrl: body.url,
                },
            });

            return NextResponse.json({
                success: true,
                video: {
                    id: video.id,
                    title: video.title,
                    fileName: video.fileName,
                    fileKey: video.fileKey,
                    fileSize: video.fileSize,
                    originalSize: originalSize,
                    compressionSaved: originalSize - finalSize,
                    mimeType: video.mimeType,
                    platform,
                },
            });
        }

        return NextResponse.json(
            { error: "Unexpected response from download service" },
            { status: 500 }
        );
    } catch (error) {
        console.error("Download error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Download failed" },
            { status: 500 }
        );
    }
}
