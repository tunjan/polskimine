import { useState, useCallback, useEffect } from 'react';

interface SelectionState {
    text: string;
    top: number;
    left: number;
}

export const useTextSelection = () => {
    const [selection, setSelection] = useState<SelectionState | null>(null);

    const handleMouseUp = useCallback(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
            setSelection(null);
            return;
        }
        const text = sel.toString().trim();
        if (!text) return;
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelection({
            text,
            top: rect.top - 60,
            left: rect.left + (rect.width / 2)
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    }, []);

    useEffect(() => {
        const clear = () => setSelection(null);
        window.addEventListener('resize', clear);
        window.addEventListener('scroll', clear, true);
        return () => {
            window.removeEventListener('resize', clear);
            window.removeEventListener('scroll', clear, true);
        };
    }, []);

    return {
        selection,
        handleMouseUp,
        clearSelection
    };
};
