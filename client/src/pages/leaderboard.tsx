import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "../App";

interface LeaderboardEntry {
  id: number;
  username: string;
  displayName: string;
  avatarColor: string;
  totalReceived: number;
  totalGiven: number;
  level: number;
  streakDays: number;
}

export default function LeaderboardPage() {
  const { currentUser } = useAuth();

  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <div className="mb-6">
        <h1 className="text-lg font-bold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          The people making the biggest impact. Ranked by points received from others.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="h-12 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !leaderboard || leaderboard.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-3xl mb-3">🌍</p>
            <p className="text-sm text-muted-foreground">
              No one on the board yet. Start gifting points to see who rises.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.id === currentUser?.id;
            const medals = ["🥇", "🥈", "🥉"];
            const medal = medals[index] || null;

            return (
              <Card
                key={entry.id}
                className={`transition-all ${isCurrentUser ? "border-primary/40 bg-primary/5" : ""}`}
                data-testid={`leaderboard-entry-${entry.id}`}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-8 text-center flex-shrink-0">
                      {medal ? (
                        <span className="text-xl">{medal}</span>
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: entry.avatarColor }}
                    >
                      {entry.displayName[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">
                          {entry.displayName}
                          {isCurrentUser && (
                            <span className="text-xs font-normal text-muted-foreground ml-1">(you)</span>
                          )}
                        </p>
                        <span className="text-xs text-primary font-medium flex-shrink-0">Lv.{entry.level}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.streakDays > 0 && `${entry.streakDays}d streak · `}
                        Given {entry.totalGiven} pts
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-primary">{entry.totalReceived}</p>
                      <p className="text-xs text-muted-foreground">received</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Explanation */}
      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold mb-1">How ranking works</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Rankings are based on total points received from others — a genuine measure of how many
            people have recognized your positive actions. You can't buy or earn your way up; you rise
            by being good and having others notice.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
