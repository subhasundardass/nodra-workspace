import { prisma } from '@/lib/prisma';
import { getAccessScope, type AccessScope } from './access-scope';
import { authService } from './auth.service';
import { ForbiddenError, rolePermissionService } from './permission.service';

export async function requireSuperAdmin() {
  const user = await authService.getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') throw new ForbiddenError();
  return user;
}

export async function requireAccess(permission?: string | readonly string[]) {
  const user = await authService.getCurrentUser();
  if (!user) throw new ForbiddenError('You must be signed in.');
  if (user.role === 'MEMBER') throw new ForbiddenError('Use the member portal for this operation.');
  const scope = getAccessScope(user);
  if (permission) {
    const permissions = typeof permission === 'string' ? [permission] : permission;
    const allowed = await Promise.all(
      permissions.map((code) => rolePermissionService.has(user.role, code))
    );
    if (!allowed.some(Boolean))
      throw new ForbiddenError('Missing permission to perform this operation.');
  }
  return { user, scope };
}

export function assertBranch(scope: AccessScope, branchId: string | null | undefined) {
  if (scope.branchId && scope.branchId !== branchId)
    throw new ForbiddenError('Branch is outside your access scope.');
}

export async function assertGroup(scope: AccessScope, id: string) {
  const group = await prisma.group.findUnique({
    where: { id },
    select: { id: true, branchId: true, fieldOfficerId: true }
  });
  if (!group) throw new ForbiddenError('Group is unavailable.');
  assertBranch(scope, group.branchId);
  if (scope.groupId && scope.groupId !== group.id)
    throw new ForbiddenError('Group is outside your access scope.');
  return group;
}

export async function assertMember(scope: AccessScope, id: string) {
  const member = await prisma.member.findUnique({
    where: { id },
    select: { id: true, branchId: true, groupId: true }
  });
  if (!member) throw new ForbiddenError('Member is unavailable.');
  assertBranch(scope, member.branchId);
  if (scope.groupId && member.groupId !== scope.groupId)
    throw new ForbiddenError('Member is outside your access scope.');
  return member;
}

export async function assertLoan(scope: AccessScope, id: string) {
  const loan = await prisma.loan.findUnique({
    where: { id },
    select: { id: true, branchId: true, groupId: true, memberId: true }
  });
  if (!loan) throw new ForbiddenError('Loan is unavailable.');
  assertBranch(scope, loan.branchId);
  if (scope.groupId && loan.groupId !== scope.groupId)
    throw new ForbiddenError('Loan is outside your access scope.');
  await assertMember(scope, loan.memberId);
  return loan;
}

type ScopedInput = {
  id?: string;
  branchId?: string;
  branchIds?: string[];
  groupId?: string;
  groupIds?: string[];
  memberId?: string;
  loanId?: string;
  fieldOfficerId?: string;
  collectedBy?: string;
  installmentId?: string | null;
  cashInId?: string | null;
  products?: { productId?: string }[];
};
type Resource = 'member' | 'loan' | 'collection' | 'group' | 'branch' | 'dailyActivity' | 'product';

