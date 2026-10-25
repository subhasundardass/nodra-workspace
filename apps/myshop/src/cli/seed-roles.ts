import type { Pool, PoolClient } from "pg";

const BUILT_IN_ROLES = [
  {
    role_name: "System Manager",
    disabled: false,
    desk_access: true,
    is_custom: false,
  },
  {
    role_name: "Administrator",
    disabled: false,
    desk_access: true,
    is_custom: false,
  },
  {
    role_name: "Guest",
    disabled: false,
    desk_access: false,
    is_custom: false,
  },
  {
    role_name: "All",
    disabled: false,
    desk_access: false,
    is_custom: false,
  },
  {
    role_name: "Operator",
    disabled: false,
    desk_access: true,
    is_custom: true,
  },
  {
    role_name: "Tester",
    disabled: false,
    desk_access: true,
    is_custom: true,
  },
  {
    role_name: "Valuation Manager",
    disabled: false,
    desk_access: true,
    is_custom: true,
  },
  {
    role_name: "Accountant",
    disabled: false,
    desk_access: true,
    is_custom: true,
  },
  {
    role_name: "Accounts Manager",
    disabled: false,
    desk_access: true,
    is_custom: true,
  },
  {
    role_name: "Distribution Manager",
    disabled: false,
    desk_access: true,
    is_custom: true,
  },
  {
    role_name: "Warehouse Manager",
    disabled: false,
    desk_access: true,
    is_custom: true,
  },
] as const;

async function assignSystemManagerToAdmin(client: PoolClient): Promise<void> {
  const result = await client.query<{ name: string }>(
    `SELECT name FROM tab_user WHERE email = $1 LIMIT 1`,
    ["admin@example.com"],
  );

  if (result.rows.length === 0) {
    console.log("Admin user not found; skipping role assignment.");
    return;
  }

  const userName = result.rows[0]?.name;

  const existing = await client.query(
    `SELECT 1
     FROM tab_user_role
     WHERE parent = $1
       AND parenttype = 'User'
       AND parentfield = 'roles'
       AND role = $2
     LIMIT 1`,
    [userName, "System Manager"],
  );

  if (existing.rowCount === 0) {
    await client.query(
      `INSERT INTO tab_user_role (
        name, owner, creation, modified, modified_by,
        docstatus, idx, parent, parenttype, parentfield, role
      ) VALUES ($1, $2, NOW(), NOW(), $2, 0, 1, $2, 'User', 'roles', $3)
      ON CONFLICT DO NOTHING`,
      [`${userName}-system-manager`, userName, "System Manager"],
    );
  }

  console.log(`System Manager assignment verified for ${userName}.`);
}

export async function seedRoles(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const table = await client.query<{ table_name: string | null }>(
      "SELECT to_regclass('tab_role')::text AS table_name",
    );

    if (!table.rows[0]?.table_name) {
      throw new Error('Table "tab_role" does not exist. Run migrations first.');
    }

    for (const [index, role] of BUILT_IN_ROLES.entries()) {
      await client.query(
        `INSERT INTO tab_role (
          name,
          owner,
          creation,
          modified,
          modified_by,
          docstatus,
          idx,
          role_name,
          disabled,
          desk_access,
          is_custom,
          parent_role
        )
        VALUES (
          $1, 'Administrator', NOW(), NOW(), 'Administrator',
          0, $5, $1, $2, $3, $4, NULL
        )
        ON CONFLICT DO NOTHING`,
        [
          role.role_name,
          role.disabled,
          role.desk_access,
          role.is_custom,
          index + 1,
        ],
      );
    }

    await assignSystemManagerToAdmin(client);

    await client.query("COMMIT");
    console.log(
      `Role seeding completed. ${BUILT_IN_ROLES.length} roles checked.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
