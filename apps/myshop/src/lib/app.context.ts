import type { QueryClient } from "@tanstack/react-query";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string | null;

  roleId: string;
  role: string;

  isActive: boolean;
}

export interface AppContext {
  queryClient: QueryClient;
  currentUser: AuthUser | null;
  sessionId: string | null;
  // permissions?: string[];
}
