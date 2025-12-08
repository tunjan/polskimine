import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";



interface CramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CramModal = ({ isOpen, onClose }: CramModalProps) => {


  const [limit, setLimit] = useState([50]);
  const navigate = useNavigate();



  const handleStart = () => {
    const params = new URLSearchParams();
    params.set("mode", "cram");

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
