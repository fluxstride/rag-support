import { z } from "zod";

// Category descriptions (used for schema, Gemini, and file selection)
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

export const IUOCategories = z.enum([
  "admission",
  "faculty",
  "courses",
  "fees",
  "hostel",
  "calendar",
  "support",
  "general",
]);

export type IUOCategory = z.infer<typeof IUOCategories>;

/**
 * Map each category to a file path or database source
 */
export const categoryToFileMap: Record<IUOCategory, string> = {
  admission: "data/admission.txt",
  faculty: "data/faculty.txt",
  courses: "data/courses.txt",
  fees: "data/fees.txt",
  hostel: "data/hostel.txt",
  calendar: "data/calendar.txt",
  support: "data/support.txt",
  general: "data/general.txt",
};
