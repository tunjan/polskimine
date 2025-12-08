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
import { Settings2, X } from "lucide-react";
import { useCardGenerator } from "../hooks/useCardGenerator";
import { GeneratorConfig } from "./GeneratorConfig";
import { GeneratorPreview } from "./GeneratorPreview";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { Card as CardType } from "@/types";

interface GenerateCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCards: (cards: CardType[]) => void;
}

export const GenerateCardsModal: React.FC<GenerateCardsModalProps> = ({
  isOpen,
  onClose,
  onAddCards,
}) => {
  const {
    step,
    setStep,
    loading,
    instructions,
    setInstructions,
    count,
    setCount,
    useLearnedWords,
    setUseLearnedWords,
    difficultyMode,
    setDifficultyMode,
    selectedLevel,
    setSelectedLevel,
    selectedWordTypes,
    toggleWordType,
    setSelectedWordTypes,
    handleTopicClick,
    generateCards,
    handleSmartLesson,
    handleSave,
    toggleSelection,
    selectAll,
    clearSelection,
    reset,
    generatedData,
    selectedIndices,
  } = useCardGenerator({ onClose, onAddCards });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && reset()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "p-0 gap-0 overflow-hidden flex flex-col transition-all duration-300",
          "w-[95vw] h-[95vh] sm:max-w-5xl sm:h-[85vh]",
        )}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <DialogTitle className="text-xl">AI Card Generator</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {step === "config"
                    ? "Create custom flashcards instantly"
                    : "Review and save your cards"}
                </DialogDescription>
              </div>
            </div>
            {step === "preview" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("config")}
                className="gap-2 hidden sm:flex"
              >
                <Settings2 className="w-4 h-4" />
                Adjust Settings
              </Button>
            )}
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

        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            {step === "config" ? (
              <GeneratorConfig
                count={count}
                setCount={setCount}
                selectedLevel={selectedLevel}
                setSelectedLevel={setSelectedLevel}
                difficultyMode={difficultyMode}
                setDifficultyMode={setDifficultyMode}
                selectedWordTypes={selectedWordTypes}
                toggleWordType={toggleWordType}
                setSelectedWordTypes={setSelectedWordTypes}
                useLearnedWords={useLearnedWords}
                setUseLearnedWords={setUseLearnedWords}
                instructions={instructions}
                setInstructions={setInstructions}
                handleTopicClick={handleTopicClick}
                generateCards={() => generateCards()}
                handleSmartLesson={handleSmartLesson}
                loading={loading}
              />
            ) : (
              <GeneratorPreview
                generatedData={generatedData}
                selectedIndices={selectedIndices}
                toggleSelection={toggleSelection}
                setStep={setStep}
                handleSave={handleSave}
                selectAll={selectAll}
                clearSelection={clearSelection}
              />
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
