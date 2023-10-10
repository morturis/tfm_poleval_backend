import * as z from "zod";

export enum Permissions {
  ADD_NEW_EVAL = "ADD_NEW_EVAL",
  EDIT_EVAL = "EDIT_EVAL",
  FILL_FORM = "FILL_FORM",
  LOGOUT = "LOGOUT",
}

export const UserSchema = z.strictObject({
  username: z.string(),
  password: z.string(),
  evaluations: z.array(
    z.strictObject({
      eval_name: z.string(),
      permissions: z.array(z.nativeEnum(Permissions)),
    })
  ),
});

export const LoginObjectSchema = z.strictObject({
  username: z.string(),
  password: z.string(),
});

export type LoginObject = z.infer<typeof LoginObjectSchema>;
export type User = z.infer<typeof UserSchema>;
