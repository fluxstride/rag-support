import { systemPrompt1 } from "./../../prompts/index";
import { Request, response, Response, Router } from "express";
import asyncWrap from "../../utils/asyncWrapper";
import "dotenv/config";
// import { createResource } from "../../lib/actions/resources";
import { generateText, streamText, tool } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";
// import { findRelevantContent } from "../../lib/ai/embedding";
import { formattedCategoryList, getInformationTool } from "../../lib/tools";

export class ChatController {
  router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post("/chat", this.chat);
  }

  private chat = asyncWrap(async (req: Request, res: Response) => {
    try {
      const messages = req.body.messages;

      const result = streamText({
        model: google("gemini-1.5-flash"),
        system: systemPrompt1,
        messages,
        tools: {
          getInformation: tool({
            description: `get information from your knowledge base to answer questions asked when you don't have the context to answer. Get detailed information about the user's IUO query from the correct category.`,
            parameters: z.object({
              query: z.string().describe("The user's full original question"),
            }),

            execute: async ({ query }) => {
              const queryCategory = await classifyQuery(query);
              const context = await loadContextForCategory(
                queryCategory.replace("\n", "") as IUOCategory,
              );

              console.log({ queryCategory, context });
              // console.log({ queryCategory });

              return context;
              // return queryCategory;
            },
          }),
        },
        maxSteps: 10,
      });

      result.pipeDataStreamToResponse(res);
    } catch (err) {
      console.error("AI error:", err);
      res.status(500).send("Internal Server Error");
    }
  });
}

async function classifyQuery(userQuery: string) {
  const response = await generateText({
    model: google("gemini-1.5-flash"),
    system: `
            You are an AI assistant for Igbinedion University. Classify the following question into one of the following categories:
    
            Categories:
            - admission
            - developer/creator/designer
            - faculty
            - courses
            - fees
            - hostel
            - calendar
            - support
            - general
    
            Respond with just the category keyword (e.g., "admission", "courses").
    `,
    prompt: userQuery,
    tools: {},
  });

  return response.text;
}

export enum IUOCategory {
  Admission = "admission",
  Developer = "developer/creator/designer",
  Faculty = "faculty",
  Courses = "courses",
  Fees = "fees",
  Hostel = "hostel",
  Calendar = "calendar",
  Support = "support",
  General = "general",
}

const categoryFileMap: Record<IUOCategory, string> = {
  admission: "data/admission.txt",
  "developer/creator/designer": "data/developer.md",
  faculty: "data/faculty.md",
  courses: "data/courses.txt",
  fees: "data/fees.txt",
  hostel: "data/hostel.txt",
  calendar: "data/calendar.md",
  support: "data/support.txt",
  general: "data/general.txt",
};

import fs from "fs/promises";
async function loadContextForCategory(category: IUOCategory): Promise<string> {
  const filePath = categoryFileMap[category];
  console.log({ category, filePath });

  return await fs.readFile(filePath, "utf-8");
}
