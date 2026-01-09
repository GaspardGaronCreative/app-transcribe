import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkStorageHealth } from "@/lib/storage";

export const dynamic = "force-dynamic";

interface HealthStatus {
    status: "healthy" | "unhealthy";
    timestamp: string;
    services: {
        database: {
            status: "connected" | "disconnected";
            latency?: number;
        };
        storage: {
            status: "connected" | "disconnected";
        };
    };
    app: {
        name: string;
        environment: string;
    };
}

export async function GET() {
    const startTime = Date.now();

    // Check database connection
    let dbStatus: "connected" | "disconnected" = "disconnected";
    let dbLatency: number | undefined;

    try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        dbLatency = Date.now() - dbStart;
        dbStatus = "connected";
    } catch (error) {
        console.error("Database health check failed:", error);
    }

    // Check storage connection
    let storageStatus: "connected" | "disconnected" = "disconnected";

    try {
        const isHealthy = await checkStorageHealth();
        storageStatus = isHealthy ? "connected" : "disconnected";
    } catch (error) {
        console.error("Storage health check failed:", error);
    }

    // Determine overall health
    const isHealthy = dbStatus === "connected" && storageStatus === "connected";

    const response: HealthStatus = {
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
            database: {
                status: dbStatus,
                latency: dbLatency,
            },
            storage: {
                status: storageStatus,
            },
        },
        app: {
            name: process.env.NEXT_PUBLIC_APP_NAME || "app-transcribe",
            environment: process.env.NODE_ENV || "development",
        },
    };

    return NextResponse.json(response, {
        status: isHealthy ? 200 : 503,
    });
}
