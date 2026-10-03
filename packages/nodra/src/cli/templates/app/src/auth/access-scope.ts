import { ForbiddenError } from './access-error';
import type { CurrentUser } from './auth.types';

export type AccessScope = {
  branchId?: string;
  groupId?: string;
  fieldOfficerId?: string;
  memberId?: string;
};

/** Shared policy for server enforcement and locked form defaults. */
export function getAccessScope(user: CurrentUser): AccessScope {
  switch (user.role) {
    case 'MEMBER':
      if (!user.memberId || !user.branchId)
        throw new ForbiddenError('No member linked to your account.');
      return {
        memberId: user.memberId,
        branchId: user.branchId,
        groupId: user.groupId ?? undefined
      };
    case 'SUPER_ADMIN':
      return {};
    case 'BRANCH_ADMIN':
    case 'BRANCH_MANAGER':
      if (!user.branchId) throw new ForbiddenError('No branch assigned to your account.');
      return { branchId: user.branchId };
    case 'FIELD_OFFICER':
      if (!user.branchId || !user.groupId || user.assignedGroupCount !== 1) {
        throw new ForbiddenError(
          'A field officer must be assigned to exactly one group in their branch.'
        );
      }
      return {
        branchId: user.branchId,
        groupId: user.groupId,
        fieldOfficerId: user.id
      };
    case 'ACCOUNTANT': {
      // Manage accountant access scope here when its rules are defined.
      break;
    }
    case 'DATA_ENTRY': {
      // Manage data-entry access scope here when its rules are defined.
      break;
    }
    default:
      break;
  }
  // Undefined scopes must never accidentally grant access to all data.
  throw new ForbiddenError('Access scope has not been configured for this role.');
}
