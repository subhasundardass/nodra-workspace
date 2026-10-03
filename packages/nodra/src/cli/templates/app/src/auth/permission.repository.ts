import { Role } from "@/types/domain.schema";
import { prisma } from "@/lib/prisma";

export const rolePermissionRepository = {
  async findByRole(role: Role) {
    return prisma.rolePermission.findMany({
      where: {
        role,
      },
      select: {
        permission: true,
      },
    });
  },

  async exists(role: Role, permission: string) {
    const result = await prisma.rolePermission.findUnique({
      where: {
        role_permission: {
          role,
          permission,
        },
      },
      select: {
        id: true,
      },
    });

    return !!result;
  },

  async assign(role: Role, permission: string) {
    return prisma.rolePermission.upsert({
      where: {
        role_permission: {
          role,
          permission,
        },
      },
      update: {},
      create: {
        role,
        permission,
      },
    });
  },

  async revoke(role: Role, permission: string) {
    return prisma.rolePermission.delete({
      where: {
        role_permission: {
          role,
          permission,
        },
      },
    });
  },
};
