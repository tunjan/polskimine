import { Language, TTSSettings, TTSProvider } from "@/types";

// Map app language codes to BCP 47 language tags
const LANG_CODE_MAP: Record<Language, string[]> = {
    polish: ['pl-PL', 'pl'],
    norwegian: ['nb-NO', 'no-NO', 'no'],
    japanese: ['ja-JP', 'ja']
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

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            // Initialize voices
            this.updateVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                this.updateVoices();
            };
        }
    }

    private updateVoices() {
        this.browserVoices = window.speechSynthesis.getVoices();
    }

    /**
     * Get all available voices, optionally filtered by the app's target language
     */
    async getAvailableVoices(language: Language, settings: TTSSettings): Promise<VoiceOption[]> {
        const validCodes = LANG_CODE_MAP[language];
        
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
        this.stop();

        if (settings.provider === 'browser') {
            this.speakBrowser(text, language, settings);
        } else if (settings.provider === 'google') {
            await this.speakGoogle(text, language, settings);
        } else if (settings.provider === 'azure') {
            await this.speakAzure(text, language, settings);
        }
    }

    private speakBrowser(text: string, language: Language, settings: TTSSettings) {
        if (!('speechSynthesis' in window)) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LANG_CODE_MAP[language][0];
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;

        if (settings.voiceURI) {
            const selectedVoice = this.browserVoices.find(v => v.voiceURI === settings.voiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        } 

        window.speechSynthesis.speak(utterance);
    }

    private async speakGoogle(text: string, language: Language, settings: TTSSettings) {
        if (!settings.googleApiKey) return;

        try {
            const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${settings.googleApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text },
                    voice: settings.voiceURI ? { name: settings.voiceURI, languageCode: LANG_CODE_MAP[language][0] } : { languageCode: LANG_CODE_MAP[language][0] },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        speakingRate: settings.rate,
                        pitch: (settings.pitch - 1) * 20, // Google pitch is -20.0 to 20.0, app is 0 to 2
                        volumeGainDb: (settings.volume - 1) * 16 // Approx mapping
                    }
                })
            });

            const data = await response.json();
            if (data.audioContent) {
                this.playAudioContent(data.audioContent);
            }
        } catch (e) {
            console.error("Google TTS error", e);
        }
    }

    private async speakAzure(text: string, language: Language, settings: TTSSettings) {
        if (!settings.azureApiKey || !settings.azureRegion) return;

        try {
            const voiceName = settings.voiceURI || 'en-US-JennyNeural'; // Fallback needs to be smarter per lang, but voiceURI should be set
            
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
                body: ssml
            });

            if (!response.ok) throw new Error(await response.text());

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            this.playAudioBuffer(arrayBuffer);

        } catch (e) {
            console.error("Azure TTS error", e);
        }
    }

    private playAudioContent(base64Audio: string) {
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        this.playAudioBuffer(bytes.buffer);
    }

    private async playAudioBuffer(buffer: ArrayBuffer) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        try {
            const decodedBuffer = await this.audioContext.decodeAudioData(buffer);
            if (this.currentSource) {
                this.currentSource.stop();
            }
            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = decodedBuffer;
            this.currentSource.connect(this.audioContext.destination);
            this.currentSource.start(0);
        } catch (e) {
            console.error("Audio playback error", e);
        }
    }

    stop() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource = null;
        }
    }
}

export const ttsService = new TTSService();