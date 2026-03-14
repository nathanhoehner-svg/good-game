import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../App";

export default function LearnPage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, { correct: boolean; xpEarned: number }>>({});

  const { data: questions = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/quiz/questions"],
    queryFn: async () => {
      const res = await fetch("/api/quiz/questions");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const submitAnswer = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: string }) => {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      return { ...data, questionId };
    },
    onSuccess: (data) => {
      setResults((prev) => ({
        ...prev,
        [data.questionId]: { correct: data.correct, xpEarned: data.xpEarned },
      }));
      if (user && data.correct) {
        setUser({ ...user, xp: data.newXp, level: data.newLevel });
      }
    },
  });

  const totalXpEarned = Object.values(results).reduce((sum, r) => sum + r.xpEarned, 0);
  const answeredCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter((r) => r.correct).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Learn & Quiz</h1>
          </div>
          {answeredCount > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{correctCount}/{answeredCount} correct</p>
              <p className="text-xs font-medium text-primary">+{totalXpEarned} XP</p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading questions...</p>
        ) : (
          questions.map((q: any) => {
            const result = results[q.id];
            const selected = selectedAnswers[q.id];
            const options: string[] = JSON.parse(q.options);

            return (
              <Card key={q.id} className={result ? (result.correct ? "border-green-500/40" : "border-red-500/40") : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium leading-relaxed">{q.question}</CardTitle>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      +{q.xpReward} XP
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{q.category}</span>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {options.map((option: string) => {
                      let variant: "outline" | "default" | "secondary" | "destructive" = "outline";
                      if (result) {
                        if (option === q.correctAnswer) variant = "default";
                        else if (option === selected && !result.correct) variant = "destructive";
                      } else if (option === selected) {
                        variant = "secondary";
                      }
                      return (
                        <Button
                          key={option}
                          variant={variant}
                          size="sm"
                          className="justify-start text-left h-auto py-2 px-3"
                          disabled={!!result}
                          onClick={() => {
                            if (result) return;
                            setSelectedAnswers((prev) => ({ ...prev, [q.id]: option }));
                            submitAnswer.mutate({ questionId: q.id, answer: option });
                          }}
                        >
                          {option}
                        </Button>
                      );
                    })}
                  </div>
                  {result && (
                    <div className={`mt-3 flex items-center gap-2 text-sm ${
                      result.correct ? "text-green-600" : "text-red-600"
                    }`}>
                      {result.correct ? (
                        <><CheckCircle className="h-4 w-4" /> Correct! +{result.xpEarned} XP</>
                      ) : (
                        <><XCircle className="h-4 w-4" /> Incorrect. The answer was: {q.correctAnswer}</>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
