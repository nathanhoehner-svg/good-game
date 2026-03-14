import fs from "fs";
import path from "path";
import type { User, InsertUser, Gift, InsertGift, Lesson, InsertLesson, UserLesson, InsertUserLesson } from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser, passwordHash: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserPoints(id: number, balance: number, totalGiven: number, totalReceived: number): Promise<User | undefined>;
  updateUserLevel(id: number, level: number): Promise<User | undefined>;
  updateUserStreak(id: number, streakDays: number, lastAccrualDate: string): Promise<User | undefined>;
  updateUserAccrual(id: number, newBalance: number, lastAccrualDate: string): Promise<User | undefined>;

  // Gifts
  createGift(gift: InsertGift): Promise<Gift>;
  getGiftsForUser(userId: number): Promise<Gift[]>;
  getGiftsByUser(userId: number): Promise<Gift[]>;
  getRecentGifts(limit: number): Promise<Gift[]>;

  // Lessons
  getLessons(): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;

  // User Lessons
  getUserLessons(userId: number): Promise<UserLesson[]>;
  completeLesson(userLesson: InsertUserLesson): Promise<UserLesson>;
}

// ─── JSON file-backed persistent storage ─────────────────────────────
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "goodgame.json");

interface PersistedData {
  users: User[];
  gifts: Gift[];
  lessons: Lesson[];
  userLessons: UserLesson[];
  nextUserId: number;
  nextGiftId: number;
  nextLessonId: number;
  nextUserLessonId: number;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadData(): PersistedData | null {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw) as PersistedData;
    }
  } catch (e) {
    console.error("Failed to load data file, starting fresh:", e);
  }
  return null;
}

function saveData(data: PersistedData) {
  ensureDataDir();
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, DATA_FILE);
}

