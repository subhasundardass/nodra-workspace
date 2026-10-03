import type { InfobarContent } from "@/components/ui/infobar";
import React from "react";
import { Heading } from "../ui/heading";

export function PageSkeleton() {
  return (
    <div className="flex flex-1 animate-pulse flex-col gap-4 p-4 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="bg-muted mb-2 h-8 w-48 rounded" />
          <div className="bg-muted h-4 w-96 rounded" />
        </div>
      </div>

      <div className="bg-muted mt-6 h-40 w-full rounded-lg" />
      <div className="bg-muted h-40 w-full rounded-lg" />
    </div>
  );
}

interface PageContainerProps {
  children: React.ReactNode;
  isLoading?: boolean;
  access?: boolean;
  accessFallback?: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  infoContent?: InfobarContent;
  pageHeaderAction?: React.ReactNode;
  pageToolbar?: React.ReactNode;
}

export default function PageContainer({
  children,
  isLoading = false,
  access = true,
  accessFallback,
  pageTitle,
  pageDescription,
  infoContent,
  pageHeaderAction,
  pageToolbar,
}: PageContainerProps) {
  if (!access) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:px-6">
        {accessFallback ?? (
          <div className="text-muted-foreground text-center text-lg">
            You do not have access to this page.
          </div>
        )}
      </div>
    );
  }

  const content = isLoading ? <PageSkeleton /> : children;
  const hasHeader = Boolean(pageTitle || pageHeaderAction || pageToolbar);

  return (
    <div className="flex flex-1 flex-col p-4 md:px-6">
      {hasHeader && (
        <div className="mb-4 w-full space-y-3">
          {/* Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Heading
                title={pageTitle ?? ""}
                description={pageDescription ?? ""}
                infoContent={infoContent}
              />
            </div>

            {pageHeaderAction && (
              <div className="flex shrink-0 items-center gap-2">
                {pageHeaderAction}
              </div>
            )}
          </div>

          {/* Full-width Toolbar */}
          {pageToolbar && <div className="w-full min-w-0">{pageToolbar}</div>}
        </div>
      )}

      {content}
    </div>
  );
}
