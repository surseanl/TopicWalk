"use client";

import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { clearIdentity, getIdentity } from "~/lib/identity";
import { createClient } from "~/lib/supabase/client";
import { cn } from "~/lib/utils";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/");
    });
  }, []);

  function reset() {
    setError(null);
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmEmail(null);
    setShowPassword(false);
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

  async function handleLogin() {
    const name = username.trim().toLowerCase();
    if (!name) {
      setError("Enter your username.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data: profile } = await supabase
      .from("tw_users")
      .select("email")
      .eq("username", name)
      .maybeSingle();

    if (!profile) {
      setError("Invalid username or password.");
      setLoading(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (loginError) {
      setError("Invalid username or password.");
      setLoading(false);
      return;
    }

    const existing = getIdentity();
    if (existing?.isGuest) clearIdentity();

    router.push("/");
    router.refresh();
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
        {/* Tab switcher */}
        <div className="relative flex rounded-xl bg-muted p-1">
          {/* Sliding pill indicator */}
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
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder={
                tab === "signup"
                  ? "letters, numbers, underscores"
                  : "your username"
              }
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete={tab === "login" ? "username" : "new-username"}
              maxLength={30}
              className="h-11 text-base"
            />
          </div>

          {tab === "signup" && (
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
          )}

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
