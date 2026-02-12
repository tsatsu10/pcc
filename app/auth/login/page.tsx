"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label, FieldError, PasswordInput } from "@/components/ui";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";

const FORM_ID = "login-form";

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
  const errorRef = useRef<HTMLParagraphElement>(null);

  const emailInvalid = emailTouched && email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = emailInvalid ? "Enter a valid email address." : "";

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

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
    <AuthLayout formId={FORM_ID} skipToFormLabel="Skip to sign in form">
      <AuthCard
        title="Sign in"
        subtitle="Sign in to your workspace to continue."
        topMessage={
          registered === "1" ? (
            <p className="text-sm text-success font-medium" role="status" aria-live="polite">
              Account created. Log in below.
            </p>
          ) : null
        }
        footer={
          <>
            Don&apos;t have an account?{" "}
            <Link href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </>
        }
      >
        <form
          id={FORM_ID}
          onSubmit={handleSubmit}
          className="space-y-4"
          aria-busy={loading}
          noValidate
        >
          <div>
            <Label htmlFor="login-email" required>Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onBlur={() => setEmailTouched(true)}
              placeholder="you@example.com"
              error={!!emailError}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "login-email-error" : undefined}
              className="mt-1.5"
            />
            {emailError && (
              <p id="login-email-error" className="mt-1 text-xs text-destructive" role="alert">
                {emailError}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="login-password" required>Password</Label>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              error={!!error}
              aria-invalid={!!error}
              aria-errormessage={error ? "login-error" : undefined}
              className="mt-1.5"
            />
            <FieldError id="login-error" ref={errorRef} tabIndex={-1}>
              {error}
            </FieldError>
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2" size="lg">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground text-sm">Loading…</div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
