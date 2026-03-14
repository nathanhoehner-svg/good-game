import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit2, Check, X } from "lucide-react";
import { useAuth } from "../App";
import { Progress } from "@/components/ui/progress";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(user?.bio || "");

  const { data: receivedGifts = [] } = useQuery<any[]>({
    queryKey: ["/api/gifts/received"],
    queryFn: async () => {
      const res = await fetch("/api/gifts/received");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: sentGifts = [] } = useQuery<any[]>({
    queryKey: ["/api/gifts/sent"],
    queryFn: async () => {
      const res = await fetch("/api/gifts/sent");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateBio = useMutation({
    mutationFn: async (bio: string) => {
      const res = await fetch("/api/users/me/bio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update bio");
      return data;
    },
    onSuccess: (data) => {
      if (user) setUser({ ...user, bio: data.bio });
      setEditingBio(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const xpInCurrentLevel = (user?.xp ?? 0) % 100;
  const progressPct = xpInCurrentLevel;

  const joinDateFormatted = user?.joinDate
    ? new Date(user.joinDate).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">My Profile</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                🎮
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{user?.username}</h2>
                <p className="text-sm text-muted-foreground">Joined {joinDateFormatted}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Level {user?.level}
                  </span>
                  <span className="text-sm text-muted-foreground">{user?.xp} XP</span>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{user?.giftsGiven} gifts given</span>
                </div>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Level {user?.level}</span>
                <span>{xpInCurrentLevel}/100 XP to Level {(user?.level ?? 1) + 1}</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>

            {/* Bio */}
            <div className="mt-4">
              {editingBio ? (
                <div className="flex gap-2">
                  <Input
                    value={bioValue}
                    onChange={(e) => setBioValue(e.target.value)}
                    placeholder="Write something about yourself..."
                    maxLength={200}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => updateBio.mutate(bioValue)}
                    disabled={updateBio.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingBio(false);
                      setBioValue(user?.bio || "");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground flex-1">
                    {user?.bio || "No bio yet. Add one!"}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingBio(true)}
                    className="shrink-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Received Gifts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gifts Received ({receivedGifts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {receivedGifts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No gifts yet. Share your username so friends can send you one!</p>
            ) : (
              <div className="space-y-3">
                {receivedGifts.map((gift: any) => (
                  <div key={gift.id} className="flex items-start gap-3">
                    <span className="text-lg">🎁</span>
                    <div>
                      <p className="text-sm font-medium">{gift.senderUsername}</p>
                      {gift.message && <p className="text-xs text-muted-foreground">"{gift.message}"</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(gift.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sent Gifts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gifts Sent ({sentGifts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {sentGifts.length === 0 ? (
              <p className="text-sm text-muted-foreground">You haven't sent any gifts yet.</p>
            ) : (
              <div className="space-y-3">
                {sentGifts.map((gift: any) => (
                  <div key={gift.id} className="flex items-start gap-3">
                    <span className="text-lg">📤</span>
                    <div>
                      <p className="text-sm font-medium">To: {gift.recipientUsername}</p>
                      {gift.message && <p className="text-xs text-muted-foreground">"{gift.message}"</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(gift.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
