import React from "react";
import { Sparkles, Plus } from "lucide-react";
import { ButtonLoader } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";

interface SelectionMenuProps {
  top: number;
  left: number;
  onAnalyze: () => void;
  onGenerateCard?: () => void;
  isAnalyzing: boolean;
  isGeneratingCard: boolean;
}

export const SelectionMenu: React.FC<SelectionMenuProps> = ({
  top,
  left,
  onAnalyze,
  onGenerateCard,
  isAnalyzing,
  isGeneratingCard,
}) => {
  return (
    <div
      className="fixed z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-300 flex gap-1"
      style={{ top, left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onAnalyze}
        disabled={isAnalyzing || isGeneratingCard}
        className="bg-card shadow-sm gap-2"
      >
        {isAnalyzing ? (
          <ButtonLoader />
        ) : (
          <Sparkles size={14} className="text-primary" />
        )}
        <span>Analyze</span>
      </Button>

      {onGenerateCard && (
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateCard}
          disabled={isAnalyzing || isGeneratingCard}
          className="bg-card shadow-sm gap-2"
        >
          {isGeneratingCard ? (
            <ButtonLoader />
          ) : (
            <Plus size={14} className="text-primary" />
          )}
          <span>Create Card</span>
        </Button>
      )}
    </div>
  );
};
