import { Skeleton } from "@/shared/components/ui/skeleton";
import { CardHeader, CardContent } from "@/shared/components/ui/card";
import { GlassCard } from "@/shared/components/ui/GlassCard";

export function TaskSkeleton() {
  return (
    <GlassCard className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <Skeleton className="h-6 w-6 rounded-full ring-2 ring-background" />
              <Skeleton className="h-6 w-6 rounded-full ring-2 ring-background" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>

          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-12" />
          </div>
        </div>

        <div className="pt-2">
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </CardContent>
    </GlassCard>
  );
}
