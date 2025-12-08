import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ResultCard = ({
  card,
  selected,
  onToggle,
}: {
  card: any;
  selected: boolean;
  onToggle: () => void;
}) => {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "group relative flex flex-col gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden",
        selected
          ? "bg-primary/5 border-primary shadow-sm"
          : "bg-card border-border hover:border-muted-foreground/30 hover:shadow-xs",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <p className="font-medium text-lg leading-snug">
            {card.targetSentence}
          </p>
          <p className="text-sm text-muted-foreground">
            {card.nativeTranslation}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors shrink-0",
            selected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/30 group-hover:border-primary/50",
          )}
        >
          {selected && <Check className="w-3.5 h-3.5 stroke-3" />}
        </div>
      </div>

      <Separator className="my-1 bg-border/50" />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge
          variant="secondary"
          className="font-mono text-primary bg-primary/10 hover:bg-primary/15 border-0"
        >
          {card.targetWord}
        </Badge>
        <span className="text-muted-foreground italic">
          {card.targetWordTranslation}
        </span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
        <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
          {card.targetWordPartOfSpeech}
        </span>
      </div>
    </div>
  );
};

interface GeneratorPreviewProps {
  generatedData: any[];
  selectedIndices: Set<number>;
  toggleSelection: (index: number) => void;
  setStep: (step: "config" | "preview") => void;
  handleSave: () => void;
  selectAll: () => void;
  clearSelection: () => void;
}

export const GeneratorPreview: React.FC<GeneratorPreviewProps> = ({
  generatedData,
  selectedIndices,
  toggleSelection,
  setStep,
  handleSave,
  selectAll,
  clearSelection,
}) => {
  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col"
    >
      <div className="px-6 py-3 border-b bg-muted/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary" />
            <span className="font-semibold">{selectedIndices.size}</span>
            <span className="text-muted-foreground">selected</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {generatedData.length} generated
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={selectAll}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs hover:text-destructive"
            onClick={clearSelection}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/5 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
          {generatedData.map((card, idx) => (
            <ResultCard
              key={idx}
              card={card}
              selected={selectedIndices.has(idx)}
              onToggle={() => toggleSelection(idx)}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-background via-background to-transparent pointer-events-none">
        <div className="flex justify-center sm:justify-end gap-3 pointer-events-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setStep("config")}
            className="shadow-sm bg-background/80 backdrop-blur"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
          <Button
            size="lg"
            onClick={handleSave}
            disabled={selectedIndices.size === 0}
            className="shadow-lg min-w-[160px]"
          >
            <Save className="w-4 h-4 mr-2" />
            Add to Deck
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
