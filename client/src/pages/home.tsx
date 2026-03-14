import { useAuth } from "../App";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHashLocation } from "wouter/use-hash-location";
import type { Gift, User } from "@shared/schema";

function LevelBadge({ level }: { level: number }) {
  const titles = [
    "", "Seedling", "Sprout", "Bloom", "Tree", "Grove",
    "Forest", "Guardian", "Beacon", "Luminary", "Legend"
  ];
  const title = titles[Math.min(level, titles.length - 1)] || `Level ${level}`;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
      Lv.{level} {title}
    </span>
  );
}

export default function HomePage() {
  const { currentUser, isDark, toggleTheme } = useAuth();
  const [, setLocation] = useHashLocation();

  const { data: recentGifts } = useQuery<Gift[]>({
    queryKey: ["/api/gifts/recent"],
  });

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const usersMap = new Map((allUsers ?? []).map(u => [u.id, u]));

  if (!currentUser) return null;

  const progressToNextLevel = ((currentUser.totalReceived % 100) / 100) * 100;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold">Good Game</h1>
          <p className="text-sm text-muted-foreground">Welcome, {currentUser.displayName}</p>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
          data-testid="theme-toggle-home"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Points Card */}
      <Card className="mb-4 overflow-hidden" data-testid="card-points">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Available to Give</p>
              <p className="text-3xl font-bold tracking-tight text-primary">{currentUser.pointsBalance}</p>
            </div>
            <div className="text-right">
              <LevelBadge level={currentUser.level} />
              <p className="text-xs text-muted-foreground mt-1">
                {currentUser.streakDays > 0 && `${currentUser.streakDays} day streak 🔥`}
              </p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Level {currentUser.level}</span>
              <span>Level {currentUser.level + 1}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {100 - (currentUser.totalReceived % 100)} more received points to next level
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{currentUser.totalReceived}</p>
              <p className="text-xs text-muted-foreground">Received</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{currentUser.totalGiven}</p>
              <p className="text-xs text-muted-foreground">Given</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          onClick={() => setLocation("/gift")}
          className="h-14 text-sm font-semibold"
          data-testid="button-give-points"
        >
          🎁 Give Points
        </Button>
        <Button
          variant="secondary"
          onClick={() => setLocation("/leaderboard")}
          className="h-14 text-sm font-semibold"
          data-testid="button-leaderboard"
        >
          🏆 Leaderboard
        </Button>
      </div>

      {/* Activity Feed */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Recent Kindness
        </h2>
        {(!recentGifts || recentGifts.length === 0) ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-2xl mb-2">🌱</p>
              <p className="text-sm text-muted-foreground">
                No gifts yet. Be the first to recognize someone's goodness.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentGifts.slice(0, 10).map((gift) => {
              const sender = usersMap.get(gift.fromUserId);
              const receiver = usersMap.get(gift.toUserId);
              return (
                <Card key={gift.id} className="hover-elevate cursor-pointer" data-testid={`gift-${gift.id}`}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: sender?.avatarColor || "#4f98a3" }}
                      >
                        {sender?.displayName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{sender?.displayName || "Unknown"}</span>
                          <span className="text-muted-foreground"> gave </span>
                          <span className="font-semibold text-primary">{gift.amount} pts</span>
                          <span className="text-muted-foreground"> to </span>
                          <span className="font-semibold">{receiver?.displayName || "Unknown"}</span>
                        </p>
                        {gift.message && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">"{gift.message}"</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {gift.category === "kindness" ? "💚" : gift.category === "volunteering" ? "🤝" : gift.category === "community" ? "🏨️" : "✨"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily reminder */}
      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <p className="text-sm font-medium text-center">
            💡 You receive 100 points every day. Give them to people who do good.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
