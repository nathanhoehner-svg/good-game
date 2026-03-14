import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../App";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lesson, UserLesson } from "@shared/schema";

export default function LearnPage() {
  const { currentUser } = useAuth();
  const [openLessonId, setOpenLessonId] = useState<number | null>(null);

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
  });

  const { data: completedLessons } = useQuery<UserLesson[]>({
    queryKey: ["/api/users", currentUser?.id, "lessons"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${currentUser!.id}/lessons`);
      return res.json();
    },
    enabled: !!currentUser,
  });

  const completedIds = new Set((completedLessons ?? []).map(ul => ul.lessonId));

  const completeMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const res = await apiRequest("POST", `/api/users/${currentUser!.id}/lessons/${lessonId}/complete`);
      if (!res.ok) throw new Error("Failed to mark complete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "lessons"] });
    },
  });

  if (!currentUser) return null;

  const openLesson = lessons?.find(l => l.id === openLessonId);

  // Reading a lesson
  if (openLesson) {
    const isUnlocked = currentUser.level >= openLesson.unlockLevel;
    const isCompleted = completedIds.has(openLesson.id);

    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpenLessonId(null)}
          className="mb-4"
          data-testid="button-back-lessons"
        >
          ← Back to lessons
        </Button>

        <div className="mb-4">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">
            {openLesson.category.replace("-", " ")}
          </span>
          <h1 className="text-lg font-bold mt-1">{openLesson.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{openLesson.description}</p>
        </div>

        {isUnlocked ? (
          <>
            <Card>
              <CardContent className="py-5">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {openLesson.content.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="text-sm leading-relaxed text-foreground mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {!isCompleted && (
              <Button
                onClick={() => completeMutation.mutate(openLesson.id)}
                disabled={completeMutation.isPending}
                className="w-full mt-4"
                data-testid="button-complete-lesson"
              >
                {completeMutation.isPending ? "..." : "Mark as Read ✓"}
              </Button>
            )}

            {isCompleted && (
              <p className="text-center text-sm text-primary font-medium mt-4">
                ✓ You've completed this lesson
              </p>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-3xl mb-3">🔒</p>
              <p className="text-sm text-muted-foreground">
                Reach Level {openLesson.unlockLevel} to unlock this lesson.
                You're currently Level {currentUser.level}.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Lesson list
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <div className="mb-6">
        <h1 className="text-lg font-bold">Learn</h1>
        <p className="text-sm text-muted-foreground">
          Science-backed lessons on cooperation, empathy, and building a better world.
          New lessons unlock as you level up.
        </p>
      </div>

      <div className="space-y-2">
        {(lessons ?? []).map((lesson) => {
          const isUnlocked = currentUser.level >= lesson.unlockLevel;
          const isCompleted = completedIds.has(lesson.id);

          return (
            <Card
              key={lesson.id}
              className={`transition-all ${isUnlocked ? "hover-elevate cursor-pointer" : "opacity-60"}`}
              onClick={() => isUnlocked && setOpenLessonId(lesson.id)}
              data-testid={`lesson-${lesson.id}`}
            >
              <CardContent className="py-3.5 px-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? "bg-primary/15 text-primary"
                      : isUnlocked
                        ? "bg-muted text-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? "✓" : isUnlocked ? "📖" : "🔒"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{lesson.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-medium ${isUnlocked ? "text-primary" : "text-muted-foreground"}`}>
                      {isUnlocked ? "Read" : `Lv.${lesson.unlockLevel}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold mb-1">Why these lessons?</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every lesson is grounded in peer-reviewed research — neuroscience, behavioral economics,
            social psychology. No religious content, no pseudoscience. Just what we actually know
            about how humans cooperate and why it matters.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
