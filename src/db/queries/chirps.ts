import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "../../config.js";
import { chirps, newChirp } from "../schema.js";
import { asc, eq, desc } from "drizzle-orm";

export async function createChirp(chirp: newChirp) {
  const [result] = await drizzle(config.db.url)
    .insert(chirps)
    .values(chirp)
    .returning();
  return result;
}

export async function getAllChirps() {
  const result = await drizzle(config.db.url)
    .select()
    .from(chirps)
    .orderBy(asc(chirps.createdAt));
  return result;
}

export async function resetChirps() {
 const [result] = await drizzle(config.db.url)
    .delete(chirps)
    .execute();
  return result;
}

export async function getChirpById(id: string) {
  const [result] = await drizzle(config.db.url)
    .select()
    .from(chirps)
    .where(eq(chirps.id, id));
  return result;
}

export async function getAllChirpsByUserId(userId: string) {
  const result = await drizzle(config.db.url)
    .select()
    .from(chirps)
    .where(eq(chirps.userId, userId))
    .orderBy(asc(chirps.createdAt));
  return result;
}

export async function getAllChirpsSortedByCreatedAtAsc() {
  const result = await drizzle(config.db.url)
    .select()
    .from(chirps)
    .orderBy(asc(chirps.createdAt));
  return result;
}

export async function getAllChirpsSortedByCreatedAtDesc() {
  const result = await drizzle(config.db.url)
    .select()
    .from(chirps)
    .orderBy(desc(chirps.createdAt));
  return result;
}

export async function deleteChirpById(id: string) {
  const [result] = await drizzle(config.db.url)
    .delete(chirps)
    .where(eq(chirps.id, id))
    .returning();
  return result;
}