import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsContent } from "./SettingsPage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "p-0 gap-0 overflow-hidden flex flex-col transition-all duration-300",
          "w-[95vw] h-[95vh] sm:max-w-5xl md:max-w-3xl sm:h-[85vh]",
        )}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <DialogTitle className="text-xl">Settings</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  Configure your learning experience
                </DialogDescription>
              </div>
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative overflow-y-auto">
           <div className="p-6">
              <SettingsContent />
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
