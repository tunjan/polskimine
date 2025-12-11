import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Card } from "@/types";
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ForgettingCurveChart } from "./ForgettingCurveChart";
import { getReviewLogsForCard } from "@/db/repositories/revlogRepository";
import { ReviewLog } from "@/types";

interface CardHistoryModalProps {
  card: Card | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export const CardHistoryModal: React.FC<CardHistoryModalProps> = ({
  card,
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = React.useState<ReviewLog[]>([]);

  React.useEffect(() => {
    if (isOpen && card?.id) {
       getReviewLogsForCard(card.id).then(setLogs);
    }
  }, [isOpen, card?.id]);

  if (!card) return null;

  const stability = card.stability ? parseFloat(card.stability.toFixed(2)) : 0;

  const getFsrsLabel = (state?: number) => {
    if (state === 0) return "New";
    if (state === 1) return "Learning";
    if (state === 2) return "Review";
    if (state === 3) return "Relearning";
    return "Unknown";
  };

  const StatItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase text-muted-foreground font-medium tracking-wider">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );

  const TimelineItem = ({ label, dateStr }: { label: string; dateStr?: string }) => {
     if (!dateStr || !isValid(parseISO(dateStr))) return null;
     const date = parseISO(dateStr);
     return (
       <div className="flex justify-between items-baseline text-sm">
         <span className="text-muted-foreground">{label}</span>
         <div className="text-right">
           <span className="font-medium block">{format(date, "PPP")}</span>
           <span className="text-xs text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</span>
         </div>
       </div>
     )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md md:max-w-3xl gap-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="text-lg font-medium">Card History</DialogTitle>
          <Badge variant="outline" className="font-normal">
             {getFsrsLabel(card.state)}
          </Badge>
        </DialogHeader>
        
        <div className="space-y-6">
            
            <div className="space-y-1">
                <div 
                    className="text-xl font-semibold leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: card.targetSentence }} 
                />
                 <div className="text-sm text-muted-foreground">
                    {card.nativeTranslation}
                 </div>
            </div>

            <Separator />

            
            <div className="grid grid-cols-4 gap-4">
                 <StatItem label="Reviews" value={card.reps || 0} />
                 <StatItem label="Lapses" value={card.lapses || 0} />
                 <StatItem label="Stability" value={`${stability}d`} />
                 <StatItem label="Difficulty" value={(card.difficulty || 0).toFixed(1)} />
            </div>

            <Separator />
            
            
            <div className="space-y-3">
               <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forgetting Curve</h4>
               <ForgettingCurveChart logs={logs} firstReviewDate={card.first_review} />
            </div>

            <Separator />

            
             <div className="space-y-3">
                 <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h4>
                 <div className="space-y-3">
                     <TimelineItem label="Created" dateStr={card.created_at} />
                     <TimelineItem label="First Review" dateStr={card.first_review} />
                     <TimelineItem label="Last Review" dateStr={card.last_review} />
                     <TimelineItem label="Next Due" dateStr={card.dueDate} />
                 </div>
             </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
