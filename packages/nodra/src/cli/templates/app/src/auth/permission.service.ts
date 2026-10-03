import { Role } from '@/types/domain.schema';
import { ForbiddenError } from './access-error';
import { authService } from './auth.service';
import { rolePermissionRepository } from './permission.repository';
export { ForbiddenError } from './access-error';

class RolePermissionService {
  async getByRole(role: Role): Promise<string[]> {
    const rows = await rolePermissionRepository.findByRole(role);

    return rows.map((row) => row.permission);
  }

  async has(role: Role, permission: string) {
    if (role === Role.SUPER_ADMIN) return true;
    if (role === Role.MEMBER && !['memberPortal.view', 'memberPortal.request'].includes(permission))
      return false;
    return rolePermissionRepository.exists(role, permission);
  }

  async require(role: Role, permission: string): Promise<void> {
    const allowed = await this.has(role, permission);

    if (!allowed) {
      throw new ForbiddenError(`Missing permission: ${permission}`);
    }
  }

  async assign(role: Role, permission: string) {
    const user = await authService.getCurrentUser();
    if (user?.role !== Role.SUPER_ADMIN) throw new ForbiddenError();
    if (role === Role.MEMBER && !['memberPortal.view', 'memberPortal.request'].includes(permission))
      throw new ForbiddenError('Members can only use Member Portal permissions.');
    return rolePermissionRepository.assign(role, permission);
  }

  async revoke(role: Role, permission: string) {
    const user = await authService.getCurrentUser();
    if (user?.role !== Role.SUPER_ADMIN) throw new ForbiddenError();
    return rolePermissionRepository.revoke(role, permission);
  }
}

export const rolePermissionService = new RolePermissionService();
