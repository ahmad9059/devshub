"use client";

import { CircleAlertIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "~/components/ui/card";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              An unexpected error occurred while rendering this page.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CardDescription className="text-muted-foreground text-sm">
            Try again, or head back home.{" "}
            {error.digest && (
              <span className="font-mono text-xs">
                Reference: {error.digest}
              </span>
            )}
          </CardDescription>
          <div className="flex items-center gap-2">
            <Button onClick={reset}>
              <RotateCcwIcon aria-hidden="true" />
              Try again
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/" />}
            >
              Back home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
