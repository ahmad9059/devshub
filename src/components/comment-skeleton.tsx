import { Skeleton } from "~/components/ui/skeleton";
import { Card } from "~/components/ui/card";

export function CommentSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} size="sm">
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-5/6 rounded" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-5 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
