import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "~/components/ui/card";

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} size="sm">
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-2 pl-(--card-spacing)">
              <Skeleton className="size-6 rounded" />
              <Skeleton className="h-4 w-5 rounded" />
              <Skeleton className="size-6 rounded" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-(--card-spacing)">
              <CardHeader>
                <Skeleton className="h-5 w-3/4 rounded" />
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-40 w-full rounded-md" />
              </CardContent>
              <CardContent>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Skeleton className="h-3 w-14 rounded" />
                  <Skeleton className="size-4 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-3 w-10 rounded" />
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
