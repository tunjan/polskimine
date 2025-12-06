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
        <main className="flex-1 mx-2  relative flex flex-col items-center justify-center py-8 overflow-hidden">
            {/* Subtle diamond pattern background */}
            <div
                className="absolute inset-0 opacity-[0.015] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20Z' fill='%23d4a574' fill-opacity='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px 40px'
                }}
            />



            {/* Decorative side accents - enhanced */}
            <span className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-2">
                <span className="w-px h-16 bg-linear-to-b from-transparent via-amber-600/80 to-transparent" />
                <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/80" />
                <span className="w-px h-24 bg-linear-to-b from-amber-600/80 via-border/30 to-transparent" />
            </span>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-2">
                <span className="w-px h-16 bg-linear-to-b from-transparent via-amber-600/80 to-transparent" />
                <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/80" />
                <span className="w-px h-24 bg-linear-to-b from-amber-600/80 via-border/30 to-transparent" />
            </span>

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
