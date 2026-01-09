import { PrismaClient } from "@prisma/client";

// Declare global type for PrismaClient to enable singleton pattern
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create PrismaClient singleton
// In development, we use globalThis to preserve the client across hot reloads
// In production, we create a new client for each request
export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Save the client to globalThis in development to prevent multiple instances
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
