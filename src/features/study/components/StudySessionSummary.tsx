import React from "react";
import { Target, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface StudySessionSummaryProps {
  cardsReviewed: number;
  sessionXp: number;
  sessionStreak: number;
  onComplete?: () => void;
  onExit: () => void;
}

export const StudySessionSummary: React.FC<StudySessionSummaryProps> = ({
  cardsReviewed,
  sessionXp,
  sessionStreak,
  onComplete,
  onExit,
}) => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-500 p-4">
      <div className="text-center space-y-8 max-w-lg w-full">
        <div className="space-y-4">
          <h2 className="text-4xl font-light tracking-tight text-foreground">
            Session Complete
          </h2>
          <p className="text-muted-foreground">
            Great job! Here is your summary.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <Target
                size={20}
                className="text-muted-foreground"
                strokeWidth={1.5}
              />
              <span className="text-3xl font-semibold tabular-nums">
                {cardsReviewed}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Cards
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center gap-2  ">
              <Zap size={20} className="text-primary" strokeWidth={1.5} />
              <span className="text-3xl font-semibold text-primary tabular-nums">
                +{sessionXp}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                XP Earned
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <Sparkles
                size={20}
                className="text-muted-foreground"
                strokeWidth={1.5}
              />
              <span className="text-3xl font-semibold tabular-nums">
                {sessionStreak}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Streak
              </span>
            </CardContent>
          </Card>
        </div>

        <Button
          size="lg"
          onClick={() => (onComplete ? onComplete() : onExit())}
          className="w-full sm:w-auto min-w-[200px]"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
