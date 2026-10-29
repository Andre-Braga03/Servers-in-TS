import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "../../config.js";
import { refresh_Tokens } from "../schema.js";
import { eq } from "drizzle-orm";


export async function createRefreshToken(refreshToken: typeof refresh_Tokens.$inferInsert) {
    const [result] = await drizzle(config.db.url)
      .insert(refresh_Tokens)
      .values(refreshToken)
      .returning();
    return result;
  }

export async function getUserByRefreshToken(refreshToken: string) {
    const [result] = await drizzle(config.db.url)
      .select()
      .from(refresh_Tokens)
      .where(eq(refresh_Tokens.token, refreshToken));

      if(!result || result.user_id === undefined){
        return undefined
      }
      const [saved] = await drizzle(config.db.url)
      .select()
      .from(refresh_Tokens)
      .where(eq(refresh_Tokens.token, refreshToken));

      if (!saved || saved.revokedAt || saved.expiresAt < new Date()) {
        return undefined;
      }
      return result.user_id;
  }

  export async function revokeRefreshToken(token: string, revokedAt: Date) {
    await drizzle(config.db.url)
      .update(refresh_Tokens)
      .set({ revokedAt, updatedAt: revokedAt })
      .where(eq(refresh_Tokens.token, token));
  }
  export async function resetRefreshTokens() {
    await drizzle(config.db.url)
      .delete(refresh_Tokens)
      .execute();
  }