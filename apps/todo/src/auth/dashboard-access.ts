import { getAccessScope } from './access-scope';
import type { CurrentUser } from './auth.types';

export function canPerform(
  user: CurrentUser,
  permissions: readonly string[],
  permission: string
): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if (permission === 'admin' || permission === 'branch.create') return false;
  try {
    getAccessScope(user);
  } catch {
    return false;
  }
  if (
    user.role === 'FIELD_OFFICER' &&
    (permission === 'group.create' ||
      permission.startsWith('dailyActivity.') ||
      /^(branch|product)\.(create|edit|delete)$/.test(permission))
  )
    return false;
  if (user.role === 'MEMBER' && !['memberPortal.view', 'memberPortal.request'].includes(permission))
    return false;
  return permissions.includes(permission);
}

export function canVisitDashboard(
  path: string,
  user: CurrentUser,
  permissions: readonly string[]
): boolean {
  path = path.replace(/\/$/, '');
  if (user.role === 'MEMBER') {
    if (path === '/dashboard' || path === '/dashboard/not-allowed') return true;
    if (path === '/dashboard/overview') return canPerform(user, permissions, 'memberPortal.view');
    if (path === '/dashboard/member-request')
      return canPerform(user, permissions, 'memberPortal.request');
    return false;
  }
  if (path === '/dashboard/member-request') return false;
  if (
    path === '/dashboard/not-allowed' ||
    path === '/dashboard/notifications' ||
    path === '/dashboard'
  )
    return true;
  if (
    path.startsWith('/dashboard/users') ||
    path === '/dashboard/settings' ||
    path === '/dashboard/settings/permissions'
  )
    return canPerform(user, permissions, 'admin');
  try {
    getAccessScope(user);
  } catch {
    return false;
  }
  if (path === '/dashboard/overview')
    return ['group.view', 'member.view', 'loan.view', 'collection.view'].every((code) =>
      canPerform(user, permissions, code)
    );
  let permission: string | undefined;
  if (path === '/dashboard/settings/ledgers' || path.startsWith('/dashboard/accounting/'))
    permission = 'accounting.view';
  else if (path.startsWith('/dashboard/daily-activity/')) {
    if (user.role === 'FIELD_OFFICER') return false;
    permission = path.endsWith('day-open')
      ? 'dailyActivity.open'
      : path.endsWith('day-close')
        ? 'dailyActivity.view'
        : path.endsWith('voucher-release')
          ? 'accounting.release.voucher'
          : 'accounting.authorize.voucher';
  } else if (path === '/dashboard/loan/create') permission = 'loan.create';
  else if (/^\/dashboard\/loan\/[^/]+\/edit$/.test(path))
    return canPerform(user, permissions, 'loan.edit') && canPerform(user, permissions, 'loan.view');
  else if (path === '/dashboard/collection/entry') permission = 'collection.create';
  else if (path === '/dashboard/product/category') return true;
  else if (path === '/dashboard/product/new') permission = 'product.create';
  else if (/^\/dashboard\/product\/[^/]+$/.test(path)) permission = 'product.edit';
  else {
    const resource = path.split('/')[2];
    if (['branch', 'group', 'members', 'loan', 'collection', 'product'].includes(resource))
      permission = `${resource === 'members' ? 'member' : resource}.view`;
  }
  return !permission || canPerform(user, permissions, permission);
}

export function accessibleDestination(user: CurrentUser, permissions: readonly string[]) {
  if (user.role === 'MEMBER') {
    if (canPerform(user, permissions, 'memberPortal.view'))
      return { to: '/dashboard/overview', label: 'Go to overview' };
    if (canPerform(user, permissions, 'memberPortal.request'))
      return { to: '/dashboard/member-request', label: 'Request a loan' };
    return { to: '/dashboard/not-allowed', label: 'Access unavailable' };
  }
  if (user.role === 'SUPER_ADMIN') return { to: '/dashboard/overview', label: 'Go to dashboard' };
  const choices =
    user.role === 'FIELD_OFFICER'
      ? [
          ['/dashboard/group', 'Go to my group'],
          ['/dashboard/members', 'Go to members'],
          ['/dashboard/collection', 'Go to collections'],
          ['/dashboard/loan', 'Go to loans']
        ]
      : [
          ['/dashboard/branch', 'Go to branches'],
          ['/dashboard/group', 'Go to groups'],
          ['/dashboard/members', 'Go to members'],
          ['/dashboard/loan', 'Go to loans'],
          ['/dashboard/collection', 'Go to collections'],
          ['/dashboard/product', 'Go to products']
        ];
  const match = choices.find(([path]) => canVisitDashboard(path, user, permissions));
  return match
    ? { to: match[0], label: match[1] }
    : { to: '/dashboard/notifications', label: 'Go to notifications' };
}
