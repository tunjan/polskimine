import { Language, TTSSettings, TTSProvider } from "@/types";
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const LANG_CODE_MAP: Record<Language, string[]> = {
    polish: ['pl-PL', 'pl'],
    norwegian: ['nb-NO', 'no-NO', 'no'],
    japanese: ['ja-JP', 'ja'],
    spanish: ['es-ES', 'es-MX', 'es']
};

export interface VoiceOption {
    id: string;
    name: string;
    lang: string;
    provider: TTSProvider;
}

class TTSService {
    private browserVoices: SpeechSynthesisVoice[] = [];
    private audioContext: AudioContext | null = null;
    private currentSource: AudioBufferSourceNode | null = null;
    private currentOperationId = 0;
    private abortController: AbortController | null = null;

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.updateVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                this.updateVoices();
            };
        }
    }

    private updateVoices() {
        this.browserVoices = window.speechSynthesis.getVoices();
    }
    
    dispose() {
        this.stop();
        if (this.audioContext) {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
        }
    }

    async getAvailableVoices(language: Language, settings: TTSSettings): Promise<VoiceOption[]> {
        const validCodes = LANG_CODE_MAP[language];
        
        // NATIVE: Plugin handles voices differently, usually we just let OS pick default for locale
        // but we can query if needed. For now, we return browser voices for UI consistency
        // or empty if strictly native.
        if (Capacitor.isNativePlatform() && settings.provider === 'browser') {
             try {
                const { languages } = await TextToSpeech.getSupportedLanguages();
                // We just return a generic "System Voice" for the native side to avoid UI confusion
                // as mapping native voice IDs to the dropdown is complex across iOS/Android
                return [{
                    id: 'default',
                    name: 'System Default',
                    lang: validCodes[0],
                    provider: 'browser'
                }];
             } catch (e) {
                 return [];
             }
        }

        if (settings.provider === 'browser') {
            return this.browserVoices
                .filter(v => validCodes.some(code => v.lang.toLowerCase().startsWith(code.toLowerCase())))
                .map(v => ({
                    id: v.voiceURI,
                    name: v.name,
                    lang: v.lang,
                    provider: 'browser'
                }));
        }

        // ... Google / Azure logic remains the same ...
        if (settings.provider === 'google' && settings.googleApiKey) {
            try {
                const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${settings.googleApiKey}`);
                const data = await response.json();
                if (data.voices) {
                    return data.voices
                        .filter((v: any) => validCodes.some(code => v.languageCodes.some((lc: string) => lc.toLowerCase().startsWith(code.toLowerCase()))))
                        .map((v: any) => ({
                            id: v.name,
                            name: `${v.name} (${v.ssmlGender})`,
                            lang: v.languageCodes[0],
                            provider: 'google'
                        }));
                }
            } catch (e) {
                console.error("Failed to fetch Google voices", e);
            }
        }

        if (settings.provider === 'azure' && settings.azureApiKey && settings.azureRegion) {
            try {
                const response = await fetch(`https://${settings.azureRegion}.tts.speech.microsoft.com/cognitiveservices/voices/list`, {
                    headers: {
                        'Ocp-Apim-Subscription-Key': settings.azureApiKey
                    }
                });
                const data = await response.json();
                return data
                    .filter((v: any) => validCodes.some(code => v.Locale.toLowerCase().startsWith(code.toLowerCase())))
                    .map((v: any) => ({
                        id: v.ShortName,
                        name: `${v.LocalName} (${v.ShortName})`,
                        lang: v.Locale,
                        provider: 'azure'
                    }));
            } catch (e) {
                console.error("Failed to fetch Azure voices", e);
            }
        }

        return [];
    }

    async speak(text: string, language: Language, settings: TTSSettings) {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.stop();
        const opId = ++this.currentOperationId;
        this.abortController = new AbortController();

        if (settings.provider === 'browser') {
            await this.speakBrowser(text, language, settings);
        } else if (settings.provider === 'google') {
            await this.speakGoogle(text, language, settings, opId);
        } else if (settings.provider === 'azure') {
            await this.speakAzure(text, language, settings, opId);
        }
    }

    private async speakBrowser(text: string, language: Language, settings: TTSSettings) {
        // --- NATIVE MOBILE FIX ---
        if (Capacitor.isNativePlatform()) {
            try {
                await TextToSpeech.speak({
                    text,
                    lang: LANG_CODE_MAP[language][0], // e.g. 'pl-PL'
                    rate: settings.rate,
                    pitch: settings.pitch,
                    volume: settings.volume,
                    category: 'ambient',
                });
            } catch (e) {
                console.error("Native TTS failed", e);
            }
            return;
        }
        // -------------------------

        // Web Fallback
        if (!('speechSynthesis' in window)) return;

        // --- CHROME BUG FIX ---
        // Chrome has a bug where speechSynthesis stops working after ~4-5 utterances
        // due to a queue overflow. Canceling and adding a small delay helps reset the queue.
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LANG_CODE_MAP[language][0];
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;

        if (settings.voiceURI && settings.voiceURI !== 'default') {
            const selectedVoice = this.browserVoices.find(v => v.voiceURI === settings.voiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }

        // Chrome workaround: Resume speech synthesis if it gets paused/stuck
        // This handles another Chrome bug where synth pauses itself after ~15s
        let resumeInterval: ReturnType<typeof setInterval> | null = null;
        
        utterance.onstart = () => {
            resumeInterval = setInterval(() => {
                if (!window.speechSynthesis.speaking) {
                    if (resumeInterval) clearInterval(resumeInterval);
                } else if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
            }, 10000);
        };

        utterance.onend = () => {
            if (resumeInterval) clearInterval(resumeInterval);
        };

        utterance.onerror = (event) => {
            if (resumeInterval) clearInterval(resumeInterval);
            // Don't log 'interrupted' errors as they're expected when canceling
            if (event.error !== 'interrupted') {
                console.error("Speech synthesis error:", event.error);
            }
        };

        // Small timeout to ensure cancel() completes before speak()
        // This is a workaround for Chrome's speechSynthesis bug
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 50);
    }

    private async speakGoogle(text: string, language: Language, settings: TTSSettings, opId: number) {
        try {
            // Prepare the payload matching what Google expects
            const payload = {
                text,
                apiKey: settings.googleApiKey, // If undefined, backend uses Deno.env.get('GOOGLE_TTS_API_KEY')
                voice: settings.voiceURI 
                    ? { name: settings.voiceURI, languageCode: LANG_CODE_MAP[language][0] } 
                    : { languageCode: LANG_CODE_MAP[language][0] },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: settings.rate,
                    pitch: (settings.pitch - 1) * 20,
                    volumeGainDb: (settings.volume - 1) * 16
                }
            };

            // Call Supabase Edge Function instead of direct fetch
            const { data, error } = await supabase.functions.invoke('text-to-speech', {
                body: payload
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);
            
            if (this.currentOperationId !== opId) return;
            
            if (data.audioContent) {
                this.playAudioContent(data.audioContent, opId);
            }
        } catch (e: any) {
            if (e?.name === 'AbortError') return;
            console.error("Google TTS error", e);
            toast.error(`Google TTS Error: ${e.message}`);
        }
    }

    private async speakAzure(text: string, language: Language, settings: TTSSettings, opId: number) {
        if (!settings.azureApiKey || !settings.azureRegion) return;

        try {
            const voiceName = settings.voiceURI || 'en-US-JennyNeural'; 
            
            const ssml = `
                <speak version='1.0' xml:lang='${LANG_CODE_MAP[language][0]}'>
                    <voice xml:lang='${LANG_CODE_MAP[language][0]}' xml:gender='Female' name='${voiceName}'>
                        <prosody rate='${settings.rate}' pitch='${(settings.pitch - 1) * 50}%' volume='${settings.volume * 100}'>
                            ${text}
                        </prosody>
                    </voice>
                </speak>
            `;

            const response = await fetch(`https://${settings.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': settings.azureApiKey,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                    'User-Agent': 'LinguaFlow'
                },
                signal: this.abortController?.signal,
                body: ssml
            });

            if (!response.ok) throw new Error(await response.text());
            if (this.currentOperationId !== opId) return;

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            this.playAudioBuffer(arrayBuffer, opId);

        } catch (e: any) {
            if (e?.name === 'AbortError') return;
            console.error("Azure TTS error", e);
        }
    }

    private playAudioContent(base64Audio: string, opId: number) {
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        this.playAudioBuffer(bytes.buffer, opId);
    }

    private async playAudioBuffer(buffer: ArrayBuffer, opId: number) {
        try {
            // Create a fresh AudioContext for each playback to avoid Firefox issues
            // Firefox has strict autoplay policies and suspended contexts don't always resume properly
            if (this.audioContext) {
                try {
                    await this.audioContext.close();
                } catch {}
            }
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Firefox requires the context to be in 'running' state
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const decodedBuffer = await this.audioContext.decodeAudioData(buffer.slice(0));
            if (this.currentOperationId !== opId) return;

            if (this.currentSource) {
                try { this.currentSource.stop(); } catch {}
            }
            
            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = decodedBuffer;
            this.currentSource.connect(this.audioContext.destination);
            
            // Don't suspend the context on ended - this causes issues in Firefox
            this.currentSource.onended = () => {
                this.currentSource = null;
            };

            this.currentSource.start(0);
        } catch (e) {
            console.error("Audio playback error", e);
        }
    }

    async stop() {
        this.currentOperationId++;
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        // Native Stop
        if (Capacitor.isNativePlatform()) {
            try {
                await TextToSpeech.stop();
            } catch (e) {}
        }

        // Web Stop
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (this.currentSource) {
            try { this.currentSource.stop(); } catch {}
            this.currentSource = null;
        }
    }
}

export const ttsService = new TTSService();