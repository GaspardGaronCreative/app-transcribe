import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3/MinIO client configuration
const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || "http://minio:9000",
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
        secretAccessKey: process.env.S3_SECRET_KEY || "minio_secret_change_me",
    },
    forcePathStyle: true, // Required for MinIO
});

const BUCKET = process.env.S3_BUCKET || "videos";

// ===========================================
// Storage Utility Functions
// ===========================================

/**
 * Check if the storage bucket is accessible
 */
export async function checkStorageHealth(): Promise<boolean> {
    try {
        await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
        return true;
    } catch {
        return false;
    }
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
    key: string,
    body: Buffer | Uint8Array | ReadableStream,
    contentType: string
): Promise<string> {
    await s3Client.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: body,
            ContentType: contentType,
        })
    );

    return key;
}

/**
 * Get a file from storage
 */
export async function getFile(key: string) {
    const response = await s3Client.send(
        new GetObjectCommand({
            Bucket: BUCKET,
            Key: key,
        })
    );

    return response;
}

/**
 * Generate a signed URL for downloading a file
 * @param key - The object key in storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a signed URL for uploading a file
 * @param key - The object key in storage
 * @param contentType - The MIME type of the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from storage
 */
export async function deleteFile(key: string): Promise<void> {
    await s3Client.send(
        new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
        })
    );
}

/**
 * List all files in the bucket
 * @param prefix - Optional prefix to filter files
 */
export async function listFiles(prefix?: string) {
    const response = await s3Client.send(
        new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: prefix,
        })
    );

    return response.Contents || [];
}

/**
 * Generate a unique file key for storage
 */
export function generateFileKey(originalFileName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalFileName.split(".").pop();

    return `videos/${timestamp}-${randomString}.${extension}`;
}

export { s3Client, BUCKET };
