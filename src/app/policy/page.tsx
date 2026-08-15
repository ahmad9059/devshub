import type { Metadata } from "next";

import { AppShell } from "~/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

export const metadata: Metadata = {
  title: "Content Policy",
  description: "DevsHub community guidelines and reporting policy.",
};

const guidelines = [
  {
    title: "Be kind and constructive",
    body: "Treat others with respect. Criticize ideas, not people. Harassment, hate speech, and personal attacks are not allowed.",
  },
  {
    title: "Stay on topic",
    body: "Post content relevant to the community you're posting in. Off-topic posts may be removed by moderators.",
  },
  {
    title: "No spam or self-promotion",
    body: "Repeatedly posting the same content, or excessive promotion of your own projects without participating in the community, is considered spam.",
  },
  {
    title: "No illegal or harmful content",
    body: "Do not post content that is illegal, promotes harm, or violates intellectual property rights.",
  },
  {
    title: "Respect privacy",
    body: "Do not share other people's personal information without their consent (doxxing).",
  },
];

export default function PolicyPage() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            DevsHub Content Policy
          </h1>
          <p className="text-muted-foreground text-sm">
            The rules that keep DevsHub a welcoming place for developers.
          </p>
        </div>

        <Alert>
          <AlertTitle>Effective date</AlertTitle>
          <AlertDescription>
            This policy applies to all content posted on DevsHub.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Community Guidelines</CardTitle>
            <CardDescription>
              Everyone is expected to follow these guidelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {guidelines.map((guideline, index) => (
              <div key={guideline.title} className="flex flex-col gap-1">
                <h2 className="text-sm font-medium">
                  {index + 1}. {guideline.title}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {guideline.body}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Reporting Content</CardTitle>
            <CardDescription>
              How to flag content that violates this policy.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">
              Use the &ldquo;Report&rdquo; button on any post or comment to flag
              it for review. Reports are reviewed by the community&apos;s
              moderators. Moderators can remove content that violates these
              guidelines.
            </p>
            <p className="text-muted-foreground text-sm">
              Report reasons include spam, harassment, off-topic content, and
              other violations. When reviewing reports, moderators consider the
              content in context and the intent of the poster.
            </p>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-xs">
          DevsHub may update this policy as the platform evolves. Continued use
          of the platform constitutes acceptance of the current policy.
        </p>
      </div>
    </AppShell>
  );
}
