"use client";

import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { clearIdentity, getIdentity } from "~/lib/identity";
import { createClient } from "~/lib/supabase/client";
import { syncIdentityFromSupabase } from "~/lib/sync-identity";
import { cn } from "~/lib/utils";

export function AuthForm({ defaultTab }: { defaultTab: "login" | "signup" }) {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  function reset() {
    setError(null);
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmEmail(null);
    setShowPassword(false);
  }

  async function handleLogin() {
    const emailVal = email.trim().toLowerCase();
    if (!emailVal.includes("@") || !emailVal.includes(".")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: emailVal,
      password,
    });

    if (loginError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const existing = getIdentity();
    if (existing?.isGuest) clearIdentity();

    await syncIdentityFromSupabase(supabase);

    router.push("/");
    router.refresh();
  }

  async function handleSignUp() {
    const name = username.trim().toLowerCase();
    const emailVal = email.trim().toLowerCase();

    if (name.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(name)) {
      setError("Username: letters, numbers, and underscores only.");
      return;
    }
    if (!emailVal.includes("@") || !emailVal.includes(".")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data: existing } = await supabase
      .from("tw_users")
      .select("id")
      .eq("username", name)
      .maybeSingle();

    if (existing) {
      setError("Username already taken — try a different one.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: emailVal,
      password,
      options: {
        data: { username: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Sign up failed — try again.");
      setLoading(false);
      return;
    }

    await supabase
      .from("tw_users")
      .insert({ id: data.user.id, username: name, email: emailVal });

    setConfirmEmail(emailVal);
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  function submit() {
    if (tab === "login") handleLogin();
    else handleSignUp();
  }

  if (confirmEmail) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 gap-8">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start max-w-sm w-full"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <Image
          src="/image-1786109910251.png"
          alt="TopicWalk"
          height={64}
          width={250}
          className="object-contain"
          priority
        />
        <div className="w-full max-w-sm animate-scale-in bg-card rounded-2xl border shadow-md p-7 space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl">
            📬
          </div>
          <h2 className="text-xl font-bold">Check your email</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-foreground">
              {confirmEmail}
            </span>
            . Click it to activate your account, then log in here.
          </p>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setTab("login");
              reset();
            }}
          >
            Back to Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 gap-8">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start max-w-sm w-full"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <Image
        src="/image-1786109910251.png"
        alt="TopicWalk"
        height={64}
        width={250}
        className="object-contain animate-fade-in"
        priority
      />

      <div className="w-full max-w-sm animate-scale-in animation-delay-75 bg-card rounded-2xl border shadow-md p-6 space-y-5">
        {/* Google sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0"
            aria-hidden="true"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Tab switcher */}
        <div className="relative flex rounded-xl bg-muted p-1">
          <div
            className={cn(
              "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-background shadow-sm transition-all duration-200",
              tab === "login" ? "left-1" : "left-[calc(50%+3px)]",
            )}
          />
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                reset();
              }}
              className={cn(
                "relative z-10 flex-1 rounded-md py-1.5 text-sm font-medium transition-colors duration-200",
                tab === t
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70",
              )}
            >
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {tab === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="letters, numbers, underscores"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                maxLength={30}
                className="h-11 text-base"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={tab === "signup" ? "at least 8 characters" : ""}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  tab === "login" ? "current-password" : "new-password"
                }
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="h-11 text-base pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 animate-fade-in">
              {error}
            </p>
          )}

          <Button
            className="w-full h-12 text-base font-semibold shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 transition-all"
            onClick={submit}
            disabled={loading}
          >
            {loading
              ? "Please wait…"
              : tab === "login"
                ? "Log In"
                : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {tab === "login" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("signup");
                    reset();
                  }}
                  className="underline underline-offset-2 hover:text-foreground transition-colors font-medium"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have one?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    reset();
                  }}
                  className="underline underline-offset-2 hover:text-foreground transition-colors font-medium"
                >
                  Log In
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
