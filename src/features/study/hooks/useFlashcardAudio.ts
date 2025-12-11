import { useState, useCallback, useRef, useEffect } from "react";
import { ttsService } from "@/lib/tts";
import { parseFurigana } from "@/lib/utils";
import { Card, Language } from "@/types";
import { UserSettings } from "@/types";

interface UseFlashcardAudioProps {
  card: Card;
  language: Language;
  tts: UserSettings["tts"];
  isFlipped: boolean;
  autoPlayAudio: boolean;
  playTargetWordAudioBeforeSentence: boolean;
}

export function useFlashcardAudio({
  card,
  language,
  tts,
  isFlipped,
  autoPlayAudio,
  playTargetWordAudioBeforeSentence,
}: UseFlashcardAudioProps) {
  const [playSlow, setPlaySlow] = useState(false);
  const playSlowRef = useRef(playSlow);
  const lastSpokenCardId = useRef<string | null>(null);

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
    const cleanText = text.replace(/<\/?b>/g, "");
    const segments = parseFurigana(cleanText);
    return segments.map((s) => s.text).join("");
  }, []);

  const speak = useCallback(
    async (options?: { isAutoplay?: boolean }) => {
      let effectiveRate: number;

      if (options?.isAutoplay) {
        effectiveRate = tts.rate;
        
        setPlaySlow(true);
      } else {
        effectiveRate = playSlowRef.current
          ? Math.max(0.25, tts.rate * 0.6)
          : tts.rate;
        setPlaySlow((prev) => !prev);
      }

      const effectiveSettings = { ...tts, rate: effectiveRate };

      try {
        if (playTargetWordAudioBeforeSentence && card.targetWord) {
          const wordText = getPlainTextForTTS(card.targetWord);
          await ttsService.speak(wordText, language, effectiveSettings);
        }

        const plainText = getPlainTextForTTS(card.targetSentence);
        await ttsService.speak(plainText, language, effectiveSettings);
      } catch (err) {
        console.error("TTS speak error:", err);
      }
    },
    [
      card.targetSentence,
      card.targetWord,
      language,
      tts,
      getPlainTextForTTS,
      playTargetWordAudioBeforeSentence,
    ],
  );

  useEffect(() => {
    if (autoPlayAudio && isFlipped && lastSpokenCardId.current !== card.id) {
      speak({ isAutoplay: true });
      lastSpokenCardId.current = card.id;
    }
  }, [card.id, autoPlayAudio, isFlipped, speak]);

  return { speak, playSlow };
}
