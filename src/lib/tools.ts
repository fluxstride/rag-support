import { tool } from "ai";
import { z } from "zod";
import {
  IUOCategories,
  categoryDescriptions,
  IUOCategory,
  categoryToFileMap,
} from "./selectContext";
import { readFile } from "fs/promises";
import path from "path";

// Format category descriptions for Gemini
export const formattedCategoryList = Object.entries(categoryDescriptions)
  .map(([key, desc]) => `- "${key}": ${desc}`)
  .join("\n");

/**
 * Tool: Classify query into IUO category
 */
export const classifyQueryTool = tool({
  description: `Classify the user's IUO question into one of the following categories:\n${formattedCategoryList}`,
  parameters: z.object({
    query: z
      .string()
      .describe("The user's question about Igbinedion University."),
  }),
  // output: IUOCategories,
  execute: async ({ query }) => {
    return query;
  },
});

/**
 * Tool: Fetch information from the file mapped to a category
 */
export const getInformationTool = tool({
  description: `get information from your knowledge base to answer questions asked when you don't have the context to answer. Get detailed information about the user's IUO query from the correct category.`,
  parameters: z.object({
    category: IUOCategories,
    query: z.string().describe("The user's full original question"),
  }),
  // output: z.string(),
  execute: async ({ category, query }) => {
    const filePath = path.resolve(process.cwd(), categoryToFileMap[category]);
    try {
      const content = await readFile(filePath, "utf8");

      console.log(content);

      return `Content from ${category} knowledge base:\n\n${content}`;
    } catch (err) {
      return `No data available for category "${category}".`;
    }
  },
});
