import { requireSuperAdmin } from "@/auth/access-scope.service";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ForbiddenError } from "./access-error";
import { authService } from "./auth.service";

import { Role } from "@/types/domain.schema";
import { rolePermissionService } from "./permission.service";

const roleSchema = z.enum(Role);

export const getRolePermissionsFn = createServerFn({
  method: "GET",
})
  .inputValidator(
    z.object({
      role: roleSchema,
    }),
  )
  .handler(async ({ data }) => {
    const user = await authService.getCurrentUser();
    if (!user) throw new ForbiddenError();
    if (user.role !== "SUPER_ADMIN" && data.role !== user.role)
      await requireSuperAdmin();
    return rolePermissionService.getByRole(data.role);
  });

export const assignRolePermissionFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      role: roleSchema,
      permission: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    // TODO: Check authentication + permission here

    await rolePermissionService.assign(data.role, data.permission);

    return {
      success: true,
    };
  });

export const revokeRolePermissionFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      role: roleSchema,
      permission: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    // TODO: Check authentication + permission here

    await rolePermissionService.revoke(data.role, data.permission);

    return {
      success: true,
    };
  });
