import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
// import { nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

export const readStatusEnum = pgEnum("readStatuss", ["read", "unread"]);

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().$defaultFn(uuidv4),
  name: text().notNull(),
  email: text().notNull(),
  phoneNumber: text("phone_number").notNull(),
  message: text("message").notNull(),
  readStatus: readStatusEnum("read_status").default("unread"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const messageInsertSchema = createInsertSchema(messages, {
  name: (schema) => schema.min(1, "name is required").trim(),
  email: (schema) => schema.min(1, "email is required").email().trim(),
  phoneNumber: (schema) => schema.min(1, "phone number is required").trim(),
  message: (schema) => schema.min(1, "message is required").trim(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const messageUpdateSchema = createInsertSchema(messages, {
  name: (schema) => schema.min(1, "name is required").trim(),
  email: (schema) => schema.min(1, "email is required").email().trim(),
  phoneNumber: (schema) => schema.min(1, "phone number is required").trim(),
  message: (schema) => schema.min(1, "message is required").trim(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NewMessageParams = z.infer<typeof messageInsertSchema>;
export type UpdatedMessageParams = z.infer<typeof messageUpdateSchema>;
