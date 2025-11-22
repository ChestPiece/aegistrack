import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for dashboard stat cards
 * Shows 4 cards in a grid layout
 */
export function StatCardSkeleton() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

/**
 * Skeleton loader for task cards
 * Used in tasks list view
 */
export function TaskCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="glass hover:shadow-md transition-all">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

/**
 * Skeleton loader for project cards
 * Used in projects grid view
 */
export function ProjectCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="glass hover:shadow-lg transition-all">
          <CardHeader>
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

/**
 * Skeleton loader for team member cards
 * Used in team management page
 */
export function TeamMemberSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="glass">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </>
  );
}

/**
 * Skeleton loader for notification items
 * Used in notifications page
 */
export function NotificationSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-4 rounded-lg border bg-card"
        >
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Skeleton loader for completion rate card
 */
export function CompletionCardSkeleton() {
  return (
    <Card className="glass">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for recent tasks section
 */
export function RecentTasksSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Card className="glass">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(count)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
