import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/onboarding", "/profile"];
const authPaths = ["/auth/login", "/auth/register"];
const MAX_BODY_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

// Block common exploit/probe paths (return 404 without processing)
const BLOCKED_PATHS = [
  "/.env",
  "/.env.local",
  "/.env.production",
  "/.git",
  "/.git/",
  "/wp-admin",
  "/wp-login.php",
];
const BLOCKED_PREFIXES = ["/.env", "/.git", "/wp-", "/phpmyadmin", "/.aws", "/config.", "/server-status"];

function isBlockedPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (BLOCKED_PATHS.some((b) => p === b || p.startsWith(b))) return true;
  if (BLOCKED_PREFIXES.some((pre) => p.startsWith(pre))) return true;
  // Block paths that contain dangerous segments (e.g. /api/.env, /dashboard/.git)
  if (p.includes("/.env") || p.includes("/.git") || p.includes("wp-admin") || p.includes("wp-login") || p.includes("phpmyadmin")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (isBlockedPath(path)) {
    return new NextResponse(null, { status: 404 });
  }

  // Request body size limit for API routes (DoS mitigation)
  if (path.startsWith("/api/") && ["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413, headers: { "Retry-After": "60" } }
      );
    }
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isProtected = protectedPaths.some((p) => path.startsWith(p));
  const isAuthPage = authPaths.some((p) => path.startsWith(p));

  if (isProtected && !token) {
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  if (isAuthPage && token) {
    // Always send to dashboard; dashboard/onboarding layout will redirect by DB (token can be stale)
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Onboarding vs dashboard redirect is done in page/layout (DB is source of truth)
  const res = NextResponse.next();
  // Additional security headers (some also in next.config; middleware applies to all matcher routes)
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("X-Download-Options", "noopen");
  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/profile/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
