import "dotenv/config";
import { google } from "@ai-sdk/google";
import { generateText, tool } from "ai";
// import { z } from "zod";

export const categoryDescriptions = {
  admission: "Admission requirements and procedures at IUO",
  faculty: "Faculty and departmental information",
  courses: "Course offerings and registration processes",
  fees: "Tuition fees and available payment options",
  hostel: "Hostel accommodation and campus facilities",
  calendar: "School policies, academic calendar, and examination schedules",
  support: "Student support services and administrative processes",
  general: "General inquiries about the IUO campus or university life",
};

export const formattedCategoryList = Object.entries(categoryDescriptions)
  .map(([key, desc]) => `- "${key}": ${desc}`)
  .join("\n");

const userQuery = "I need admission";

const run = async () => {
  const res = await generateText({
    model: google("gemini-1.5-flash"),
    system: `
        You are an AI assistant for Igbinedion University. Classify the following question into one of the following categories:

        Categories:
        - admission
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
  });

  console.log(res.text);
};

run();
