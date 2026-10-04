export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(
      `Access denied. Please ask your administrator to check your permissions and branch or group access. ${message}`,
    );
    this.name = "ForbiddenError";
  }
}

export function isAccessDenied(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as {
    name?: string;
    message?: string;
    status?: number;
    statusCode?: number;
  };
  return (
    value.name === "ForbiddenError" ||
    value.status === 403 ||
    value.statusCode === 403 ||
    /Access denied|permission denied|missing permission|do not have permission|outside your access scope|No branch assigned|exactly one group|Access scope has not been configured/i.test(
      value.message ?? "",
    )
  );
}
