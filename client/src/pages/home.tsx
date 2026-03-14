import { useAuth } from "../App";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Gift, BookOpen, Trophy, User } from "lucide-react";

export default function HomePage() {
  const { user, logout } = useAuth();

  // Fetch received gifts
  const { data: receivedGifts = [] } = useQuery<any[]>({
    queryKey: ["/api/gifts/received"],
    queryFn: async () => {
      const res = await fetch("/api/gifts/received");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // XP progress to next level
  const xpInCurrentLevel = (user?.xp ?? 0) % 100;
  const xpToNextLevel = 100;
  const progressPct = (xpInCurrentLevel / xpToNextLevel) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <h1 className="text-xl font-bold text-foreground">Good Game</h1>
          </div>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome + XP Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                🎯
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <h2 className="text-xl font-bold text-foreground">{user?.username}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-primary">Level {user?.level}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{user?.xp} XP total</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress to Level {(user?.level ?? 1) + 1}</span>
                <span>{xpInCurrentLevel}/100 XP</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/gift">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6 pb-4 text-center">
                <Gift className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm">Send a Gift</p>
                <p className="text-xs text-muted-foreground mt-1">+20 XP each</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/learn">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6 pb-4 text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm">Learn & Quiz</p>
                <p className="text-xs text-muted-foreground mt-1">Earn XP</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/leaderboard">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6 pb-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm">Leaderboard</p>
                <p className="text-xs text-muted-foreground mt-1">Top players</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/profile">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6 pb-4 text-center">
                <User className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm">My Profile</p>
                <p className="text-xs text-muted-foreground mt-1">Stats & gifts</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Gifts Received */}
        {receivedGifts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Gifts Received 🎁</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {receivedGifts.slice(0, 3).map((gift: any) => (
                  <div key={gift.id} className="flex items-start gap-3">
                    <span className="text-lg">🎁</span>
                    <div>
                      <p className="text-sm font-medium">{gift.senderUsername} sent you a gift!</p>
                      {gift.message && (
                        <p className="text-xs text-muted-foreground mt-0.5">"{gift.message}"</p>
                      )}
                    </div>
                  </div>
                ))}
                {receivedGifts.length > 3 && (
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="w-full mt-2">
                      View all {receivedGifts.length} gifts
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
