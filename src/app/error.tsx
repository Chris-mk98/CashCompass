"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-muted-foreground">500</h1>
      <p className="text-lg text-muted-foreground">Something went wrong</p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
