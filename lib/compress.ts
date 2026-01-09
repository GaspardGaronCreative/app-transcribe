import { spawn } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

// Compression settings from environment
const MAX_RESOLUTION = parseInt(process.env.VIDEO_MAX_RESOLUTION || "720", 10);
const VIDEO_BITRATE = process.env.VIDEO_BITRATE || "1500k";
const VIDEO_CRF = process.env.VIDEO_CRF || "28";
const AUDIO_BITRATE = process.env.AUDIO_BITRATE || "128k";

export interface CompressionResult {
    buffer: Buffer;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    duration?: number;
}

export interface CompressionOptions {
    maxResolution?: number;
    videoBitrate?: string;
    crf?: string;
    audioBitrate?: string;
}

/**
 * Compress a video using FFmpeg
 * Optimized for web streaming with small file sizes
 */
export async function compressVideo(
    inputBuffer: Buffer,
    inputMimeType: string,
    options: CompressionOptions = {}
): Promise<CompressionResult> {
    const maxRes = options.maxResolution || MAX_RESOLUTION;
    const videoBitrate = options.videoBitrate || VIDEO_BITRATE;
    const crf = options.crf || VIDEO_CRF;
    const audioBitrate = options.audioBitrate || AUDIO_BITRATE;

    // Create temp files
    const tempDir = tmpdir();
    const inputId = randomUUID();
    const outputId = randomUUID();

    // Determine input extension from mime type
    const inputExt = getExtensionFromMimeType(inputMimeType);
    const inputPath = join(tempDir, `${inputId}.${inputExt}`);
    const outputPath = join(tempDir, `${outputId}.mp4`);

    try {
        // Write input buffer to temp file
        await fs.writeFile(inputPath, inputBuffer);

        // Run FFmpeg compression
        await runFFmpeg(inputPath, outputPath, {
            maxResolution: maxRes,
            videoBitrate,
            crf,
            audioBitrate,
        });

        // Read compressed file
        const compressedBuffer = await fs.readFile(outputPath);

        const result: CompressionResult = {
            buffer: compressedBuffer,
            originalSize: inputBuffer.length,
            compressedSize: compressedBuffer.length,
            compressionRatio: (1 - compressedBuffer.length / inputBuffer.length) * 100,
        };

        console.log(
            `Compressed video: ${formatSize(result.originalSize)} → ${formatSize(result.compressedSize)} (${result.compressionRatio.toFixed(1)}% reduction)`
        );

        return result;
    } finally {
        // Clean up temp files
        try {
            await fs.unlink(inputPath);
        } catch { }
        try {
            await fs.unlink(outputPath);
        } catch { }
    }
}

/**
 * Run FFmpeg with specified options
 */
function runFFmpeg(
    inputPath: string,
    outputPath: string,
    options: {
        maxResolution: number;
        videoBitrate: string;
        crf: string;
        audioBitrate: string;
    }
): Promise<void> {
    return new Promise((resolve, reject) => {
        // Build scale filter to cap resolution while maintaining aspect ratio
        const scaleFilter = `scale='min(${options.maxResolution * (16 / 9)},iw)':min'(${options.maxResolution},ih)':force_original_aspect_ratio=decrease`;

        const args = [
            "-i", inputPath,
            "-y", // Overwrite output

            // Video encoding
            "-c:v", "libx264", // H.264 codec (universal compatibility)
            "-preset", "medium", // Balance between speed and compression
            "-crf", options.crf, // Quality level (18-28 is good, 28 = smaller file)
            "-maxrate", options.videoBitrate, // Max bitrate
            "-bufsize", `${parseInt(options.videoBitrate) * 2}k`, // Buffer size

            // Scale down if needed
            "-vf", `scale=-2:'min(${options.maxResolution},ih)'`,

            // Audio encoding
            "-c:a", "aac", // AAC codec
            "-b:a", options.audioBitrate, // Audio bitrate
            "-ac", "2", // Stereo

            // Output optimization
            "-movflags", "+faststart", // Enable streaming
            "-pix_fmt", "yuv420p", // Compatibility

            outputPath,
        ];

        const ffmpeg = spawn("ffmpeg", args);

        let stderr = "";
        ffmpeg.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        ffmpeg.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
            }
        });

        ffmpeg.on("error", (err) => {
            reject(new Error(`FFmpeg spawn error: ${err.message}`));
        });
    });
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
        "video/mp4": "mp4",
        "video/webm": "webm",
        "video/quicktime": "mov",
        "video/x-msvideo": "avi",
        "video/x-matroska": "mkv",
        "video/mpeg": "mpeg",
        "video/3gpp": "3gp",
    };
    return mimeMap[mimeType] || "mp4";
}

/**
 * Format bytes to human readable size
 */
function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Check if FFmpeg is available
 */
export async function checkFFmpegAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
        const ffmpeg = spawn("ffmpeg", ["-version"]);
        ffmpeg.on("close", (code) => resolve(code === 0));
        ffmpeg.on("error", () => resolve(false));
    });
}
