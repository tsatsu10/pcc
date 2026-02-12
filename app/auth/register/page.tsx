"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label, FieldError, PasswordInput } from "@/components/ui";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";

const FORM_ID = "register-form";

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
  const [nameTouched, setNameTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const emailInvalid = emailTouched && email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordInvalid = passwordTouched && password.length > 0 && password.length < 8;
  const nameInvalid = nameTouched && name.trim() === "";
  const emailError = emailInvalid ? "Enter a valid email address." : "";
  const passwordError = passwordInvalid ? "Password must be at least 8 characters." : "";
  const nameError = nameInvalid ? "Name is required." : "";

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (emailError || passwordError || nameError) return;
    if (!name.trim()) {
      setNameTouched(true);
      return;
    }
    setLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name.trim(),
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
    <AuthLayout formId={FORM_ID} skipToFormLabel="Skip to registration form">
      <AuthCard
        title="Create your account"
        subtitle="Use your email and a secure password to get started."
        footer={
          <>
            Already have an account?{" "}
            <Link href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-primary font-medium hover:underline">
              Sign in
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
            <Label htmlFor="register-name" required>Name</Label>
            <Input
              id="register-name"
              type="text"
              autoComplete="name"
              autoFocus
              required
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onBlur={() => setNameTouched(true)}
              placeholder="Your name"
              error={!!nameError}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "register-name-error" : undefined}
              className="mt-1.5"
            />
            {nameError && (
              <p id="register-name-error" className="mt-1 text-xs text-destructive" role="alert">
                {nameError}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="register-email" required>Email</Label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onBlur={() => setEmailTouched(true)}
              placeholder="you@example.com"
              error={!!emailError}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "register-email-error" : undefined}
              className="mt-1.5"
            />
            {emailError && (
              <p id="register-email-error" className="mt-1 text-xs text-destructive" role="alert">
                {emailError}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="register-password" required>Password</Label>
            <PasswordInput
              id="register-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onBlur={() => setPasswordTouched(true)}
              placeholder="At least 8 characters"
              error={!!passwordError || !!error}
              aria-invalid={!!passwordError || !!error}
              aria-errormessage={error ? "register-error" : undefined}
              aria-describedby={passwordError ? "register-password-error" : undefined}
              className="mt-1.5"
            />
            {passwordError && (
              <p id="register-password-error" className="mt-1 text-xs text-destructive" role="alert">
                {passwordError}
              </p>
            )}
            <FieldError id="register-error" ref={errorRef} tabIndex={-1}>
              {error}
            </FieldError>
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2" size="lg">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground text-sm">Loading…</div>
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
