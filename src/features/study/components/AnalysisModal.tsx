import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Quote } from 'lucide-react';

interface AnalysisResult {
    originalText: string;
    definition: string;
    partOfSpeech: string;
    contextMeaning: string;
}

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    result: AnalysisResult | null;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
    isOpen,
    onClose,
    result
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-card border border-border p-0 overflow-hidden max-h-[85vh] flex flex-col">
                {/* Corner accents */}
                <span className="absolute top-0 left-0 w-4 h-4 pointer-events-none z-10">
                    <span className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
                    <span className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
                </span>
                <span className="absolute top-0 right-0 w-4 h-4 pointer-events-none z-10">
                    <span className="absolute top-0 right-0 w-full h-0.5 bg-primary" />
                    <span className="absolute top-0 right-0 h-full w-0.5 bg-primary" />
                </span>
                <span className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none z-10">
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
                    <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary" />
                </span>
                <span className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none z-10">
                    <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary" />
                    <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary" />
                </span>

                <div className="p-8 md:p-10 space-y-8 overflow-y-auto">
                    {/* Header */}
                    <div className="space-y-3 border-b border-border/40 pb-6">
                        <div className="flex justify-between items-start gap-6">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-2 h-2 rotate-45 bg-primary/60 shrink-0" />
                                <h2 className="text-3xl md:text-4xl font-light tracking-tight break-words">{result?.originalText}</h2>
                            </div>
                            <span className="text-[9px] font-ui font-medium uppercase border border-border/60 px-3 py-1.5 text-muted-foreground/80 tracking-[0.15em] whitespace-nowrap shrink-0">
                                {result?.partOfSpeech}
                            </span>
                        </div>
                    </div>

                    {/* Content sections */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1 h-1 rotate-45 bg-primary/40" />
                                <span className="text-[9px] font-ui font-medium uppercase tracking-[0.2em] text-muted-foreground/60">Definition</span>
                            </div>
                            <p className="text-lg font-light leading-relaxed text-foreground/90 break-words">{result?.definition}</p>
                        </div>

                        <div className="pt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Quote size={11} strokeWidth={1.5} className="text-muted-foreground/50" />
                                <span className="text-[9px] font-ui font-medium uppercase tracking-[0.2em] text-muted-foreground/60">In This Context</span>
                            </div>
                            <div className="relative pl-4 border-l-2 border-primary/20">
                                <p className="text-base italic text-muted-foreground/75 leading-relaxed break-words">
                                    {result?.contextMeaning}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
