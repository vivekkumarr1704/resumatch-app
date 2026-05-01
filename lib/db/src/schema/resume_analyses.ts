import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resumeAnalysesTable = pgTable("resume_analyses", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull(),
  skills: text("skills").array().notNull().default([]),
  keywords: text("keywords").array().notNull().default([]),
  experienceJson: text("experience_json").notNull().default("[]"),
  improvementsJson: text("improvements_json").notNull().default("[]"),
  summary: text("summary").notNull().default(""),
  atsScore: integer("ats_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResumeAnalysisSchema = createInsertSchema(resumeAnalysesTable).omit({ id: true, createdAt: true });
export type InsertResumeAnalysis = z.infer<typeof insertResumeAnalysisSchema>;
export type ResumeAnalysis = typeof resumeAnalysesTable.$inferSelect;
