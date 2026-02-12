import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1, "Name is required").trim(),
  timezone: z.string().optional(), // FR-24: Capture user timezone
});

export async function POST(req: Request) {
  // NFR-3: Rate limiting - max 5 attempts per IP per 15 minutes
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = await checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: `Too many registration attempts. Try again in ${rateLimitResult.retryAfter} seconds.` },
      { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
    );
  }

  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { email, password, name, timezone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: { 
        email, 
        passwordHash, 
        name,
        timezone: timezone ?? 'UTC', // Default to UTC if not provided
      },
      select: { id: true, email: true, name: true, timezone: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
