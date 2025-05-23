import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
// import { nanoid } from "nanoid";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const passwordResetTokens = pgTable("passwordResetTokens", {
  id: varchar("id").primaryKey().$defaultFn(uuidv4),
  userId: text().notNull(),
  token: text().notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const userInsertSchema = createInsertSchema(passwordResetTokens, {
  userId: (schema) => schema.min(1, "userId is required").email().trim(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NewUserParams = z.infer<typeof userInsertSchema>;
