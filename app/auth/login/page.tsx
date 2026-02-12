"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label, FieldError } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailInvalid = emailTouched && email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = emailInvalid ? "Enter a valid email address." : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (emailInvalid) return;
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Email or password is incorrect.");
        return;
      }
      if (res?.url) router.push(res.url);
      else router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center mb-6">
          <img src="/pcc-logo.svg" alt="PCC" className="h-10 w-10 opacity-90" />
        </Link>
        <h1 className="text-xl font-semibold text-center text-foreground">
          Sign in
        </h1>
        <p className="text-center text-muted-foreground mt-1 text-sm">
          Sign in to your workspace.
        </p>
        {registered === "1" && (
          <p className="mt-3 text-center text-sm text-success">
            Account created. Log in below.
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onBlur={() => setEmailTouched(true)}
              placeholder="you@example.com"
              error={!!emailError}
              aria-invalid={!!emailError}
            />
            {emailError && <p className="mt-1 text-xs text-destructive" role="alert">{emailError}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-invalid={!!error}
              aria-errormessage={error ? "login-error" : undefined}
            />
            <FieldError id="login-error">{error}</FieldError>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm text-center text-muted-foreground text-sm">Loading…</div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
