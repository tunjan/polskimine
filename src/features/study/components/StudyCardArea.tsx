import React from "react";
import { Card, Language } from "@/types";
import { Flashcard } from "./Flashcard";

interface StudyCardAreaProps {
  currentCard: Card;
  isFlipped: boolean;
  autoPlayAudio: boolean;
  blindMode: boolean;
  showTranslation: boolean;
  language: Language;
  onAddCard?: (card: Card) => void;
  onUpdateCard?: (card: Card) => void;
}

export const StudyCardArea: React.FC<StudyCardAreaProps> = React.memo(
  ({
    currentCard,
    isFlipped,
    autoPlayAudio,
    blindMode,
    showTranslation,
    language,
    onAddCard,
    onUpdateCard,
  }) => {
    return (
      <main className="flex-1 mx-2  relative flex flex-col items-center justify-center py-8 overflow-hidden">
        <Flashcard
          card={currentCard}
          isFlipped={isFlipped}
          autoPlayAudio={autoPlayAudio}
          blindMode={blindMode}
          showTranslation={showTranslation}
          language={language}
          onAddCard={onAddCard}
          onUpdateCard={onUpdateCard}
        />
      </main>
    );
  },
);
