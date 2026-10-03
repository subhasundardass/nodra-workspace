import type { Role } from '@/types/domain.schema';

export type CurrentUser = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  address: string | null;
  role: Role;
  memberId?: string | null;
  branchId: string | null;
  groupId: string | null;
  assignedGroupCount: number;
};
