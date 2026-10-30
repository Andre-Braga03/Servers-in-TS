import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "../../config.js";
import { newUser, users } from "../schema.js";
import { eq } from "drizzle-orm";

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

export async function getUserByEmail(email: string) {
  const [result] = await drizzle(config.db.url)
    .select()
    .from(users)
    .where(eq(users.email, email));
  return result;
}

export async function getUserById(userId: string) {
  const [result] = await drizzle(config.db.url)
    .select()
    .from(users)
    .where(eq(users.id, userId));
  return result;
}
export async function updateUser(userId: string, user: Partial<typeof users.$inferInsert>) {
  const [result] = await drizzle(config.db.url)
    .update(users)
    .set(user)
    .where(eq(users.id, userId))
    .returning();
  return result;
}

export async function updateUserIsChirpyRed(userId: string) {
  const [result] = await drizzle(config.db.url)
    .update(users)
    .set({ is_chirpy_red: true })
    .where(eq(users.id, userId))
    .returning();
  return result;
}