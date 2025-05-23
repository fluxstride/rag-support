import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
// import { nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["admin", "super-admin"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().$defaultFn(uuidv4),
  name: text().notNull(),
  email: text().unique().notNull(),
  role: roleEnum().notNull(),
  password: text().notNull(),
  login_attempts: integer().default(0),
  last_failed_login: timestamp("last_failed_login"),
  is_blocked: boolean().default(false),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const userInsertSchema = createInsertSchema(users, {
  name: (schema) => schema.min(1, "name is required").trim(),
  email: (schema) => schema.min(1, "email is required").email().trim(),
  password: (schema) => schema.min(1, "password is required").trim(),
}).omit({
  id: true,
  login_attempts: true,
  createdAt: true,
  updatedAt: true,
});

export const userUpdateSchema = createUpdateSchema(users, {
  name: (schema) => schema.min(1, "name is required").trim(),
  email: (schema) => schema.min(1, "email is required").email().trim(),
  password: (schema) => schema.min(1, "password is required").trim(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NewUserParams = z.infer<typeof userInsertSchema>;
export type UserUpdateParams = z.infer<typeof userUpdateSchema>;
