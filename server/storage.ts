import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, desc } from "drizzle-orm";
import {
  users,
  gifts,
  quizQuestions,
  quizAnswers,
  type User,
  type Gift,
  type QuizQuestion,
} from "@shared/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace("file:", "")
  : path.join(dataDir, "app.db");

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Run migrations inline
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    gifts_given INTEGER NOT NULL DEFAULT 0,
    last_gift_date TEXT,
    join_date TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 10,
    category TEXT NOT NULL DEFAULT 'general'
  );
  CREATE TABLE IF NOT EXISTS quiz_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answered_at TEXT NOT NULL
  );
`);

// Seed quiz questions if empty
const questionCount = sqlite
  .prepare("SELECT COUNT(*) as count FROM quiz_questions")
  .get() as { count: number };
if (questionCount.count === 0) {
  const seedQuestions = [
    {
      question: "What does XP stand for in gaming?",
      options: JSON.stringify(["Experience Points", "Extra Power", "Expert Player", "Extended Play"]),
      correct_answer: "Experience Points",
      xp_reward: 10,
      category: "gaming",
    },
    {
      question: "Which console introduced the concept of achievements/trophies?",
      options: JSON.stringify(["Xbox 360", "PlayStation 2", "Nintendo Wii", "Sega Dreamcast"]),
      correct_answer: "Xbox 360",
      xp_reward: 15,
      category: "gaming",
    },
    {
      question: "In chess, which piece can only move diagonally?",
      options: JSON.stringify(["Bishop", "Rook", "Knight", "Queen"]),
      correct_answer: "Bishop",
      xp_reward: 10,
      category: "board games",
    },
    {
      question: "What is the maximum score in a perfect game of bowling?",
      options: JSON.stringify(["200", "250", "300", "350"]),
      correct_answer: "300",
      xp_reward: 10,
      category: "sports",
    },
    {
      question: "In poker, what hand beats a full house?",
      options: JSON.stringify(["Four of a kind", "Flush", "Straight", "Two pair"]),
      correct_answer: "Four of a kind",
      xp_reward: 15,
      category: "card games",
    },
    {
      question: "Which video game franchise features a character named Master Chief?",
      options: JSON.stringify(["Halo", "Call of Duty", "Destiny", "Gears of War"]),
      correct_answer: "Halo",
      xp_reward: 10,
      category: "gaming",
    },
    {
      question: "How many players are on a standard basketball team on the court?",
      options: JSON.stringify(["4", "5", "6", "7"]),
      correct_answer: "5",
      xp_reward: 10,
      category: "sports",
    },
    {
      question: "What color are the properties on the most expensive side of a standard Monopoly board?",
      options: JSON.stringify(["Blue", "Green", "Red", "Yellow"]),
      correct_answer: "Blue",
      xp_reward: 15,
      category: "board games",
    },
    {
      question: "In Minecraft, what is the rarest ore?",
      options: JSON.stringify(["Diamond", "Emerald", "Ancient Debris", "Gold"]),
      correct_answer: "Ancient Debris",
      xp_reward: 20,
      category: "gaming",
    },
    {
      question: "What does 'GG' stand for in gaming?",
      options: JSON.stringify(["Good Game", "Great Going", "Game Goal", "Got Gold"]),
      correct_answer: "Good Game",
      xp_reward: 5,
      category: "gaming",
    },
    {
      question: "In the card game War, who wins when both players draw the same card?",
      options: JSON.stringify(["Neither player", "The player with the most cards", "There is a war", "The game ends"]),
      correct_answer: "There is a war",
      xp_reward: 10,
      category: "card games",
    },
    {
      question: "How many dots are on a standard die?",
      options: JSON.stringify(["18", "21", "24", "28"]),
      correct_answer: "21",
      xp_reward: 15,
      category: "board games",
    },
    {
      question: "Which game uses the terms 'strike' and 'spare'?",
      options: JSON.stringify(["Bowling", "Baseball", "Cricket", "Golf"]),
      correct_answer: "Bowling",
      xp_reward: 10,
      category: "sports",
    },
    {
      question: "What is the name of the princess in the original Donkey Kong arcade game?",
      options: JSON.stringify(["Princess Peach", "Pauline", "Zelda", "Daisy"]),
      correct_answer: "Pauline",
      xp_reward: 20,
      category: "gaming",
    },
    {
      question: "In Scrabble, how many points is the letter Q worth?",
      options: JSON.stringify(["8", "10", "12", "15"]),
      correct_answer: "10",
      xp_reward: 15,
      category: "board games",
    },
    {
      question: "What sport uses a shuttlecock?",
      options: JSON.stringify(["Badminton", "Tennis", "Squash", "Racquetball"]),
      correct_answer: "Badminton",
      xp_reward: 5,
      category: "sports",
    },
    {
      question: "In video games, what does 'NPC' stand for?",
      options: JSON.stringify(["Non-Playable Character", "New Player Controller", "Neutral Power Core", "Next Player Command"]),
      correct_answer: "Non-Playable Character",
      xp_reward: 10,
      category: "gaming",
    },
    {
      question: "Which card game involves collecting sets of 4 cards of the same rank?",
      options: JSON.stringify(["Go Fish", "Rummy", "Snap", "Crazy Eights"]),
      correct_answer: "Go Fish",
      xp_reward: 10,
      category: "card games",
    },
    {
      question: "In the game of Risk, how many continents are there on the board?",
      options: JSON.stringify(["5", "6", "7", "8"]),
      correct_answer: "6",
      xp_reward: 15,
      category: "board games",
    },
    {
      question: "What is the objective in the video game Pac-Man?",
      options: JSON.stringify(["Eat all dots while avoiding ghosts", "Defeat the final ghost boss", "Collect all fruit items", "Reach the highest level"]),
      correct_answer: "Eat all dots while avoiding ghosts",
      xp_reward: 10,
      category: "gaming",
    },
  ];
  const insertQuestion = sqlite.prepare(
    "INSERT INTO quiz_questions (question, options, correct_answer, xp_reward, category) VALUES (?, ?, ?, ?, ?)"
  );
  for (const q of seedQuestions) {
    insertQuestion.run(q.question, q.options, q.correct_answer, q.xp_reward, q.category);
  }
}

function xpToLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export const storage = {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  },

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  },

  async createUser(username: string, password: string): Promise<User> {
    const joinDate = new Date().toISOString();
    const result = await db
      .insert(users)
      .values({ username, password, joinDate })
      .returning();
    return result[0];
  },

  async verifyUser(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    if (user.password !== password) return undefined;
    return user;
  },

  async updateBio(userId: number, bio: string): Promise<User> {
    const result = await db
      .update(users)
      .set({ bio })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  },

  async sendGift(
    senderId: number,
    recipientUsername: string,
    message: string
  ): Promise<{ gift: Gift; senderXp: number; senderLevel: number }> {
    const recipient = await this.getUserByUsername(recipientUsername);
    if (!recipient) throw new Error("Recipient not found");
    if (recipient.id === senderId) throw new Error("Cannot send a gift to yourself");

    const sender = await this.getUser(senderId);
    if (!sender) throw new Error("Sender not found");

    // Check daily limit: 3 gifts per day
    const today = new Date().toISOString().split("T")[0];
    const lastGiftDay = sender.lastGiftDate ? sender.lastGiftDate.split("T")[0] : null;
    
    // Count today's sent gifts
    const todayGifts = await db
      .select()
      .from(gifts)
      .where(eq(gifts.senderId, senderId));
    const todayCount = todayGifts.filter(
      (g) => g.createdAt.split("T")[0] === today
    ).length;
    if (todayCount >= 3) throw new Error("You can only send 3 gifts per day");

    const createdAt = new Date().toISOString();
    const giftResult = await db
      .insert(gifts)
      .values({ senderId, recipientId: recipient.id, message, createdAt })
      .returning();

    // Award XP to sender (20 XP per gift)
    const newXp = sender.xp + 20;
    const newLevel = xpToLevel(newXp);
    const updatedSender = await db
      .update(users)
      .set({
        xp: newXp,
        level: newLevel,
        giftsGiven: sender.giftsGiven + 1,
        lastGiftDate: createdAt,
      })
      .where(eq(users.id, senderId))
      .returning();

    return {
      gift: giftResult[0],
      senderXp: updatedSender[0].xp,
      senderLevel: updatedSender[0].level,
    };
  },

  async getReceivedGifts(userId: number): Promise<(Gift & { senderUsername: string })[]> {
    const result = await db
      .select({
        id: gifts.id,
        senderId: gifts.senderId,
        recipientId: gifts.recipientId,
        message: gifts.message,
        createdAt: gifts.createdAt,
        senderUsername: users.username,
      })
      .from(gifts)
      .innerJoin(users, eq(gifts.senderId, users.id))
      .where(eq(gifts.recipientId, userId))
      .orderBy(desc(gifts.createdAt));
    return result;
  },

  async getSentGifts(userId: number): Promise<(Gift & { recipientUsername: string })[]> {
    const result = await db
      .select({
        id: gifts.id,
        senderId: gifts.senderId,
        recipientId: gifts.recipientId,
        message: gifts.message,
        createdAt: gifts.createdAt,
        recipientUsername: users.username,
      })
      .from(gifts)
      .innerJoin(users, eq(gifts.recipientId, users.id))
      .where(eq(gifts.senderId, userId))
      .orderBy(desc(gifts.createdAt));
    return result;
  },

  async getLeaderboard(): Promise<Pick<User, "id" | "username" | "xp" | "level" | "giftsGiven">[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        xp: users.xp,
        level: users.level,
        giftsGiven: users.giftsGiven,
      })
      .from(users)
      .orderBy(desc(users.xp))
      .limit(50);
    return result;
  },

  async getQuizQuestions(): Promise<QuizQuestion[]> {
    return await db.select().from(quizQuestions);
  },

  async submitQuizAnswer(
    userId: number,
    questionId: number,
    answer: string
  ): Promise<{ correct: boolean; xpEarned: number; newXp: number; newLevel: number }> {
    // Check if already answered
    const existing = await db
      .select()
      .from(quizAnswers)
      .where(eq(quizAnswers.userId, userId));
    const alreadyAnswered = existing.some((a) => a.questionId === questionId);
    if (alreadyAnswered) throw new Error("Already answered this question");

    // Get the question
    const questionResult = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.id, questionId))
      .limit(1);
    if (!questionResult[0]) throw new Error("Question not found");
    const question = questionResult[0];

    const correct = question.correctAnswer === answer;
    let xpEarned = 0;

    if (correct) {
      xpEarned = question.xpReward;
      const user = await this.getUser(userId);
      if (!user) throw new Error("User not found");
      const newXp = user.xp + xpEarned;
      const newLevel = xpToLevel(newXp);
      await db
        .update(users)
        .set({ xp: newXp, level: newLevel })
        .where(eq(users.id, userId));

      // Record the answer
      await db.insert(quizAnswers).values({
        userId,
        questionId,
        answeredAt: new Date().toISOString(),
      });

      const updatedUser = await this.getUser(userId);
      return { correct, xpEarned, newXp: updatedUser!.xp, newLevel: updatedUser!.level };
    } else {
      // Still record the answer so they can't retry
      await db.insert(quizAnswers).values({
        userId,
        questionId,
        answeredAt: new Date().toISOString(),
      });
      const user = await this.getUser(userId);
      return { correct, xpEarned: 0, newXp: user!.xp, newLevel: user!.level };
    }
  },
};
