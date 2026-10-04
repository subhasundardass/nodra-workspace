interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function DataTableSkeleton({
  rows = 20,
  columns = 7,
}: DataTableSkeletonProps) {
  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="w-full overflow-hidden rounded-lg border border-border _bg-card">
        {/* Header */}
        <div className="flex h-12 w-full items-center gap-4 border-b bg-muted/30 px-4">
          {Array.from({ length: columns }).map((_, index) => (
            <div
              key={index}
              className="h-4 animate-pulse rounded bg-muted"
              style={{
                width:
                  index === 0
                    ? "160px"
                    : index === columns - 1
                      ? "60px"
                      : "100px",
              }}
            />
          ))}
        </div>

        {/* Rows */}
        <div className="w-full divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex h-16 w-full items-center gap-4 px-4"
            >
              {Array.from({ length: columns }).map((_, columnIndex) => {
                if (columnIndex === 0) {
                  return (
                    <div
                      key={columnIndex}
                      className="flex w-48 shrink-0 items-center gap-3"
                    >
                      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />

                      <div className="flex flex-col gap-1.5">
                        <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-20 animate-pulse rounded bg-muted/70" />
                      </div>
                    </div>
                  );
                }

                if (columnIndex === columns - 1) {
                  return (
                    <div
                      key={columnIndex}
                      className="ml-auto h-8 w-8 shrink-0 animate-pulse rounded-md bg-muted"
                    />
                  );
                }

                return (
                  <div
                    key={columnIndex}
                    className="h-3.5 w-24 animate-pulse rounded bg-muted"
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex h-12 w-full items-center justify-between border-t bg-muted/20 px-4">
          <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />

          <div className="flex gap-2">
            <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
