import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHashLocation } from "wouter/use-hash-location";

export default function NotFound() {
  const [, setLocation] = useHashLocation();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="py-12 text-center">
          <p className="text-4xl mb-4">🌿</p>
          <h1 className="text-lg font-bold mb-2">Page Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This page doesn't exist, but there's plenty of good to find elsewhere.
          </p>
          <Button onClick={() => setLocation("/")} data-testid="button-go-home">
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
