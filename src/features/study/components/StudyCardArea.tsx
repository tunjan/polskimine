import React from 'react';
import { Card, Language } from '@/types';
import { Flashcard } from './Flashcard';
import { StudyFeedback } from './StudyFeedback';
import { XpFeedback } from '@/features/xp/hooks/useXpSession';

interface StudyCardAreaProps {
    feedback: XpFeedback | null;
    currentCard: Card;
    isFlipped: boolean;
    autoPlayAudio: boolean;
    blindMode: boolean;
    showTranslation: boolean;
    language: Language;
    onAddCard?: (card: Card) => void;
}

export const StudyCardArea: React.FC<StudyCardAreaProps> = React.memo(({
    feedback,
    currentCard,
    isFlipped,
    autoPlayAudio,
    blindMode,
    showTranslation,
    language,
    onAddCard,
}) => {
    return (
        <main className="flex-1 w-full relative flex flex-col items-center justify-center py-8">
            {/* Decorative side accents */}
            <span className="absolute left-4 top-1/2 -translate-y-1/2 w-px h-32 bg-linear-to-b from-transparent via-border/30 to-transparent hidden md:block" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 w-px h-32 bg-linear-to-b from-transparent via-border/30 to-transparent hidden md:block" />

            <StudyFeedback feedback={feedback} />

            <Flashcard
                card={currentCard}
                isFlipped={isFlipped}
                autoPlayAudio={autoPlayAudio}
                blindMode={blindMode}
                showTranslation={showTranslation}
                language={language}
                onAddCard={onAddCard}
            />
        </main>
    );
});
