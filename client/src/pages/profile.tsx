import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../App";
import type { Gift, User } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  const { currentUser, setCurrentUser } = useAuth();

  const { data: received } = useQuery<Gift[]>({
    queryKey: ["/api/gifts/received", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/gifts/received/${currentUser!.id}`);
      return res.json();
    },
    enabled: !!currentUser,
  });

  const { data: sent } = useQuery<Gift[]>({
    queryKey: ["/api/gifts/sent", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/gifts/sent/${currentUser!.id}`);
      return res.json();
    },
    enabled: !!currentUser,
  });

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const usersMap = new Map((allUsers ?? []).map(u => [u.id, u]));

  if (!currentUser) return null;

  const titles = [
    "", "Seedling", "Sprout", "Bloom", "Tree", "Grove",
    "Forest", "Guardian", "Beacon", "Luminary", "Legend"
  ];
  const title = titles[Math.min(currentUser.level, titles.length - 1)] || `Level ${currentUser.level}`;

  const memberSince = currentUser.joinedAt
    ? new Date(currentUser.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      {/* Profile Header */}
      <div className="text-center mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3"
          style={{ backgroundColor: currentUser.avatarColor }}
        >
          {currentUser.displayName[0]?.toUpperCase()}
        </div>
        <h1 className="text-lg font-bold">{currentUser.displayName}</h1>
        <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            Lv.{currentUser.level} {title}
          </span>
          {currentUser.streakDays > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs font-semibold">
              🔥 {currentUser.streakDays}d streak
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Member since {memberSince}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xl font-bold text-primary">{currentUser.pointsBalance}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xl font-bold">{currentUser.totalReceived}</p>
            <p className="text-xs text-muted-foreground">Received</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xl font-bold">{currentUser.totalGiven}</p>
            <p className="text-xs text-muted-foreground">Given</p>
          </CardContent>
        </Card>
      </div>

      {/* Gift History */}
      <Tabs defaultValue="received">
        <TabsList className="w-full">
          <TabsTrigger value="received" className="flex-1" data-testid="tab-received">
            Received ({received?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex-1" data-testid="tab-sent">
            Given ({sent?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-3">
          {(!received || received.length === 0) ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No points received yet. Keep doing good.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {received.map((gift) => {
                const sender = usersMap.get(gift.fromUserId);
                return (
                  <Card key={gift.id} data-testid={`received-gift-${gift.id}`}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: sender?.avatarColor || "#888" }}
                          >
                            {sender?.displayName?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{sender?.displayName || "Unknown"}</p>
                            {gift.message && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">"{gift.message}"</p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-primary">+{gift.amount}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-3">
          {(!sent || sent.length === 0) ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">You haven't given any points yet. Try recognizing someone today.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sent.map((gift) => {
                const receiver = usersMap.get(gift.toUserId);
                return (
                  <Card key={gift.id} data-testid={`sent-gift-${gift.id}`}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: receiver?.avatarColor || "#888" }}
                          >
                            {receiver?.displayName?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{receiver?.displayName || "Unknown"}</p>
                            {gift.message && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">"{gift.message}"</p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-muted-foreground">-{gift.amount}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Sign Out */}
      <div className="mt-8 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentUser(null)}
          className="text-muted-foreground"
          data-testid="button-sign-out"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
