import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ttsService } from '@/services/tts';
import { parseFurigana } from '@/lib/utils';
import { Card, Language } from '@/types';
import { SettingsState } from '@/stores/useSettingsStore';

interface UseFlashcardAudioProps {
    card: Card;
    language: Language;
    settings: {
        tts: {
            rate: number;
            pitch: number;
            volume: number;
            voice?: string;
        }
    };
    isFlipped: boolean;
    autoPlayAudio: boolean;
}

export function useFlashcardAudio({
    card,
    language,
    settings,
    isFlipped,
    autoPlayAudio
}: UseFlashcardAudioProps) {
    const [playSlow, setPlaySlow] = useState(false);
    const playSlowRef = useRef(playSlow);
    const hasSpokenRef = useRef<string | null>(null);

    // Sync playSlowRef with state
    useEffect(() => {
        playSlowRef.current = playSlow;
    }, [playSlow]);

    // Reset playSlow on card change
    useEffect(() => {
        setPlaySlow(false);
    }, [card.id]);

    // Cleanup TTS on unmount or card change
    useEffect(() => {
        return () => {
            ttsService.stop();
        };
    }, [card.id]);

    const getPlainTextForTTS = useCallback((text: string): string => {
        const segments = parseFurigana(text);
        return segments.map(s => s.text).join('');
    }, []);

    const speak = useCallback(() => {
        const effectiveRate = playSlowRef.current ? Math.max(0.25, settings.tts.rate * 0.6) : settings.tts.rate;
        const effectiveSettings = { ...settings.tts, rate: effectiveRate };
        const plainText = getPlainTextForTTS(card.targetSentence);

        ttsService.speak(plainText, language, effectiveSettings).catch(err => {
            console.error('TTS speak error:', err);
        });
        setPlaySlow(prev => !prev);
    }, [card.targetSentence, language, settings.tts, getPlainTextForTTS]);

    // Auto-play logic
    useEffect(() => {
        if (hasSpokenRef.current !== card.id) {
            hasSpokenRef.current = null;
        }
        if (autoPlayAudio && isFlipped && hasSpokenRef.current !== card.id) {
            speak();
            hasSpokenRef.current = card.id;
        }
    }, [card.id, autoPlayAudio, isFlipped, speak]);

    return { speak, playSlow };
}
