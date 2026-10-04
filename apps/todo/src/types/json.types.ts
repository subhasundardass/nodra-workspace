/** JSON returned by persistence. */
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue | undefined };

/** JSON inputs also accept serializable objects and readonly collections. */
export type InputJsonValue =
  | string
  | number
  | boolean
  | { readonly [key: string]: InputJsonValue | null | undefined }
  | readonly (InputJsonValue | null)[]
  | { toJSON(): unknown };
