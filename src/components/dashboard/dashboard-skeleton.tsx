import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Fallback streamed while the cached dashboard data resolves. */
export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-8">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-card" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 rounded-full" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </div>

      <div className="space-y-6 xl:col-span-4">
        <Card className="p-5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mx-auto mt-8 size-[208px] rounded-full" />
          <Skeleton className="mt-8 h-3 w-full" />
        </Card>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[72px] w-full rounded-card" />
        ))}
      </div>
    </div>
  );
}
