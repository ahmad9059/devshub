"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  "off-topic": "Off-topic",
  other: "Other",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ModerationQueue({ communitySlug }: { communitySlug: string }) {
  const router = useRouter();
  const utils = api.useUtils();
  const [busy, setBusy] = useState<string | null>(null);

  const reports = api.report.listForCommunity.useQuery({ communitySlug });

  const resolve = api.report.resolve.useMutation({
    onSuccess: () => {
      utils.report.listForCommunity.invalidate({ communitySlug });
      router.refresh();
    },
  });

  const modDeletePost = api.post.modDelete.useMutation({
    onSuccess: () => {
      utils.report.listForCommunity.invalidate({ communitySlug });
      router.refresh();
    },
  });
  const modDeleteComment = api.comment.modDelete.useMutation({
    onSuccess: () => {
      utils.report.listForCommunity.invalidate({ communitySlug });
      router.refresh();
    },
  });

  const list = reports.data?.reports ?? [];

  const handleResolve = async (
    reportId: string,
    status: "resolved" | "dismissed",
  ) => {
    setBusy(reportId);
    await resolve.mutateAsync({ reportId, status });
    setBusy(null);
  };

  const handleDelete = async (report: {
    id: string;
    targetType: string;
    targetId: string;
  }) => {
    setBusy(report.id);
    if (report.targetType === "post") {
      await modDeletePost.mutateAsync({ id: report.targetId });
    } else {
      await modDeleteComment.mutateAsync({ id: report.targetId });
    }
    await resolve.mutateAsync({ reportId: report.id, status: "resolved" });
    setBusy(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {reports.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading reports…</p>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No open reports. Everything looks good!
            </p>
          </CardContent>
        </Card>
      ) : (
        list.map((report) => (
          <Card key={report.id} size="sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm capitalize">
                    {report.targetType} report
                  </CardTitle>
                  <Badge variant="secondary">
                    {REASON_LABELS[report.reason] ?? report.reason}
                  </Badge>
                  <Badge
                    variant={report.status === "open" ? "default" : "secondary"}
                  >
                    {report.status}
                  </Badge>
                </div>
                <span className="text-muted-foreground text-xs">
                  {timeAgo(report.createdAt)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-muted-foreground text-xs">
                Reported by {report.reporter.username ?? report.reporter.name}
              </p>
              {report.details && (
                <p className="text-sm italic">&ldquo;{report.details}&rdquo;</p>
              )}
              {report.status === "open" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    disabled={busy === report.id}
                    onClick={() => handleResolve(report.id, "resolved")}
                  >
                    {busy === report.id ? "Working…" : "Resolve"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy === report.id}
                    onClick={() => handleResolve(report.id, "dismissed")}
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busy === report.id}
                    onClick={() => handleDelete(report)}
                  >
                    Delete {report.targetType}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
