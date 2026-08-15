"use client";

import { Code2Icon } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { api } from "~/trpc/react";
import { ThemeToggle } from "~/components/theme-toggle";
import { Turnstile } from "~/components/turnstile";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path
        d="M21.6 12.23a9.5 9.5 0 0 0-.19-1.87H12v3.55h5.4a4.37 4.37 0 0 1-1.9 2.87v2.38h3.06c1.8-1.65 2.84-4.09 2.84-6.93Z"
        fill="#4285F4"
      />
      <path
        d="M12 22a8.26 8.26 0 0 0 5.56-2.05l-3.06-2.37a4.86 4.86 0 0 1-7.34-2.6H2.93v2.44A9 9 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M7.16 14.42a4.82 4.82 0 0 1 0-3.08V8.9H2.93a9 9 0 0 0 0 8.06l4.23-2.54Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.93c1.63 0 3.1.56 4.25 1.66l3.04-3.04A8.26 8.26 0 0 0 12 3a9 9 0 0 0-8.07 4.97l4.23 3.14a4.86 4.86 0 0 1 7.84-3.18Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.91-1.294 2.75-1.025 2.75-1.025.544 1.377.201 2.394.098 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.001 10.001 0 0 0 22 12c0-5.523-4.477-10-10-10Z" />
    </svg>
  );
}

const passwordRequirements = [
  "At least 8 characters",
  "One uppercase letter",
  "One lowercase letter",
  "One number",
  "One special character",
];

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center" />
      }
    >
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const signup = api.auth.signup.useMutation({
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!turnstileToken) {
      setError("Please complete the bot verification.");
      return;
    }

    const result = await signup.mutateAsync({
      name,
      email,
      password,
      turnstileToken,
    });
    if (!result) {
      return;
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Code2Icon className="size-4" aria-hidden="true" />
            <span className="text-sm font-semibold">DevsHub</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-col items-center px-4 py-12 sm:px-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>
              Join DevsHub to post, comment, and vote.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => signIn("google", { callbackUrl })}
              >
                <GoogleIcon aria-hidden="true" />
                Continue with Google
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => signIn("github", { callbackUrl })}
              >
                <GithubIcon aria-hidden="true" />
                Continue with GitHub
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs">or</span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  minLength={2}
                  maxLength={50}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={8}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <ul className="text-muted-foreground flex flex-col gap-0.5 text-xs">
                  {passwordRequirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={8}
                  maxLength={128}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Turnstile onVerify={setTurnstileToken} />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={signup.isPending || !turnstileToken}
              >
                {signup.isPending ? "Creating account…" : "Create account"}
              </Button>
            </form>

            <p className="text-muted-foreground text-center text-sm">
              Already have an account?{" "}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="text-primary hover:underline"
              >
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