/** Run at every public server boundary, before reading or mutating records. */
export async function authorizeInput<T extends ScopedInput>(
  data: T,
  resource: Resource,
  action: string,
  options: { list?: boolean; lookup?: boolean } = {}
): Promise<T> {
  const { user, scope } = await requireAccess(
    options.lookup
      ? [
          `${resource}.view`,
          'member.create',
          'member.edit',
          'loan.view',
          'loan.create',
          'loan.edit',
          'collection.create',
          'collection.view'
        ]
      : `${resource}.${action}`
  );
  const write = action !== 'view';
  if (
    user.role !== 'SUPER_ADMIN' &&
    ((resource === 'branch' && action === 'create') ||
      (user.role === 'FIELD_OFFICER' &&
        ((resource === 'group' && action === 'create') ||
          resource === 'dailyActivity' ||
          ((resource === 'branch' || resource === 'product') && write))))
  )
    throw new ForbiddenError();

  if (
    scope.fieldOfficerId &&
    'fieldOfficerId' in data &&
    data.fieldOfficerId &&
    data.fieldOfficerId !== scope.fieldOfficerId
  ) {
    throw new ForbiddenError('Field officer is outside your access scope.');
  }
  if (
    scope.fieldOfficerId &&
    resource === 'group' &&
    write &&
    data.fieldOfficerId !== scope.fieldOfficerId
  ) {
    throw new ForbiddenError('You cannot change your group assignment.');
  }
  if (data.id) {
    if (resource === 'member') await assertMember(scope, data.id);
    if (resource === 'product') await assertProduct(scope, data.id);
    if (resource === 'loan') await assertLoan(scope, data.id);
    if (resource === 'group') await assertGroup(scope, data.id);
    if (resource === 'branch') assertBranch(scope, data.id);
    if (resource === 'collection') {
      const collection = await prisma.collection.findUnique({
        where: { id: data.id },
        select: { branchId: true, loanId: true, memberId: true }
      });
      if (!collection) throw new ForbiddenError('Collection is unavailable.');
      assertBranch(scope, collection.branchId);
      await assertLoan(scope, collection.loanId);
      await assertMember(scope, collection.memberId);
    }
  }
  if (data.branchId) assertBranch(scope, data.branchId);
  for (const id of data.branchIds ?? []) assertBranch(scope, id);
  if (data.groupId) await assertGroup(scope, data.groupId);
  for (const id of data.groupIds ?? []) await assertGroup(scope, id);
  const member = data.memberId ? await assertMember(scope, data.memberId) : undefined;
  const loan = data.loanId ? await assertLoan(scope, data.loanId) : undefined;
  if (write) {
    for (const item of data.products ?? []) {
      if (!item.productId) continue;
      const product = await assertProduct(scope, item.productId);
      if (data.branchId && product.branchId !== data.branchId)
        throw new ForbiddenError('Product does not belong to the selected branch.');
    }
    if (
      member &&
      ((data.branchId && member.branchId !== data.branchId) ||
        (data.groupId && member.groupId !== data.groupId))
    )
      throw new ForbiddenError('Member does not belong to the selected branch/group.');
    if (
      loan &&
      ((data.branchId && loan.branchId !== data.branchId) ||
        (data.memberId && loan.memberId !== data.memberId))
    )
      throw new ForbiddenError('Loan does not belong to the selected member/branch.');
    if (data.groupId) {
      const group = await assertGroup(scope, data.groupId);
      if (data.branchId && group.branchId !== data.branchId)
        throw new ForbiddenError('Group does not belong to the selected branch.');
    }
    if (data.collectedBy) {
      const collector = await prisma.user.findUnique({
        where: { id: data.collectedBy },
        select: { branchId: true, isActive: true }
      });
      if (
        !collector?.isActive ||
        (scope.fieldOfficerId && data.collectedBy !== user.id) ||
        (user.role !== 'SUPER_ADMIN' && collector.branchId !== scope.branchId)
      )
        throw new ForbiddenError('Collector is outside your access scope.');
    }
    if (data.installmentId) {
      const installment = await prisma.installment.findUnique({
        where: { id: data.installmentId },
        select: { loanId: true }
      });
      if (!installment || installment.loanId !== data.loanId)
        throw new ForbiddenError('Installment does not belong to the selected loan.');
    }
    if (data.cashInId) {
      const cashIn = await prisma.cashIn.findUnique({
        where: { id: data.cashInId },
        select: { branchId: true }
      });
      if (!cashIn || cashIn.branchId !== data.branchId)
        throw new ForbiddenError('Cash entry does not belong to the selected branch.');
    }
  }
  const result = { ...data };
  if (scope.branchId && (options.list || 'branchId' in data)) result.branchId = scope.branchId;
  if (scope.groupId && (options.list || resource === 'member' || resource === 'loan'))
    result.groupId = scope.groupId;
  if (scope.fieldOfficerId && (options.list || 'fieldOfficerId' in data))
    result.fieldOfficerId = scope.fieldOfficerId;
  if (options.list && resource === 'loan') {
    if (scope.branchId) result.branchIds = [scope.branchId];
    if (scope.groupId) result.groupIds = [scope.groupId];
  }
  return result;
}

export async function assertProduct(scope: AccessScope, id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { branchId: true }
  });
  if (!product) throw new ForbiddenError('Product is unavailable.');
  assertBranch(scope, product.branchId);
  return product;
}
