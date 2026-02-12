import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const nextAuthHandler = NextAuth(authOptions);

async function handler(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    return await nextAuthHandler(req, context as unknown as never);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[NextAuth]", e);
    }
    return new Response(
      JSON.stringify({
        error: "Authentication failed",
        message: process.env.NODE_ENV === "production" ? "Something went wrong. Please try again." : String((e as Error).message),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export { handler as GET, handler as POST };
