"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label, FieldError } from "@/components/ui";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailInvalid = emailTouched && email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordInvalid = passwordTouched && password.length > 0 && password.length < 8;
  const emailError = emailInvalid ? "Enter a valid email address." : "";
  const passwordError = passwordInvalid ? "Password must be at least 8 characters." : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (emailError || passwordError) return;
    setLoading(true);
    try {
      // FR-24: Capture user timezone for focus date calculations
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          name: name || undefined,
          timezone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}&registered=1`);
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
          Create your account
        </h1>
        <p className="text-center text-muted-foreground mt-1 text-sm">
          Use your email and a secure password.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
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
              minLength={8}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onBlur={() => setPasswordTouched(true)}
              placeholder="At least 8 characters."
              error={!!passwordError}
              aria-invalid={!!passwordError || !!error}
              aria-errormessage={error ? "register-error" : undefined}
            />
            {passwordError && <p className="mt-1 text-xs text-destructive" role="alert">{passwordError}</p>}
            <FieldError id="register-error">{error}</FieldError>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm text-center text-muted-foreground text-sm">Loading…</div>
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
