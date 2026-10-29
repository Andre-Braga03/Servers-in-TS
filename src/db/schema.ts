import { pgTable, timestamp, varchar, uuid} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("update_at")
    .notNull()
    .defaultNow().$onUpdate(() => new Date()),
    email: varchar("email", { length: 256 }).unique().notNull(),
    hashed_password: varchar("hashed_password", { length: 256 }).notNull(),
    revoked_at : timestamp("revoked_at"),
   
});

export const chirps = pgTable("chirps", {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("update_at")
    .notNull()
    .defaultNow().$onUpdate(() => new Date()),
    body: varchar("body", { length: 140 }).notNull(),
    userId: uuid("user_id").references(() => users.id).notNull(),
});
export type newUser = typeof users.$inferInsert;
export type newChirp = typeof chirps.$inferInsert;

export const refresh_Tokens = pgTable("refresh_tokens", {
    token: varchar("token", { length: 256 }).primaryKey(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("update_at").notNull().defaultNow().$onUpdate(() => new Date()),
    user_id : uuid("user_id").references(() => users.id).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
});