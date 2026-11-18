import type { Pool } from "pg";

const states = [
  // States
  ["02", "Himachal Pradesh", "IN-HP", false],
  ["03", "Punjab", "IN-PB", false],
  ["05", "Uttarakhand", "IN-UT", false],
  ["06", "Haryana", "IN-HR", false],
  ["08", "Rajasthan", "IN-RJ", false],
  ["09", "Uttar Pradesh", "IN-UP", false],
  ["10", "Bihar", "IN-BR", false],
  ["11", "Sikkim", "IN-SK", false],
  ["12", "Arunachal Pradesh", "IN-AR", false],
  ["13", "Nagaland", "IN-NL", false],
  ["14", "Manipur", "IN-MN", false],
  ["15", "Mizoram", "IN-MZ", false],
  ["16", "Tripura", "IN-TR", false],
  ["17", "Meghalaya", "IN-ML", false],
  ["18", "Assam", "IN-AS", false],
  ["19", "West Bengal", "IN-WB", false],
  ["20", "Jharkhand", "IN-JH", false],
  ["21", "Odisha", "IN-OD", false],
  ["22", "Chhattisgarh", "IN-CT", false],
  ["23", "Madhya Pradesh", "IN-MP", false],
  ["24", "Gujarat", "IN-GJ", false],
  ["27", "Maharashtra", "IN-MH", false],
  ["29", "Karnataka", "IN-KA", false],
  ["30", "Goa", "IN-GA", false],
  ["32", "Kerala", "IN-KL", false],
  ["33", "Tamil Nadu", "IN-TN", false],
  ["36", "Telangana", "IN-TG", false],
  ["37", "Andhra Pradesh", "IN-AP", false],

  // Union Territories
  ["01", "Jammu and Kashmir", "IN-JK", true],
  ["04", "Chandigarh", "IN-CH", true],
  ["07", "Delhi", "IN-DL", true],
  ["26", "Dadra and Nagar Haveli and Daman and Diu", "IN-DH", true],
  ["31", "Lakshadweep", "IN-LD", true],
  ["34", "Puducherry", "IN-PY", true],
  ["35", "Andaman and Nicobar Islands", "IN-AN", true],
  ["38", "Ladakh", "IN-LA", true],
] as const;

export async function seedStates(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const [code, stateName, isoCode, isUnionTerritory] of states) {
      await client.query(
        `
    INSERT INTO tab_state (
      name,
      state_name,
      iso_code,
      is_union_territory,
      is_active
    )
    SELECT
      $1::varchar,
      $2::varchar,
      $3::varchar,
      $4::boolean,
      TRUE
    WHERE NOT EXISTS (
      SELECT 1
      FROM tab_state
      WHERE name = $1::varchar
    )
  `,
        [code, stateName, isoCode, isUnionTerritory],
      );
    }

    await client.query("COMMIT");

    console.log(`Successfully seeded ${states.length} Indian states and UTs.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
