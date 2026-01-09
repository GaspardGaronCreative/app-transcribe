import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSignedDownloadUrl, deleteFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

// GET /api/videos - List all videos
export async function GET() {
    try {
        const videos = await prisma.video.findMany({
            orderBy: {
                createdAt: "desc",
            },
            take: 50,
        });

        // Generate signed URLs for each video
        const videosWithUrls = await Promise.all(
            videos.map(async (video: typeof videos[number]) => {
                let downloadUrl: string | null = null;
                try {
                    downloadUrl = await getSignedDownloadUrl(video.fileKey);
                } catch (error) {
                    console.error(`Failed to generate URL for ${video.fileKey}:`, error);
                }
                return {
                    ...video,
                    downloadUrl,
                };
            })
        );

        return NextResponse.json({ videos: videosWithUrls });
    } catch (error) {
        console.error("Error listing videos:", error);
        return NextResponse.json(
            { error: "Failed to list videos" },
            { status: 500 }
        );
    }
}

// DELETE /api/videos - Delete a video
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Video ID is required" },
                { status: 400 }
            );
        }

        // Find the video
        const video = await prisma.video.findUnique({
            where: { id },
        });

        if (!video) {
            return NextResponse.json(
                { error: "Video not found" },
                { status: 404 }
            );
        }

        // Delete from storage
        try {
            await deleteFile(video.fileKey);
        } catch (error) {
            console.error(`Failed to delete file ${video.fileKey}:`, error);
        }

        // Delete from database
        await prisma.video.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting video:", error);
        return NextResponse.json(
            { error: "Failed to delete video" },
            { status: 500 }
        );
    }
}
