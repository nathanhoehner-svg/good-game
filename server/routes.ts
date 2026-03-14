import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertGiftSchema } from "@shared/schema";
import type { User } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

// Strip passwordHash from user objects before sending to client
function sanitizeUser(user: User): Omit<User, "passwordHash"> {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function registerRoutes(server: Server, app: Express) {
  // ─── Signup ─────────────────────────────────────────────────────
  const signupSchema = z.object({
    username: z.string().min(2).max(30),
    displayName: z.string().min(1).max(50),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);
      const existing = await storage.getUserByUsername(data.username.toLowerCase());
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }
      const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
      const user = await storage.createUser(
        { username: data.username.toLowerCase(), displayName: data.displayName },
        passwordHash
      );
      res.status(201).json(sanitizeUser(user));
    } catch (e: any) {
      if (e.errors) {
        // Zod validation error — return first message
        res.status(400).json({ error: e.errors[0]?.message || e.message });
      } else {
        res.status(400).json({ error: e.message });
      }
    }
  });

  // ─── Login ──────────────────────────────────────────────────────
  const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
  });

  app.post("/api/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(data.username.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const valid = await bcrypt.compare(data.password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      // Trigger daily accrual on login
      const today = new Date().toISOString().split("T")[0];
      if (user.lastAccrualDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const isConsecutive = user.lastAccrualDate === yesterday;
        const newStreak = isConsecutive ? user.streakDays + 1 : 1;
        const newBalance = user.pointsBalance + 100;
        await storage.updateUserAccrual(user.id, newBalance, today);
        await storage.updateUserStreak(user.id, newStreak, today);
      }
      const updated = await storage.getUser(user.id);
      res.json(sanitizeUser(updated!));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── Get Users (sanitized) ────────────────────────────────────────
  app.get("/api/users", async (_req, res) => {
    const users = await storage.getAllUsers();
    res.json(users.map(sanitizeUser));
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(sanitizeUser(user));
  });

  app.get("/api/users/username/:username", async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(sanitizeUser(user));
  });

  // ─── Daily Point Accrual ─────────────────────────────────────────
  app.post("/api/users/:id/accrue", async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return res.status(404).json({ error: "User not found" });

    const today = new Date().toISOString().split("T")[0];
    if (user.lastAccrualDate === today) {
      return res.json({ message: "Already accrued today", user: sanitizeUser(user) });
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const isConsecutive = user.lastAccrualDate === yesterday;
    const newStreak = isConsecutive ? user.streakDays + 1 : 1;

    const newBalance = user.pointsBalance + 100;
    await storage.updateUserAccrual(user.id, newBalance, today);
    await storage.updateUserStreak(user.id, newStreak, today);

    const updated = await storage.getUser(user.id);
    res.json({ message: "Points accrued", user: sanitizeUser(updated!) });
  });

  // ─── Gift Points ──────────────────────────────────────────────────
  const giftSchema = z.object({
    fromUserId: z.number(),
    toUserId: z.number(),
    amount: z.number().min(1).max(100),
    message: z.string().optional(),
    category: z.string().default("kindness"),
  });

  app.post("/api/gifts", async (req, res) => {
    try {
      const data = giftSchema.parse(req.body);

      if (data.fromUserId === data.toUserId) {
        return res.status(400).json({ error: "Cannot gift points to yourself" });
      }

      const sender = await storage.getUser(data.fromUserId);
      if (!sender) return res.status(404).json({ error: "Sender not found" });

      const receiver = await storage.getUser(data.toUserId);
      if (!receiver) return res.status(404).json({ error: "Receiver not found" });

      if (sender.pointsBalance < data.amount) {
        return res.status(400).json({ error: "Insufficient points" });
      }

      // Transfer points
      await storage.updateUserPoints(
        sender.id,
        sender.pointsBalance - data.amount,
        sender.totalGiven + data.amount,
        sender.totalReceived
      );

      await storage.updateUserPoints(
        receiver.id,
        receiver.pointsBalance + data.amount,
        receiver.totalGiven,
        receiver.totalReceived + data.amount
      );

      const gift = await storage.createGift(data);
      res.status(201).json(gift);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/gifts/received/:userId", async (req, res) => {
    const gifts = await storage.getGiftsForUser(Number(req.params.userId));
    res.json(gifts);
  });

  app.get("/api/gifts/sent/:userId", async (req, res) => {
    const gifts = await storage.getGiftsByUser(Number(req.params.userId));
    res.json(gifts);
  });

  app.get("/api/gifts/recent", async (_req, res) => {
    const gifts = await storage.getRecentGifts(50);
    res.json(gifts);
  });

  // ─── Leaderboard ─────────────────────────────────────────────────
  app.get("/api/leaderboard", async (_req, res) => {
    const users = await storage.getAllUsers();
    const sorted = users
      .map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarColor: u.avatarColor,
        totalReceived: u.totalReceived,
        totalGiven: u.totalGiven,
        level: u.level,
        streakDays: u.streakDays,
      }))
      .sort((a, b) => b.totalReceived - a.totalReceived);
    res.json(sorted);
  });

  // ─── Lessons ──────────────────────────────────────────────────────
  app.get("/api/lessons", async (_req, res) => {
    const lessons = await storage.getLessons();
    res.json(lessons);
  });

  app.get("/api/lessons/:id", async (req, res) => {
    const lesson = await storage.getLesson(Number(req.params.id));
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    res.json(lesson);
  });

  app.get("/api/users/:userId/lessons", async (req, res) => {
    const userLessons = await storage.getUserLessons(Number(req.params.userId));
    res.json(userLessons);
  });

  app.post("/api/users/:userId/lessons/:lessonId/complete", async (req, res) => {
    const userId = Number(req.params.userId);
    const lessonId = Number(req.params.lessonId);

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const lesson = await storage.getLesson(lessonId);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    if (user.level < lesson.unlockLevel) {
      return res.status(400).json({ error: "Lesson not unlocked yet" });
    }

    const userLesson = await storage.completeLesson({ userId, lessonId });
    res.status(201).json(userLesson);
  });
}
