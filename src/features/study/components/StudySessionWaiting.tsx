import React from 'react';
import { Button } from '@/components/ui/button';

interface StudySessionWaitingProps {
    onExit: () => void;
}

export const StudySessionWaiting: React.FC<StudySessionWaitingProps> = ({ onExit }) => {
    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-300 z-50">
            <div className="text-center space-y-6 px-6">
                <div className="space-y-2">
                    <h2 className="text-2xl font-light tracking-tight text-foreground">Waiting for learning steps...</h2>
                    <p className="text-sm text-muted-foreground">Cards are cooling down. Take a short break.</p>
                </div>
                <Button
                    onClick={onExit}
                    variant="secondary"
                    className="px-6"
                >
                    Exit Session
                </Button>
            </div>
        </div>
    );
};
