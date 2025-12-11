import React, { useState } from "react";
import { Sparkles, Plus, Wand2, ArrowDown, ArrowUp } from "lucide-react";
import { ButtonLoader } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";

interface SelectionMenuProps {
  top: number;
  left: number;
  onAnalyze: () => void;
  onGenerateCard?: () => void;
  onModifyCard?: (type: "easier" | "harder") => void;
  isAnalyzing: boolean;
  isGeneratingCard: boolean;
  isModifying?: boolean;
}

export const SelectionMenu: React.FC<SelectionMenuProps> = ({
  top,
  left,
  onAnalyze,
  onGenerateCard,
  onModifyCard,
  isAnalyzing,
  isGeneratingCard,
  isModifying = false,
}) => {
  const [showModifyOptions, setShowModifyOptions] = useState(false);

  return (
    <div
      className="fixed z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col md:flex-row gap-1 items-center"
      style={{ top, left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {!showModifyOptions ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onAnalyze}
            disabled={isAnalyzing || isGeneratingCard || isModifying}
            className="bg-card shadow-sm gap-2 w-full md:w-auto justify-start md:justify-center"
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
              disabled={isAnalyzing || isGeneratingCard || isModifying}
              className="bg-card shadow-sm gap-2 w-full md:w-auto justify-start md:justify-center"
            >
              {isGeneratingCard ? (
                <ButtonLoader />
              ) : (
                <Plus size={14} className="text-primary" />
              )}
              <span>Create Card</span>
            </Button>
          )}

          {onModifyCard && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModifyOptions(true)}
              disabled={isAnalyzing || isGeneratingCard || isModifying}
              className="bg-card shadow-sm gap-2 w-full md:w-auto justify-start md:justify-center"
            >
              {isModifying ? (
                <ButtonLoader />
              ) : (
                <Wand2 size={14} className="text-primary" />
              )}
              <span>Modify</span>
            </Button>
          )}
        </>
      ) : (
        <div className="flex flex-col md:flex-row gap-1 animate-in zoom-in-95 duration-200 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onModifyCard?.("easier")}
            disabled={isModifying}
            className="bg-card shadow-sm gap-2 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/20 w-full md:w-auto justify-start md:justify-center"
          >
            <ArrowDown size={14} />
            <span>Easier</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onModifyCard?.("harder")}
            disabled={isModifying}
            className="bg-card shadow-sm gap-2 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/20 w-full md:w-auto justify-start md:justify-center"
          >
            <ArrowUp size={14} />
            <span>Harder</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowModifyOptions(false)}
            className="bg-card shadow-sm px-2 text-muted-foreground w-full md:w-auto"
          >
            ×
          </Button>
        </div>
      )}
    </div>
  );
};
