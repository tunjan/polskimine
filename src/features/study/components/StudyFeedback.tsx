import React, { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import clsx from "clsx";
import { XpFeedback } from "../hooks/useXpSession";

export const StudyFeedback = React.memo(
  ({ feedback }: { feedback: XpFeedback | null }) => {
    const [visible, setVisible] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState<XpFeedback | null>(
      null,
    );

    useEffect(() => {
      if (feedback) {
        setCurrentFeedback(feedback);
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 1500);
        return () => clearTimeout(timer);
      }
    }, [feedback]);

    if (!currentFeedback) return null;

    return (
      <div
        key={currentFeedback.id}
        className={clsx(
          "absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-500 ease-out",
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
        )}
      >
        <div
          className={clsx(
            "relative flex items-center gap-3 px-4 py-2 rounded-md border shadow-sm bg-background",
            currentFeedback.isBonus
              ? "border-primary/20 text-primary"
              : "border-border text-foreground",
          )}
        >
          <Zap
            size={14}
            className={currentFeedback.isBonus ? "fill-primary" : "fill-none"}
          />
          <span className="text-sm font-medium">{currentFeedback.message}</span>
        </div>
      </div>
    );
  },
);
