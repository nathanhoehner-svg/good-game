import { useState } from "react";
import { useAuth } from "../App";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Gift, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function GiftPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState<{ xpEarned: number; newLevel: number } | null>(null);

  const sendGift = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientUsername: recipient, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send gift");
      return data;
    },
    onSuccess: (data) => {
      setSuccess({ xpEarned: 20, newLevel: data.senderLevel });
      if (user) {
        setUser({ ...user, xp: data.senderXp, level: data.senderLevel, giftsGiven: user.giftsGiven + 1 });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/gifts/sent"] });
      setRecipient("");
      setMessage("");
    },
  });

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-foreground">Gift Sent!</h2>
            <p className="text-muted-foreground mt-2">You spread some good vibes!</p>
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium text-primary">+20 XP earned!</p>
              {success.newLevel > (user?.level ?? 1) && (
                <p className="text-sm font-bold text-yellow-600 mt-1">🎊 Level Up! You're now Level {success.newLevel}!</p>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setSuccess(null)}>
                Send Another
              </Button>
              <Button className="flex-1" onClick={() => navigate("/")}>Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Send a Gift</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Gift a Player
            </CardTitle>
            <CardDescription>
              Send a gift to brighten someone's day. You earn +20 XP per gift (up to 3/day).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendGift.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Username</Label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Enter their username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message (optional)</Label>
                <Input
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a nice message..."
                  maxLength={200}
                />
              </div>
              {sendGift.isError && (
                <p className="text-sm text-destructive">
                  {(sendGift.error as Error).message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={sendGift.isPending}>
                {sendGift.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Send Gift (+20 XP)
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>💡</span>
              <p>You can send up to 3 gifts per day. Each gift earns you 20 XP!</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
