import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy } from "lucide-react";
import { useAuth } from "../App";

export default function LeaderboardPage() {
  const { user } = useAuth();

  const { data: leaderboard = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const userRank = leaderboard.findIndex((u: any) => u.id === user?.id) + 1;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Leaderboard</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {user && userRank > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Your rank</p>
              <p className="text-2xl font-bold text-primary">#{userRank}</p>
              <p className="text-sm text-foreground">{user.xp} XP · Level {user.level}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">No players yet. Be the first!</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry: any, index: number) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const isMe = entry.id === user?.id;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        isMe ? "bg-primary/10" : ""
                      }`}
                    >
                      <span className="w-8 text-center font-bold text-sm">
                        {index < 3 ? medals[index] : `#${index + 1}`}
                      </span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isMe ? "text-primary" : "text-foreground"}`}>
                          {entry.username} {isMe ? "(you)" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Level {entry.level} · {entry.giftsGiven} gifts given
                        </p>
                      </div>
                      <span className="text-sm font-bold text-foreground">{entry.xp} XP</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
