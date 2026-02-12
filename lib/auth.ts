import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

// Secure cookies in production (Vercel always serves HTTPS)
const isProduction = process.env.NODE_ENV === "production";
const baseUrl = process.env.NEXTAUTH_URL ?? "";
const useSecureCookies = isProduction && baseUrl.startsWith("https://");

if (isProduction && !process.env.NEXTAUTH_SECRET?.trim()) {
  throw new Error("NEXTAUTH_SECRET must be set in production. Generate with: openssl rand -base64 32");
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 }, // NFR-3: session timeout after 7 days inactivity
  pages: { signIn: "/auth/login" },
  useSecureCookies,
  cookies: {
    sessionToken: {
      name: useSecureCookies ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 7 * 24 * 60 * 60,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // NFR-3: Rate limiting for login attempts
        const ip = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || 'unknown';
        const rateLimitResult = await checkRateLimit(ip);
        if (!rateLimitResult.allowed) {
          throw new Error(`Too many login attempts. Try again in ${rateLimitResult.retryAfter} seconds.`);
        }

        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Open redirect defense: allow only relative paths or same-origin URLs
      if (url.startsWith("/")) return `${baseUrl.replace(/\/$/, "")}${url}`;
      try {
        const u = new URL(url);
        if (u.origin === new URL(baseUrl).origin) return url;
      } catch {
        // invalid URL
      }
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.email = user.email ?? undefined;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { onboardingCompletedAt: true },
          });
          token.onboardingCompletedAt = dbUser?.onboardingCompletedAt?.toISOString() ?? null;
        } catch {
          token.onboardingCompletedAt = null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.onboardingCompletedAt = token.onboardingCompletedAt ?? null;
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true },
        });
        session.user.name = dbUser?.name ?? null;
      }
      return session;
    },
  },
};
