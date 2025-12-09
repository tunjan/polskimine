import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { Card } from "@/types";
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { Activity, Clock, Target, Zap, History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card as UiCard, CardContent } from "@/components/ui/card";

interface CardHistoryModalProps {
  card: Card | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const StatBox = ({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
}) => (
  <UiCard>
    <CardContent className="flex flex-col items-center justify-center p-4 text-center">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      {subtext && (
        <span className="text-xs text-muted-foreground mt-1">{subtext}</span>
      )}
    </CardContent>
  </UiCard>
);

const TimelineEvent = ({
  label,
  dateStr,
}: {
  label: string;
  dateStr?: string;
}) => {
  if (!dateStr || !isValid(parseISO(dateStr))) return null;
  const date = parseISO(dateStr);

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="text-right flex flex-col items-end">
        <span className="text-sm font-medium tabular-nums">
          {format(date, "PPP")}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(date, { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};

export const CardHistoryModal: React.FC<CardHistoryModalProps> = ({
  card,
  isOpen,
  onClose,
}) => {
  if (!card) return null;

  const difficultyPercent = Math.min(
    100,
    Math.round(((card.difficulty || 0) / 10) * 100),
  );
  const stability = card.stability ? parseFloat(card.stability.toFixed(2)) : 0;

  const getFsrsLabel = (state?: number) => {
    if (state === 0) return "New";
    if (state === 1) return "Learning";
    if (state === 2) return "Review";
    if (state === 3) return "Relearning";
    return "Unknown";
  };

  const getStateVariant = (
    state?: number,
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (state === 0) return "default";
    if (state === 1) return "secondary";
    if (state === 2) return "outline";
    if (state === 3) return "destructive";
    return "outline";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <div className="p-6 pb-2">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-muted-foreground" />
                <DialogTitle>Card History</DialogTitle>
              </div>
              <Badge variant={getStateVariant(card.state)}>
                {getFsrsLabel(card.state)}
              </Badge>
            </div>
            <DialogDescription>
              Detailed statistics and timeline for this card.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 py-2 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold leading-tight text-balance">
                {card.targetSentence}
              </h2>
              <p className="text-muted-foreground text-balance">
                {card.nativeTranslation}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatBox
                label="Reviews"
                value={card.reps || 0}
                subtext="Total Repetitions"
                icon={<Activity size={16} />}
              />
              <StatBox
                label="Lapses"
                value={card.lapses || 0}
                subtext="Forgotten count"
                icon={<Zap size={16} />}
              />
              <StatBox
                label="Stability"
                value={`${stability}d`}
                subtext="Retention Interval"
                icon={<Target size={16} />}
              />
              <StatBox
                label="Difficulty"
                value={`${(card.difficulty || 0).toFixed(1)}`}
                subtext={
                  difficultyPercent > 60 ? "High Difficulty" : "Normal Range"
                }
                icon={<Clock size={16} />}
              />
            </div>

            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <History size={14} /> Timeline
              </h3>
              <div className="space-y-1">
                <TimelineEvent
                  label="Created"
                  dateStr={card.first_review || card.dueDate}
                />
                <TimelineEvent label="Last Seen" dateStr={card.last_review} />
                <TimelineEvent label="Next Due" dateStr={card.dueDate} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
