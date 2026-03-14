import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useState, createContext, useContext, useEffect } from "react";
import type { User } from "@shared/schema";
import HomePage from "./pages/home";
import GiftPage from "./pages/gift";
import LeaderboardPage from "./pages/leaderboard";
import LearnPage from "./pages/learn";
import ProfilePage from "./pages/profile";
import LoginPage from "./pages/login";
import NotFound from "./pages/not-found";
import { PerplexityAttribution } from "./components/PerplexityAttribution";

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  isDark: false,
  toggleTheme: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function AppContent() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <div className="flex-1 pb-20">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/gift" component={GiftPage} />
          <Route path="/gift/:userId" component={GiftPage} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/learn" component={LearnPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/profile/:userId" component={ProfilePage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomNav />
      <PerplexityAttribution />
    </div>
  );
}

function BottomNav() {
  const [location, setLocation] = useHashLocation();

  const tabs = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/gift", label: "Gift", icon: "🎁" },
    { path: "/leaderboard", label: "Board", icon: "🏆" },
    { path: "/learn", label: "Learn", icon: "📚" },
    { path: "/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t z-50" data-testid="bottom-nav">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location === tab.path || (tab.path !== "/" && location.startsWith(tab.path));
          return (
            <button
              key={tab.path}
              onClick={() => setLocation(tab.path)}
              data-testid={`nav-${tab.label.toLowerCase()}`}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ currentUser, setCurrentUser, isDark, toggleTheme }}>
        <Router hook={useHashLocation}>
          <AppContent />
        </Router>
        <Toaster />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
