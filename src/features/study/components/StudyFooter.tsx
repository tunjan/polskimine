import React from "react";
import { Grade } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

interface StudyFooterProps {
  isFlipped: boolean;
  setIsFlipped: (flipped: boolean) => void;
  isProcessing: boolean;
  binaryRatingMode: boolean;
  onGrade: (grade: Grade) => void;
  intervals?: Record<Grade, string>;
}

export const StudyFooter: React.FC<StudyFooterProps> = React.memo(
  ({
    isFlipped,
    setIsFlipped,
    isProcessing,
    binaryRatingMode,
    onGrade,
    intervals,
  }) => {
    return (
      <footer className="relative shrink-0 pb-[env(safe-area-inset-bottom)] bg-linear-to-t from-muted/30 to-background border-t border-border/30">
        <div className="min-h-20 md:min-h-24 h-auto w-full max-w-3xl mx-auto py-4 px-4 md:px-6 flex flex-col">
          {!isFlipped ? (
            <Button
              onClick={() => setIsFlipped(true)}
              disabled={isProcessing}
              variant="default"
              className="w-full flex-1 text-base md:text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Eye size={18} className="mr-2" />
              Show Answer
              <kbd className="ml-3 px-2 py-0.5 text-[10px] font-medium bg-primary-foreground/20 rounded border border-primary-foreground/10 max-md:hidden">
                SPACE
              </kbd>
            </Button>
          ) : binaryRatingMode ? (
            <div className="grid grid-cols-2 w-full gap-3 flex-1">
              <AnswerButton
                label="Again"
                shortcut="1"
                grade="Again"
                onClick={() => onGrade("Again")}
                disabled={isProcessing}
                interval={intervals?.Again}
              />
              <AnswerButton
                label="Good"
                shortcut="Space"
                grade="Good"
                onClick={() => onGrade("Good")}
                disabled={isProcessing}
                interval={intervals?.Good}
              />
            </div>
          ) : (
            <div className="grid grid-cols-4 w-full gap-2 md:gap-3 flex-1">
              <AnswerButton
                label="Again"
                shortcut="1"
                grade="Again"
                onClick={() => onGrade("Again")}
                disabled={isProcessing}
                interval={intervals?.Again}
              />
              <AnswerButton
                label="Hard"
                shortcut="2"
                grade="Hard"
                onClick={() => onGrade("Hard")}
                disabled={isProcessing}
                interval={intervals?.Hard}
              />
              <AnswerButton
                label="Good"
                shortcut="3"
                grade="Good"
                onClick={() => onGrade("Good")}
                disabled={isProcessing}
                interval={intervals?.Good}
              />
              <AnswerButton
                label="Easy"
                shortcut="4"
                grade="Easy"
                onClick={() => onGrade("Easy")}
                disabled={isProcessing}
                interval={intervals?.Easy}
              />
            </div>
          )}
        </div>
      </footer>
    );
  },
);

const gradeStyles: Record<Grade, { bg: string; hover: string; text: string }> =
  {
    Again: {
      bg: "bg-red-500/10 border-red-800/20",
      hover: "hover:bg-red-500/20 hover:border-red-500/30",
      text: "text-red-700 dark:text-red-400",
    },
    Hard: {
      bg: "bg-amber-500/10 border-amber-800/20",
      hover: "hover:bg-amber-500/20 hover:border-amber-500/30",
      text: "text-amber-700 dark:text-amber-400",
    },
    Good: {
      bg: "bg-green-500/10 border-green-800/20",
      hover: "hover:bg-green-500/20 hover:border-green-500/30",
      text: "text-green-700 dark:text-green-400",
    },
    Easy: {
      bg: "bg-emerald-500/10 border-emerald-800/20",
      hover: "hover:bg-emerald-500/20 hover:border-emerald-500/30",
      text: "text-emerald-700 dark:text-emerald-400",
    },
  };

const AnswerButton = React.memo(
  ({
    label,
    shortcut,
    grade,
    className,
    onClick,
    disabled,
    interval,
  }: {
    label: string;
    shortcut: string;
    grade: Grade;
    className?: string;
    onClick: () => void;
    disabled: boolean;
    interval?: string;
  }) => {
    const style = gradeStyles[grade];

    return (
      <Button
        onClick={onClick}
        disabled={disabled}
        variant="outline"
        className={cn(
          "h-full flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-all",
          "hover:scale-[1.02] active:scale-[0.98]",
          style.bg,
          style.hover,
          style.text,
          className,
        )}
      >
        <span className="text-sm md:text-base font-bold">{label}</span>
        {interval && (
          <span className="text-[10px] md:text-xs font-medium opacity-60">
            {interval}
          </span>
        )}
        <kbd className="text-[9px] font-medium opacity-40 bg-foreground/5 px-1.5 py-0.5 rounded mt-0.5 max-md:hidden">
          {shortcut}
        </kbd>
      </Button>
    );
  },
);
