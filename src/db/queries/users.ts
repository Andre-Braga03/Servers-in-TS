import { db } from "../index.js";
import { newUser, users } from "../schema.js";

export async function createUser(user: newUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}
