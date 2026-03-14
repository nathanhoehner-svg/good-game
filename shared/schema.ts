import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  giftsGiven: integer("gifts_given").notNull().default(0),
  lastGiftDate: text("last_gift_date"),
  joinDate: text("join_date").notNull(),
  bio: text("bio").notNull().default(""),
});

export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  recipientId: integer("recipient_id").notNull(),
  message: text("message").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: text("options").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  xpReward: integer("xp_reward").notNull().default(10),
  category: text("category").notNull().default("general"),
});

export const quizAnswers = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  questionId: integer("question_id").notNull(),
  answeredAt: text("answered_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type Gift = typeof gifts.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizAnswer = typeof quizAnswers.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
