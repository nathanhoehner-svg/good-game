import { useState } from "react";
import { useAuth } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { setCurrentUser, isDark, toggleTheme } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await apiRequest("POST", "/api/login", {
          username: username.trim().toLowerCase(),
          password,
        });
        if (!res.ok) {
          const err = await res.json();
          toast({ title: "Sign in failed", description: err.error, variant: "destructive" });
          setLoading(false);
          return;
        }
        const user = await res.json();
        setCurrentUser(user);
      } else {
        if (!displayName.trim()) {
          toast({ title: "Name required", description: "Please enter your display name.", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
          setLoading(false);
          return;
        }
        const res = await apiRequest("POST", "/api/users", {
          username: username.trim().toLowerCase(),
          displayName: displayName.trim(),
          password,
        });
        if (!res.ok) {
          const err = await res.json();
          toast({ title: "Error", description: err.error, variant: "destructive" });
          setLoading(false);
          return;
        }
        const user = await res.json();
        setCurrentUser(user);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
        data-testid="theme-toggle"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? "☀️" : "🌙"}
      </button>

      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-label="Good Game logo">
            <circle cx="24" cy="24" r="20" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" />
            <path d="M16 24 L22 30 L32 18" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Good Game</h1>
        <p className="text-muted-foreground text-sm mt-1">Recognize goodness. Build a better world.</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label htmlFor="username" className="text-sm font-medium mb-1.5 block">Username</label>
              <Input
                id="username"
                name="username"
                data-testid="input-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. nathan"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label htmlFor="displayName" className="text-sm font-medium mb-1.5 block">Display Name</label>
                <Input
                  id="displayName"
                  name="displayName"
                  data-testid="input-displayname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Nathan H."
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-submit"
            >
              {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>

            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setPassword(""); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-1 transition-colors"
              data-testid="button-toggle-mode"
            >
              {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
