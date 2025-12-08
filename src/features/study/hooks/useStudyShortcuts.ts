import { useEffect } from 'react';
import { Grade } from '@/types';

interface UseStudyShortcutsProps {
    currentCardId: string | undefined;
    sessionComplete: boolean;
    isFlipped: boolean;
    setIsFlipped: (flipped: boolean) => void;
    isProcessing: boolean;
    handleGrade: (grade: Grade) => void;
    handleUndo: () => void;
    onExit: () => void;
    canUndo: boolean;
    binaryRatingMode: boolean;
}

export const useStudyShortcuts = ({
    currentCardId,
    sessionComplete,
    isFlipped,
    setIsFlipped,
    isProcessing,
    handleGrade,
    handleUndo,
    onExit,
    canUndo,
    binaryRatingMode,
}: UseStudyShortcutsProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!currentCardId && !sessionComplete) return;

            if (!isFlipped && !sessionComplete && (e.code === 'Space' || e.code === 'Enter')) {
                e.preventDefault();
                setIsFlipped(true);
            }
            else if (isFlipped && !sessionComplete && !isProcessing) {
                if (binaryRatingMode) {
                    if (e.key === '1') {
                        e.preventDefault();
                        handleGrade('Again');
                    } else if (['2', '3', '4', 'Space', 'Enter'].includes(e.key) || e.code === 'Space') {
                        e.preventDefault();
                        handleGrade('Good');
                    }
                } else {
                    if (e.code === 'Space' || e.key === '3') {
                        e.preventDefault();
                        handleGrade('Good');
                    } else if (e.key === '1') {
                        e.preventDefault();
                        handleGrade('Again');
                    } else if (e.key === '2') {
                        e.preventDefault();
                        handleGrade('Hard');
                    } else if (e.key === '4') {
                        e.preventDefault();
                        handleGrade('Easy');
                    }
                }
            }

            if (e.key === 'z' && canUndo) {
                e.preventDefault();
                handleUndo();
            }

            if (e.key === 'Escape') {
                onExit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        currentCardId,
        sessionComplete,
        isFlipped,
        setIsFlipped,
        isProcessing,
        handleGrade,
        handleUndo,
        canUndo,
        onExit,
        binaryRatingMode,
    ]);
};
