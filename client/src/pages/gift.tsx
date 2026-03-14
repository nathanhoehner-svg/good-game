import { useState } from "react";
import { useAuth } from "../App";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useHashLocation } from "wouter/use-hash-location";
import { useRoute } from "wouter";
import type { User } from "@shared/schema";

const categories = [
  { id: "kindness", label: "Act of Kindness", emoji: "💚" },
  { id: "volunteering", label: "Volunteering", emoji: "🤝" },
  { id: "community", label: "Community Work", emoji: "🏘️" },
  { id: "helping", label: "Helping Others", emoji: "🙌" },
  { id: "generosity", label: "Generosity", emoji: "✨" },
  { id: "encouragement", label: "Encouragement", emoji: "💪" },
];

export default function GiftPage() {
  const { currentUser, setCurrentUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useHashLocation();
  const [, params] = useRoute("/gift/:userId");

  const [selectedUser, setSelectedUser] = useState<number | null>(
    params?.userId ? Number(params.userId) : null
  );
  const [amount, setAmount] = useState(10);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("kindness");
  const [search, setSearch] = useState("");

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const otherUsers = (allUsers ?? []).filter(u => u.id !== currentUser?.id);
  const filteredUsers = search
    ? otherUsers.filter(u =>
        u.displayName.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
      )
    : otherUsers;

  const selectedUserObj = otherUsers.find(u => u.id === selectedUser);

  const giftMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !selectedUser) throw new Error("Select a recipient");
      const res = await apiRequest("POST", "/api/gifts", {
        fromUserId: currentUser.id,
        toUserId: selectedUser,
        amount,
        message: message.trim() || undefined,
        category,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: async () => {
      toast({
        title: "Points gifted! 🎉",
        description: `You gave ${amount} points to ${selectedUserObj?.displayName} for ${category}.`,
      });
      // Refresh user data
      const res = await fetch(`/api/users/${currentUser!.id}`);
      const updatedUser = await res.json();
      setCurrentUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/gifts/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Reset form
      setSelectedUser(null);
      setAmount(10);
      setMessage("");
      setCategory("kindness");
      setLocation("/");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (!currentUser) return null;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <div className="mb-6">
        <h1 className="text-lg font-bold">Give Points</h1>
        <p className="text-sm text-muted-foreground">
          Recognize someone's goodness. You have <span className="font-semibold text-primary">{currentUser.pointsBalance} points</span> to give.
        </p>
      </div>

      {/* Step 1: Select Person */}
      {!selectedUser ? (
        <div>
          <label className="text-sm font-medium mb-2 block">Who did something good?</label>
          <Input
            data-testid="input-search-user"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="mb-3"
          />
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No other users found. Invite your family to join Good Game.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setSelectedUser(user.id)}
                  data-testid={`select-user-${user.id}`}
                >
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: user.avatarColor }}
                    >
                      {user.displayName[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{user.username} · Level {user.level}</p>
                    </div>
                    <span className="text-muted-foreground">→</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Selected user */}
          <Card className="border-primary/30" data-testid="selected-user">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: selectedUserObj?.avatarColor }}
              >
                {selectedUserObj?.displayName[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{selectedUserObj?.displayName}</p>
                <p className="text-xs text-muted-foreground">@{selectedUserObj?.username}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
                data-testid="button-change-user"
              >
                Change
              </Button>
            </CardContent>
          </Card>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium mb-2 block">How many points?</label>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 25, 50, 100].map((val) => (
                <Button
                  key={val}
                  variant={amount === val ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setAmount(val)}
                  disabled={val > currentUser.pointsBalance}
                  data-testid={`amount-${val}`}
                >
                  {val}
                </Button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium mb-2 block">What did they do?</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  data-testid={`category-${cat.id}`}
                  className={`p-3 rounded-lg text-left text-sm transition-all border ${
                    category === cat.id
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <span className="mr-1.5">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Message (optional)</label>
            <Input
              data-testid="input-gift-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Thanks for helping with dinner!"
              maxLength={200}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={() => giftMutation.mutate()}
            disabled={giftMutation.isPending}
            className="w-full h-12 text-base font-semibold"
            data-testid="button-send-gift"
          >
            {giftMutation.isPending ? "Sending..." : `Give ${amount} Points 🎁`}
          </Button>
        </div>
      )}
    </div>
  );
}
