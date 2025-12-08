import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';


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


                <div className="p-8 md:p-10 space-y-8 overflow-y-auto">
                    {/* Header */}
                    <div className="space-y-3 border-b border-border/40 pb-6">
                        <div className="flex justify-between items-start gap-6">
                            <h2 className="text-3xl font-light tracking-tight text-foreground wrap-break-word">{result?.originalText}</h2>
                            <Badge variant="outline" className="whitespace-nowrap shrink-0">
                                {result?.partOfSpeech}
                            </Badge>
                        </div>
                    </div>

                    {/* Content sections */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Definition</h3>
                            <p className="text-lg font-light leading-relaxed text-foreground/90 wrap-break-word">{result?.definition}</p>
                        </div>

                        <div className="pt-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Context</h3>
                            <div className="relative pl-4 border-l-2 border-primary/20">
                                <p className="text-base italic text-muted-foreground/75 leading-relaxed wrap-break-word">
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
