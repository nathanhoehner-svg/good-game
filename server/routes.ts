import type { Express } from "express";
import type { Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const { username, password } = parsed.data;
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ error: "Username already taken" });
      }
      const user = await storage.createUser(username, password);
      req.session.userId = user.id;
      return res.json({ id: user.id, username: user.username, xp: user.xp, level: user.level, giftsGiven: user.giftsGiven, lastGiftDate: user.lastGiftDate, joinDate: user.joinDate, bio: user.bio });
    } catch (e) {
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      const user = await storage.verifyUser(username, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      req.session.userId = user.id;
      return res.json({ id: user.id, username: user.username, xp: user.xp, level: user.level, giftsGiven: user.giftsGiven, lastGiftDate: user.lastGiftDate, joinDate: user.joinDate, bio: user.bio });
    } catch (e) {
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ id: user.id, username: user.username, xp: user.xp, level: user.level, giftsGiven: user.giftsGiven, lastGiftDate: user.lastGiftDate, joinDate: user.joinDate, bio: user.bio });
  });

  // User routes
  app.get("/api/users/:username", async (req: Request, res: Response) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ id: user.id, username: user.username, xp: user.xp, level: user.level, giftsGiven: user.giftsGiven, lastGiftDate: user.lastGiftDate, joinDate: user.joinDate, bio: user.bio });
  });

  app.patch("/api/users/me/bio", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { bio } = req.body;
    if (typeof bio !== "string" || bio.length > 200) {
      return res.status(400).json({ error: "Bio must be a string up to 200 characters" });
    }
    const user = await storage.updateBio(req.session.userId, bio);
    return res.json({ bio: user.bio });
  });

  // Gift routes
  app.post("/api/gifts", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const { recipientUsername, message } = req.body;
      if (!recipientUsername) {
        return res.status(400).json({ error: "Recipient username required" });
      }
      const result = await storage.sendGift(req.session.userId, recipientUsername, message || "");
      return res.json(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Server error";
      return res.status(400).json({ error: msg });
    }
  });

  app.get("/api/gifts/received", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const gifts = await storage.getReceivedGifts(req.session.userId);
    return res.json(gifts);
  });

  app.get("/api/gifts/sent", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const gifts = await storage.getSentGifts(req.session.userId);
    return res.json(gifts);
  });

  // Leaderboard
  app.get("/api/leaderboard", async (req: Request, res: Response) => {
    const users = await storage.getLeaderboard();
    return res.json(users);
  });

  // Quiz
  app.get("/api/quiz/questions", async (_req: Request, res: Response) => {
    const questions = await storage.getQuizQuestions();
    return res.json(questions);
  });

  app.post("/api/quiz/submit", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const { questionId, answer } = req.body;
      const result = await storage.submitQuizAnswer(req.session.userId, questionId, answer);
      return res.json(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Server error";
      return res.status(400).json({ error: msg });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
