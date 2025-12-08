import React from 'react';
import { Card, Language } from '@/types';
import { Flashcard } from './Flashcard';
import { StudyFeedback } from './StudyFeedback';
import { XpFeedback } from '../hooks/useXpSession';


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
