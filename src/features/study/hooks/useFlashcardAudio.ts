import { useState, useCallback, useRef, useEffect } from 'react';
import { ttsService } from '@/lib/tts';
import { parseFurigana } from '@/lib/utils';
import { Card, Language } from '@/types';
import { UserSettings } from '@/types';

interface UseFlashcardAudioProps {
    card: Card;
    language: Language;
    tts: UserSettings['tts'];
    isFlipped: boolean;
    autoPlayAudio: boolean;
}

export function useFlashcardAudio({
    card,
    language,
    tts,
    isFlipped,
    autoPlayAudio
}: UseFlashcardAudioProps) {
    const [playSlow, setPlaySlow] = useState(false);
    const playSlowRef = useRef(playSlow);
    const hasSpokenRef = useRef<string | null>(null);

    useEffect(() => {
        playSlowRef.current = playSlow;
    }, [playSlow]);

    useEffect(() => {
        setPlaySlow(false);
    }, [card.id]);

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
        const effectiveRate = playSlowRef.current ? Math.max(0.25, tts.rate * 0.6) : tts.rate;
        const effectiveSettings = { ...tts, rate: effectiveRate };
        const plainText = getPlainTextForTTS(card.targetSentence);

        ttsService.speak(plainText, language, effectiveSettings).catch(err => {
            console.error('TTS speak error:', err);
        });
        setPlaySlow(prev => !prev);
    }, [card.targetSentence, language, tts, getPlainTextForTTS]);

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
