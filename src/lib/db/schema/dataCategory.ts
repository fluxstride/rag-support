import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgTable } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// import { nanoid } from "../../../lib/utils";
import { v4 as uuidv4 } from "uuid";

export const dataCategory = pgTable("dataCategory", {
  id: varchar("id", { length: 191 }).primaryKey().$defaultFn(uuidv4),
  name: text("name").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

// Schema for file - used to validate API requests
export const insertDataCategorySchema = createSelectSchema(dataCategory)
  .extend({})
  .omit({
    name: true,
    createdAt: true,
    updatedAt: true,
  });

// Type for file - used to type API request params and within Components
export type NewDataCategoryParams = z.infer<typeof insertDataCategorySchema>;