export class FileStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private gifts: Map<number, Gift> = new Map();
  private lessons: Map<number, Lesson> = new Map();
  private userLessons: Map<number, UserLesson> = new Map();
  private nextUserId = 1;
  private nextGiftId = 1;
  private nextLessonId = 1;
  private nextUserLessonId = 1;

  constructor() {
    const saved = loadData();
    if (saved) {
      // Restore from file
      for (const u of saved.users) {
        // Rehydrate Date objects
        u.joinedAt = u.joinedAt ? new Date(u.joinedAt) : new Date();
        this.users.set(u.id, u);
      }
      for (const g of saved.gifts) {
        g.createdAt = g.createdAt ? new Date(g.createdAt) : new Date();
        this.gifts.set(g.id, g);
      }
      for (const l of saved.lessons) {
        this.lessons.set(l.id, l);
      }
      for (const ul of saved.userLessons) {
        ul.completedAt = ul.completedAt ? new Date(ul.completedAt) : new Date();
        this.userLessons.set(ul.id, ul);
      }
      this.nextUserId = saved.nextUserId;
      this.nextGiftId = saved.nextGiftId;
      this.nextLessonId = saved.nextLessonId;
      this.nextUserLessonId = saved.nextUserLessonId;
      console.log(`Restored ${saved.users.length} users, ${saved.gifts.length} gifts from disk`);
    }

    // Always ensure lessons are seeded (idempotent)
    if (this.lessons.size === 0) {
      this.seedLessons();
      this.persist();
    }
  }

  private persist() {
    const data: PersistedData = {
      users: Array.from(this.users.values()),
      gifts: Array.from(this.gifts.values()),
      lessons: Array.from(this.lessons.values()),
      userLessons: Array.from(this.userLessons.values()),
      nextUserId: this.nextUserId,
      nextGiftId: this.nextGiftId,
      nextLessonId: this.nextLessonId,
      nextUserLessonId: this.nextUserLessonId,
    };
    saveData(data);
  }

  private seedLessons() {
    const seedData: InsertLesson[] = [
      {
        title: "The Science of Cooperation",
        description: "Why humans evolved to help each other — and how modern life disrupts that wiring.",
        content: `Humans are the most cooperative species on Earth. We build cities, share knowledge across generations, and care for strangers. This isn't an accident — it's the result of millions of years of natural selection favoring groups that worked together.\n\nResearch by evolutionary biologist Robert Trivers showed that reciprocal altruism — helping others with the expectation they'll help you later — is deeply embedded in our psychology. We have specialized brain circuits for detecting cheaters and rewarding cooperators.\n\nBut here's the key insight: cooperation isn't just strategic calculation. Neuroscience shows that helping others activates the same reward pathways as eating food or receiving money. The "helper's high" is real — it's a dopamine and oxytocin response that evolution built in to make cooperation feel good.\n\nThe problem? Modern society often puts us in situations where we interact with strangers we'll never see again, removing the feedback loops that sustain cooperation. Social media amplifies conflict over connection. Good Game exists to rebuild those feedback loops.`,
        category: "foundations",
        unlockLevel: 1,
        iconName: "Brain",
      },
      {
        title: "Cognitive Biases That Divide Us",
        description: "How tribalism, in-group bias, and the fundamental attribution error make us worse to each other.",
        content: `Your brain is running software written for small bands of hunter-gatherers. One of its most powerful features — and most dangerous bugs — is the tendency to divide the world into "us" and "them."\n\nIn-group bias means we automatically favor people we perceive as part of our group. Studies show this happens even when groups are assigned randomly — the "minimal group paradigm" proves that simply being told you're in Group A makes you prefer Group A members over Group B.\n\nThe fundamental attribution error compounds this: when someone in our group makes a mistake, we blame circumstances. When someone in the "other" group makes the same mistake, we blame their character. "He's late because traffic was bad" vs. "She's late because she's irresponsible."\n\nRecognizing these biases doesn't make them disappear, but it does create a gap between the automatic reaction and your response. That gap is where kindness lives. Every time you catch yourself making an assumption about someone from a different group — political, ethnic, economic — you have a chance to override millions of years of tribal programming.`,
        category: "cognitive-biases",
        unlockLevel: 2,
        iconName: "Eye",
      },
      {
        title: "The Kindness Contagion Effect",
        description: "Scientific evidence that witnessing good deeds makes people more likely to do good themselves.",
        content: `A meta-analysis of 88 studies covering over 25,000 participants found something remarkable: witnessing prosocial behavior is contagious. When people see someone being kind, they don't just mimic the specific action — they absorb the underlying prosocial goal and generalize it.\n\nSomeone who sees a stranger help a person who fell might later donate more to charity. The kindness doesn't get copied; it gets multiplied and transformed.\n\nEven more powerful: when people saw kind behavior being praised or rewarded, the contagion effect was stronger. This is exactly what Good Game does — it makes kindness visible and acknowledged, creating cascading waves of prosocial behavior.\n\nResearcher Haesung Jung found that the effect isn't about social pressure or trying to look good. People gave generously even when they thought their giving was anonymous. The witnessing of kindness activates something genuine — a desire to participate in making things better.\n\nEvery point you give in Good Game isn't just recognizing one person's kindness. It's creating a visible signal that can inspire dozens of others.`,
        category: "social-science",
        unlockLevel: 3,
        iconName: "Sparkles",
      },
      {
        title: "Othering: How Language Shapes Division",
        description: "The subtle ways language and framing create artificial boundaries between people.",
        content: `"Othering" is the process of treating people as fundamentally different from — and lesser than — yourself or your group. It's not always dramatic or obvious. Often it lives in language.\n\nWhen we say "those people," we've already created a boundary. When media describes one group's violence as "terrorism" and another's as "mental illness," it's othering in action. When we describe immigrants as "flooding" or "invading," we're using dehumanizing metaphors that make cruelty feel logical.\n\nNeuroscientist Robert Sapolsky's research shows that our brains process "them" faces differently than "us" faces at a neurological level — the amygdala (fear center) activates more for perceived out-group members. But here's the hopeful part: these categories are flexible. A few minutes of positive contact or individuating information can shift someone from "them" to "us."\n\nPractice: This week, notice when you use collective labels for groups of people. Replace "they always..." with curiosity about individual circumstances. The language shift is small; the cognitive shift it produces is not.`,
        category: "social-constructs",
        unlockLevel: 4,
        iconName: "MessageCircle",
      },
      {
        title: "The Helper's High",
        description: "The neuroscience of why giving feels good — and how to sustain it.",
        content: `When you help someone, your brain releases a cocktail of chemicals: dopamine (pleasure), serotonin (well-being), and oxytocin (bonding). This isn't metaphorical — it's measurable in brain scans.\n\nA landmark study at the National Institutes of Health found that when people donated to charity, the brain's mesolimbic system (the reward center) lit up the same way it does when receiving money. Giving literally feels as good as getting.\n\nBut there's a subtlety: the effect is strongest when giving is voluntary, personal, and you can see the impact. This is why Good Game's gifting system works — you're not just donating to an abstract cause. You're recognizing a specific person for a specific act of goodness, and they see your recognition.\n\nResearch also shows that the helper's high creates a positive feedback loop. People who experience it want to help more, which creates more positive emotions, which increases helping. It's a virtuous cycle — the opposite of the doom-scrolling anxiety spiral that social media typically creates.\n\nThe key to sustaining it: variety. Doing the same good deed every day eventually reduces the emotional response. Mix it up — help in different ways, for different people, in different contexts.`,
        category: "neuroscience",
        unlockLevel: 5,
        iconName: "Heart",
      },
      {
        title: "Social Norms: The Invisible Force",
        description: "How group behavior shapes individual choices — and how a small group can shift an entire community.",
        content: `Here's one of the most powerful findings in social science: people don't primarily decide what to do based on logic or morality. They look at what other people are doing.\n\nIn a classic study, hotels tried two different signs to get guests to reuse towels. "Help save the environment" worked okay. But "75% of guests in this room reuse their towels" worked dramatically better. We are conformity machines.\n\nThis works for good and bad. In communities where helping is the norm, people help more. In communities where cynicism is the norm, people disengage. The key is that norms are self-reinforcing — but they can be shifted.\n\nResearch on "positive deviance" shows that you don't need to convince everyone. You only need a committed minority of about 10-25% to establish a new norm. These early adopters create visibility, which creates social proof, which shifts the perceived norm, which changes behavior at scale.\n\nGood Game's leaderboard and gift feed aren't just motivational tools. They're norm-setting mechanisms — constantly demonstrating that kindness is common, recognized, and rewarded in this community.`,
        category: "social-dynamics",
        unlockLevel: 6,
        iconName: "Users",
      },
      {
        title: "Empathy vs. Compassion",
        description: "Why empathy alone can lead to burnout — and how compassion is more sustainable and effective.",
        content: `Empathy and compassion are often used interchangeably, but neuroscience reveals they're fundamentally different — and one is far more sustainable than the other.\n\nEmpathy means feeling what another person feels. When you fully empathize with someone in pain, you experience that pain yourself. This is why doctors, social workers, and caregivers experience burnout — they absorb the suffering of everyone they help.\n\nNeuroscientist Tania Singer's research shows that empathy activates pain circuits in your own brain. The more empathy, the more your own pain systems light up. It's exhausting and can lead to emotional withdrawal as self-protection.\n\nCompassion is different. It's caring about someone's suffering and wanting to help, without necessarily absorbing the suffering yourself. Compassion activates different brain circuits — love and affiliation rather than pain. It creates motivation rather than depletion.\n\nThe practical difference: instead of asking "how would I feel in that situation?" (empathy), ask "what does this person need, and how can I help?" (compassion). Both come from care, but compassion is action-oriented and renewable.\n\nGood Game is designed to build compassion — specific, targeted acts of recognition — rather than vague empathic suffering. That's why it feels good rather than draining.`,
        category: "psychology",
        unlockLevel: 7,
        iconName: "HeartHandshake",
      },
      {
        title: "The Long Game: Building Kind Communities",
        description: "How sustained prosocial behavior compounds over time — and how to keep it going.",
        content: `Individual acts of kindness matter. But the real power comes from sustained behavior that builds community norms over time.\n\nElinor Ostrom won the Nobel Prize in Economics for demonstrating that communities can manage shared resources sustainably — without the "tragedy of the commons" that conventional economic theory predicted. Her key finding: communities that develop their own norms, monitoring systems, and graduated sanctions outperform both pure markets and top-down regulation.\n\nGood Game is an experiment in exactly this. Can a community develop and sustain prosocial norms through recognition and reputation? The research suggests yes — if several conditions are met:\n\n1. Contributions are visible (not anonymous)\n2. Reciprocity is possible (you can give and receive)\n3. Reputation accumulates (level system, leaderboards)\n4. New members see established norms\n5. Behavior is consistent, not just occasional\n\nYour daily login streak isn't just a game mechanic. It's building the habit of noticing goodness and acknowledging it. Over time, that habit changes how you move through the world — you start seeing more opportunities for kindness because you've trained your brain to look for them.\n\nThis is the long game. Not viral moments of generosity, but the quiet, consistent practice of recognizing good.`,
        category: "community",
        unlockLevel: 8,
        iconName: "Trophy",
      },
    ];

    for (const lesson of seedData) {
      const id = this.nextLessonId++;
      this.lessons.set(id, { ...lesson, id });
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser, passwordHash: string): Promise<User> {
    const id = this.nextUserId++;
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
    const avatarColor = colors[id % colors.length];
    const newUser: User = {
      id,
      username: user.username,
      displayName: user.displayName,
      passwordHash,
      pointsBalance: 100, // starting balance
      totalGiven: 0,
      totalReceived: 0,
      level: 1,
      streakDays: 0,
      lastAccrualDate: null,
      joinedAt: new Date(),
      avatarColor,
    };
    this.users.set(id, newUser);
    this.persist();
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserPoints(
    id: number,
    balance: number,
    totalGiven: number,
    totalReceived: number
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, pointsBalance: balance, totalGiven, totalReceived };
    // Auto-level based on totalReceived
    updated.level = Math.floor(updated.totalReceived / 100) + 1;
    this.users.set(id, updated);
    this.persist();
    return updated;
  }

  async updateUserLevel(id: number, level: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, level };
    this.users.set(id, updated);
    this.persist();
    return updated;
  }

  async updateUserStreak(id: number, streakDays: number, lastAccrualDate: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, streakDays, lastAccrualDate };
    this.users.set(id, updated);
    this.persist();
    return updated;
  }

  async updateUserAccrual(id: number, newBalance: number, lastAccrualDate: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, pointsBalance: newBalance, lastAccrualDate };
    this.users.set(id, updated);
    this.persist();
    return updated;
  }

  async createGift(gift: InsertGift): Promise<Gift> {
    const id = this.nextGiftId++;
    const newGift: Gift = {
      id,
      fromUserId: gift.fromUserId,
      toUserId: gift.toUserId,
      amount: gift.amount,
      message: gift.message ?? null,
      category: gift.category ?? "kindness",
      createdAt: new Date(),
    };
    this.gifts.set(id, newGift);
    this.persist();
    return newGift;
  }

  async getGiftsForUser(userId: number): Promise<Gift[]> {
    return Array.from(this.gifts.values()).filter((g) => g.toUserId === userId);
  }

  async getGiftsByUser(userId: number): Promise<Gift[]> {
    return Array.from(this.gifts.values()).filter((g) => g.fromUserId === userId);
  }

  async getRecentGifts(limit: number): Promise<Gift[]> {
    return Array.from(this.gifts.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getLessons(): Promise<Lesson[]> {
    return Array.from(this.lessons.values());
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const id = this.nextLessonId++;
    const newLesson: Lesson = { ...lesson, id };
    this.lessons.set(id, newLesson);
    this.persist();
    return newLesson;
  }

  async getUserLessons(userId: number): Promise<UserLesson[]> {
    return Array.from(this.userLessons.values()).filter((ul) => ul.userId === userId);
  }

  async completeLesson(userLesson: InsertUserLesson): Promise<UserLesson> {
    const id = this.nextUserLessonId++;
    const newUserLesson: UserLesson = {
      id,
      userId: userLesson.userId,
      lessonId: userLesson.lessonId,
      completedAt: new Date(),
    };
    this.userLessons.set(id, newUserLesson);
    this.persist();
    return newUserLesson;
  }
}

export const storage = new FileStorage();
