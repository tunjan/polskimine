import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { getTags } from "@/db/repositories/cardRepository";

interface CramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CramModal = ({ isOpen, onClose }: CramModalProps) => {
  const language = useSettingsStore((s) => s.language);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [limit, setLimit] = useState([50]);
  const navigate = useNavigate();

  const { data: tags = [] } = useQuery({
    queryKey: ["tags", language],
    queryFn: () => getTags(language),
    enabled: isOpen,
  });

  const handleStart = () => {
    const params = new URLSearchParams();
    params.set("mode", "cram");
    if (selectedTag && selectedTag !== "all") params.set("tag", selectedTag);
    params.set("limit", limit[0].toString());
    navigate(`/study?${params.toString()}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md p-0 gap-0 bg-background border border-border  overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Cram Session
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review cards without affecting your long-term statistics.
            </DialogDescription>
          </div>

          <div className="space-y-6 py-2">
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Filter by Tag
              </label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-full h-10 px-3 bg-secondary/30 border-transparent hover:bg-secondary/50 transition-colors focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="All Cards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cards</SelectItem>
                  {tags.map((t: string) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Card Limit
                </label>
                <span className="text-sm font-mono font-medium bg-secondary px-2 py-0.5 rounded text-foreground">
                  {limit[0]} cards
                </span>
              </div>
              <Slider
                min={10}
                max={200}
                step={10}
                value={limit}
                onValueChange={setLimit}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase">
                <span>10</span>
                <span>200</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-secondary/20 border-t border-border flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStart} className="gap-2">
            Start Session <ArrowRight size={14} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
