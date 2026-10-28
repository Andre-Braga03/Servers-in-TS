import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "../../config.js";
import { newUser, users } from "../schema.js";

export async function createUser(user: newUser) {
  const [result] = await drizzle(config.db.url)
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function resetUsers(){
  const [result] = await drizzle(config.db.url)
    .delete(users)
    .execute();
  return result;
}