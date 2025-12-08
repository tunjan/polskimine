# check_fsrs.ts

```typescript
import * as fsrs from 'ts-fsrs';

```

# src/App.tsx

```typescript
import React from 'react';
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading";
import { AppProviders } from '@/app/AppProviders';
import { AppRouter } from '@/app/AppRouter';
import { usePlatformSetup } from '@/hooks/usePlatformSetup';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/features/auth/AuthPage';
import { UsernameSetup } from '@/features/auth/UsernameSetup';
import { OnboardingFlow } from '@/features/auth/OnboardingFlow';

const AppContent: React.FC = () => {
  usePlatformSetup();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const loading = authLoading || profileLoading;

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-sans text-muted-foreground">Profile not found.</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs font-sans uppercase tracking-widest text-primary"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!profile.username) {
    return <UsernameSetup />;
  }

  if (!profile.initial_deck_generated) {
    return <OnboardingFlow />;
  }

  return <AppRouter />;
};

const App: React.FC = () => {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

export default App;


```

# src/app/AppProviders.tsx

```typescript
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';


import { DeckActionsProvider } from '@/contexts/DeckActionsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { MusicProvider } from '@/contexts/MusicContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { GamificationProvider } from '@/contexts/GamificationContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SettingsSync } from '@/features/settings/components/SettingsSync';

const queryClient = new QueryClient();

const TOAST_OPTIONS = {

};

interface AppProvidersProps {
    children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="light" storageKey="languagemine-theme">
                <ErrorBoundary>
                    <AuthProvider>
                        <SettingsSync />
                        <GamificationProvider>
                            <DeckActionsProvider>
                                <MusicProvider>
                                    <BrowserRouter>
                                        {children}
                                        <Toaster position="bottom-right" expand={true} />
                                    </BrowserRouter>
                                </MusicProvider>
                            </DeckActionsProvider>
                        </GamificationProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

```

# src/app/AppRouter.tsx

```typescript
import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { LanguageThemeManager } from '@/components/common/LanguageThemeManager';
import { AppRoutes } from '@/router';

export const AppRouter: React.FC = () => {
    return (
        <>
            <LanguageThemeManager />
            <Layout>
                <AppRoutes />
            </Layout>
        </>
    );
};

```

# src/assets/starter-decks/german.ts

```typescript
import { Card } from '@/types';
import { createGermanCard as createCard } from '@/features/collection/utils/createCard';

export const GERMAN_BEGINNER_DECK: Card[] = [
    // Greetings & Politeness
    createCard("Guten Morgen, einen Kaffee bitte.", "Good morning, a coffee please.", "bitte", "Polite request word.", "please", "adverb"),
    createCard("Danke schön.", "Thank you very much.", "Danke", "", "thanks", "interjection"),
    createCard("Ich verstehe nicht.", "I don't understand.", "verstehe", "Verb: verstehen.", "understand", "verb"),
    createCard("Entschuldigung, wo ist die Toilette?", "Excuse me, where is the toilet?", "wo", "", "where", "adverb"),
    createCard("Sprechen Sie Englisch?", "Do you speak English?", "Sprechen", "Formal form.", "speak", "verb"),
    createCard("Hallo, wie geht's?", "Hi, how are you?", "Hallo", "Informal greeting.", "hello", "interjection"),
    createCard("Gute Nacht.", "Good night.", "Nacht", "", "night", "noun"),
    createCard("Auf Wiedersehen.", "Goodbye.", "Wiedersehen", "Formal.", "goodbye", "interjection"),
    createCard("Bitte schön.", "You're welcome / Here you go.", "Bitte", "", "please", "interjection"),
    createCard("Ja, bitte.", "Yes, please.", "Ja", "", "yes", "adverb"),
    createCard("Nein, danke.", "No, thank you.", "Nein", "", "no", "adverb"),

    // Being & State
    createCard("Ich bin müde.", "I am tired.", "bin", "", "am", "verb"),
    createCard("Sie ist sehr nett.", "She is very nice.", "ist", "", "is", "verb"),
    createCard("Das ist mein Haus.", "This is my house.", "Das", "Demonstrative pronoun.", "this/that", "pronoun"),
    createCard("Wir sind bei der Arbeit.", "We are at work.", "Arbeit", "", "work", "noun"),
    createCard("Wo sind sie?", "Where are they?", "sind", "", "are", "verb"),
    createCard("Bist du hungrig?", "Are you hungry?", "bist", "Informal form.", "are", "verb"),
    createCard("Ich war gestern dort.", "I was there yesterday.", "war", "Past tense.", "was", "verb"),

    // Having
    createCard("Ich habe eine Frage.", "I have a question.", "habe", "", "have", "verb"),
    createCard("Ich habe keine Zeit.", "I don't have time.", "Zeit", "", "time", "noun"),
    createCard("Hast du Lust auf ein Bier?", "Do you feel like having a beer?", "Lust", "Idiom: Lust haben auf...", "desire", "noun"),
    createCard("Er hat kein Geld.", "He doesn't have money.", "Geld", "", "money", "noun"),
    createCard("Wir haben ein neues Auto.", "We have a new car.", "haben", "", "have", "verb"),

    // Common Actions
    createCard("Was machst du?", "What are you doing?", "machst", "", "do/make", "verb"),
    createCard("Ich gehe zum Laden.", "I am going to the store.", "gehe", "Directional movement.", "go", "verb"),
    createCard("Ich möchte Brot kaufen.", "I want to buy bread.", "möchte", "Modal verb: mögen (conditional).", "would like", "verb"),
    createCard("Ich lese gern Bücher.", "I like reading books.", "gern", "", "gladly/like", "adverb"),
    createCard("Ich muss jetzt gehen.", "I have to go now.", "muss", "Modal verb: müssen.", "must", "verb"),
    createCard("Weißt du, worum es geht?", "Do you know what it's about?", "Weißt", "", "know", "verb"),
    createCard("Kann ich dir helfen?", "Can I help you?", "helfen", "Takes dative case.", "help", "verb"),
    createCard("Ich denke, ja.", "I think so.", "denke", "", "think", "verb"),
    createCard("Ich weiß nicht.", "I don't know.", "weiß", "", "know", "verb"),
    createCard("Ich mache Mittagessen.", "I am making lunch.", "mache", "", "make", "verb"),
    createCard("Nimm das.", "Take this.", "Nimm", "Imperative.", "take", "verb"),
    createCard("Gib mir das.", "Give me that.", "Gib", "Imperative.", "give", "verb"),
    createCard("Ich sehe dich.", "I see you.", "sehe", "", "see", "verb"),
    createCard("Hörst du mich?", "Do you hear me?", "Hörst", "", "hear", "verb"),

    // Questions
    createCard("Wer ist das?", "Who is this?", "Wer", "", "who", "pronoun"),
    createCard("Warum weinst du?", "Why are you crying?", "Warum", "", "why", "adverb"),
    createCard("Wann kommst du zurück?", "When are you coming back?", "Wann", "", "when", "adverb"),
    createCard("Wo wohnst du?", "Where do you live?", "wohnst", "", "live", "verb"),
    createCard("Wie heißt du?", "What is your name?", "heißt", "Literally: How are you called?", "called", "verb"),
    createCard("Was ist das?", "What is this?", "Was", "", "what", "pronoun"),
    createCard("Wie viel kostet das?", "How much does it cost?", "kostet", "", "costs", "verb"),

    // Common Phrases
    createCard("Alles in Ordnung?", "Is everything okay?", "Ordnung", "", "order", "noun"),
    createCard("Es ist nichts passiert.", "Nothing happened.", "nichts", "", "nothing", "pronoun"),
    createCard("Prost!", "Cheers!", "Prost", "", "cheers", "interjection"),
    createCard("Guten Appetit.", "Bon appétit.", "Appetit", "", "appetite", "noun"),
    createCard("Hilfe!", "Help!", "Hilfe", "", "help", "noun"),
    createCard("Ich habe mich verlaufen.", "I am lost.", "verlaufen", "Reflexive verb.", "lost", "verb"),
    createCard("Ich brauche einen Arzt.", "I need a doctor.", "brauche", "", "need", "verb"),

    // Adjectives & Descriptions
    createCard("Das Auto ist schnell.", "The car is fast.", "schnell", "", "fast", "adjective"),
    createCard("Das Wetter ist heute schön.", "The weather is nice today.", "schön", "", "nice/beautiful", "adjective"),
    createCard("Mir ist kalt.", "I am cold.", "kalt", "Literally: 'To me it is cold'.", "cold", "adjective"),
    createCard("Das ist zu teuer.", "This is too expensive.", "teuer", "", "expensive", "adjective"),
    createCard("Ich bin glücklich.", "I am happy.", "glücklich", "", "happy", "adjective"),
    createCard("Das ist schwierig.", "This is difficult.", "schwierig", "", "difficult", "adjective"),

    // Time & Place
    createCard("Ich wohne in Deutschland.", "I live in Germany.", "Deutschland", "", "Germany", "noun"),
    createCard("Wir sehen uns morgen.", "See you tomorrow.", "morgen", "", "tomorrow", "adverb"),
    createCard("Jetzt oder später?", "Now or later?", "Jetzt", "", "now", "adverb"),
    createCard("Es ist nah von hier.", "It is close from here.", "nah", "", "close/near", "adverb"),
    createCard("Das ist weit.", "It is far.", "weit", "", "far", "adverb")
];

```

# src/assets/starter-decks/index.ts

```typescript
export { POLISH_BEGINNER_DECK } from './polish';
export { NORWEGIAN_BEGINNER_DECK } from './norwegian';
export { JAPANESE_BEGINNER_DECK } from './japanese';
export { SPANISH_BEGINNER_DECK } from './spanish';
export { GERMAN_BEGINNER_DECK } from './german';

```

# src/assets/starter-decks/japanese.ts

```typescript
import { Card } from '@/types';
import { createJapaneseCard as createCard } from '@/features/collection/utils/createCard';

export const JAPANESE_BEGINNER_DECK: Card[] = [

  createCard("はじめまして、田中です。", "Nice to meet you, I am Tanaka.", "はじめまして", "", "はじめまして、 田中[たなか]です。"),
  createCard("よろしくお願いします。", "Please treat me well.", "願い", "Set phrase for introductions.", "よろしくお 願[ねが]いします。"),
  createCard("お元気ですか？", "How are you?", "元気", "", "お 元気[げんき]ですか？"),
  createCard("英語を話せますか？", "Can you speak English?", "話せます", "Potential form.", "英語[えいご]を 話[はな]せますか？"),
  createCard("日本語が少し分かります。", "I understand a little Japanese.", "分かります", "", "日本語[にほんご]が 少[すこ]し 分[わ]かります。"),
  createCard("おはようございます。", "Good morning.", "おはよう", "Polite.", "おはようございます。"),
  createCard("こんにちは。", "Hello / Good afternoon.", "こんにちは", "", "こんにちは。"),
  createCard("こんばんは。", "Good evening.", "こんばんは", "", "こんばんは。"),
  createCard("ありがとうございます。", "Thank you very much.", "ありがとう", "", "ありがとうございます。"),
  createCard("すみません。", "Excuse me / I'm sorry.", "すみません", "", "すみません。"),
  createCard("ごめんなさい。", "I am sorry.", "ごめんなさい", "", "ごめんなさい。"),


  createCard("これは何ですか？", "What is this?", "何", "", "これは 何[なん]ですか？"),
  createCard("それは私のペンです。", "That is my pen.", "私", "", "それは 私[わたし]のペンです。"),
  createCard("トイレはどこですか？", "Where is the toilet?", "どこ", "", "トイレはどこですか？"),
  createCard("駅はあそこです。", "The station is over there.", "駅", "", "駅[えき]はあそこです。"),
  createCard("私は学生です。", "I am a student.", "学生", "", "私[わたし]は 学生[がくせい]です。"),
  createCard("彼は先生ではありません。", "He is not a teacher.", "先生", "", "彼[かれ]は 先生[せんせい]ではありません。"),


  createCard("私は寿司を食べます。", "I eat sushi.", "食べます", "", "私[わたし]は 寿司[すし]を 食[た]べます。"),
  createCard("何を飲みますか？", "What will you drink?", "飲みます", "", "何[なに]を 飲[の]みますか？"),
  createCard("毎日、日本語を勉強します。", "I study Japanese every day.", "勉強", "", "毎日[まいにち]、 日本語[にほんご]を 勉強[べんきょう]します。"),
  createCard("テレビを見ました。", "I watched TV.", "見ました", "Past tense.", "テレビを 見[み]ました。"),
  createCard("音楽を聴きます。", "I listen to music.", "聴きます", "", "音楽[おんがく]を 聴[き]きます。"),
  createCard("新聞を読みます。", "I read the newspaper.", "読みます", "", "新聞[しんぶん]を 読[よ]みます。"),
  createCard("写真を撮ります。", "I take a photo.", "撮ります", "", "写真[しゃしん]を 撮[と]ります。"),
  createCard("手紙を書きます。", "I write a letter.", "書きます", "", "手紙[てがみ]を 書[か]きます。"),


  createCard("明日、東京に行きます。", "I will go to Tokyo tomorrow.", "行きます", "", "明日[あした]、 東京[とうきょう]に 行[い]きます。"),
  createCard("何時に帰りますか？", "What time will you go home?", "帰り", "", "何時[なんじ]に 帰[かえ]りますか？"),
  createCard("友達と来ました。", "I came with a friend.", "来ました", "", "友達[ともだち]と 来[き]ました。"),
  createCard("いつ日本に来ましたか？", "When did you come to Japan?", "いつ", "", "いつ 日本[にほん]に 来[き]ましたか？"),
  createCard("バスで学校へ行きます。", "I go to school by bus.", "学校", "", "バスで 学校[がっこう]へ 行[い]きます。"),


  createCard("猫がいます。", "There is a cat.", "います", "Used for living things.", "猫[ねこ]がいます。"),
  createCard("お金がありません。", "I don't have money.", "ありません", "Negative existence (inanimate).", "お 金[かね]がありません。"),
  createCard("コンビニがありますか？", "Is there a convenience store?", "あります", "", "コンビニがありますか？"),
  createCard("誰がいますか？", "Who is there?", "誰", "", "誰[だれ]がいますか？"),
  createCard("机の上に本があります。", "There is a book on the desk.", "机", "", "机[つくえ]の 上[うえ]に 本[ほん]があります。"),


  createCard("このラーメンは美味しいです。", "This ramen is delicious.", "美味しい", "", "このラーメンは 美味[おい]しいです。"),
  createCard("今日は暑いですね。", "It is hot today, isn't it?", "暑い", "", "今日[きょう]は 暑[あつ]いですね。"),
  createCard("日本の夏は蒸し暑いです。", "Japanese summers are humid.", "蒸し暑い", "", "日本[にほん]の 夏[なつ]は 蒸[む]し 暑[あつ]いです。"),
  createCard("それは面白そうですね。", "That looks interesting.", "面白", "", "それは 面白[おもしろ]そうですね。"),
  createCard("この部屋は広いです。", "This room is spacious.", "広い", "", "この 部屋[へや]は 広[ひろ]いです。"),
  createCard("あの映画はつまらないです。", "That movie is boring.", "つまらない", "", "あの 映画[えいが]はつまらないです。"),
  createCard("忙しいですか？", "Are you busy?", "忙しい", "", "忙[いそが]しいですか？"),


  createCard("これをください。", "Please give me this.", "ください", "", "これをください。"),
  createCard("ちょっと待ってください。", "Please wait a moment.", "待って", "Te-form + kudasai.", "ちょっと 待[ま]ってください。"),
  createCard("もう一度言ってください。", "Please say it one more time.", "言って", "", "もう 一度[いちど] 言[い]ってください。"),
  createCard("手伝ってもらえますか？", "Could you help me?", "手伝って", "", "手伝[てつだ]ってもらえますか？"),
  createCard("助けて！", "Help!", "助けて", "", "助[たす]けて！"),
  createCard("分かりません。", "I don't understand.", "分かり", "", "分[わ]かりません。"),
  createCard("お腹が空きました。", "I am hungry.", "空き", "", "お 腹[なか]が 空[す]きました。")
];


```

# src/assets/starter-decks/norwegian.ts

```typescript
import { Card } from '@/types';
import { createNorwegianCard as createCard } from '@/features/collection/utils/createCard';

export const NORWEGIAN_BEGINNER_DECK: Card[] = [

  createCard("Hei, hvordan går det?", "Hi, how is it going?", "Hei", "Common informal greeting.", "hello", "interjection"),
  createCard("God morgen.", "Good morning.", "morgen", "", "morning", "noun"),
  createCard("Takk skal du ha.", "Thank you.", "Takk", "Literally: Thanks shall you have.", "thank you", "interjection"),
  createCard("Unnskyld, jeg forstår ikke.", "Excuse me, I don't understand.", "forstår", "Verb: å forstå.", "I understand", "verb"),
  createCard("Snakker du engelsk?", "Do you speak English?", "Snakker", "", "you speak", "verb"),
  createCard("Ha det bra!", "Goodbye!", "Ha", "Literally: Have it good.", "have/say", "verb"),
  createCard("Vær så snill.", "Please.", "snill", "Literally: Be so kind.", "kind", "adjective"),
  createCard("Ja, gjerne.", "Yes, gladly / please.", "gjerne", "", "gladly", "adverb"),
  createCard("Nei, takk.", "No, thanks.", "Nei", "", "no", "adverb"),
  createCard("Hva heter du?", "What is your name?", "heter", "Verb: å hete (to be called).", "is called", "verb"),


  createCard("Jeg er trøtt.", "I am tired.", "er", "Verb: å være (to be).", "am", "verb"),
  createCard("Det er kaldt i dag.", "It is cold today.", "er", "", "is", "verb"),
  createCard("Hvor er toalettet?", "Where is the toilet?", "er", "", "is", "verb"),
  createCard("Vi er fra Norge.", "We are from Norway.", "er", "", "are", "verb"),
  createCard("Er du sulten?", "Are you hungry?", "Er", "", "are", "verb"),
  createCard("Det er min venn.", "That is my friend.", "er", "", "is", "verb"),
  createCard("Er det sant?", "Is that true?", "Er", "", "is", "verb"),


  createCard("Jeg har en bil.", "I have a car.", "har", "Verb: å ha (to have).", "have", "verb"),
  createCard("Har du tid?", "Do you have time?", "Har", "", "have", "verb"),
  createCard("Vi har ikke penger.", "We don't have money.", "har", "", "have", "verb"),
  createCard("Hun har lyst på kaffe.", "She wants coffee.", "lyst", "Idiom: Ha lyst på (want/crave).", "desire/crave", "noun"),
  createCard("Jeg har vondt i hodet.", "I have a headache.", "vondt", "Idiom: Ha vondt (have pain).", "pain", "noun"),


  createCard("Hva gjør du?", "What are you doing?", "gjør", "Verb: å gjøre (to do).", "you do", "verb"),
  createCard("Jeg går på jobb.", "I am going to work.", "går", "Verb: å gå (to go/walk).", "I go", "verb"),
  createCard("Kan du si det igjen?", "Can you say that again?", "si", "Verb: å si (to say).", "say", "verb"),
  createCard("Jeg vet ikke.", "I don't know.", "vet", "Verb: å vite (to know).", "I know", "verb"),
  createCard("Hva tenker du på?", "What are you thinking about?", "tenker", "Verb: å tenke (to think).", "you think", "verb"),
  createCard("Jeg tar bussen.", "I am taking the bus.", "tar", "Verb: å ta (to take).", "I take", "verb"),
  createCard("Kan jeg få en øl?", "Can I get a beer?", "få", "Verb: å få (to get/receive).", "get/receive", "verb"),
  createCard("Jeg liker å lese.", "I like to read.", "liker", "Verb: å like (to like).", "I like", "verb"),
  createCard("Vi må dra nå.", "We have to leave now.", "må", "Modal verb: måtte (must).", "must", "verb"),
  createCard("Jeg kommer snart.", "I am coming soon.", "kommer", "Verb: å komme (to come).", "I come", "verb"),
  createCard("Jeg ser deg.", "I see you.", "ser", "Verb: å se (to see).", "I see", "verb"),
  createCard("Hører du meg?", "Do you hear me?", "Hører", "Verb: å høre (to hear).", "you hear", "verb"),
  createCard("Jeg tror det.", "I think so / I believe so.", "tror", "Verb: å tro (to believe).", "I believe", "verb"),


  createCard("Hvem er det?", "Who is that?", "Hvem", "", "who", "pronoun"),
  createCard("Hva er dette?", "What is this?", "Hva", "", "what", "pronoun"),
  createCard("Hvor bor du?", "Where do you live?", "Hvor", "", "where", "adverb"),
  createCard("Når kommer toget?", "When is the train coming?", "Når", "", "when", "adverb"),
  createCard("Hvorfor gråter du?", "Why are you crying?", "Hvorfor", "", "why", "adverb"),
  createCard("Hvordan kommer jeg dit?", "How do I get there?", "Hvordan", "", "how", "adverb"),
  createCard("Hvilken liker du?", "Which one do you like?", "Hvilken", "", "which", "pronoun"),


  createCard("Hjelp!", "Help!", "Hjelp", "", "help", "noun"),
  createCard("Jeg trenger en lege.", "I need a doctor.", "trenger", "Verb: å trenge (to need).", "I need", "verb"),
  createCard("Hvor mye koster det?", "How much does it cost?", "koster", "", "costs", "verb"),
  createCard("Jeg elsker deg.", "I love you.", "elsker", "", "I love", "verb"),
  createCard("Bare hyggelig.", "You're welcome.", "hyggelig", "Response to thank you.", "pleasant", "adjective"),
  createCard("Unnskyld meg.", "Excuse me.", "Unnskyld", "", "excuse me", "interjection"),
  createCard("Jeg er enig.", "I agree.", "enig", "", "I agree", "verb"),
  createCard("Det går bra.", "It's going well / It's fine.", "går", "", "goes/is going", "verb"),


  createCard("Norge er et vakkert land.", "Norway is a beautiful country.", "vakkert", "", "beautiful", "adjective"),
  createCard("Det er veldig bra.", "That is very good.", "bra", "", "good", "adjective"),
  createCard("Jeg er glad.", "I am happy.", "glad", "", "happy", "adjective"),
  createCard("Det er vanskelig.", "It is difficult.", "vanskelig", "", "difficult", "adjective"),
  createCard("Maten er god.", "The food is good.", "god", "", "good", "adjective"),
  createCard("Jeg er opptatt.", "I am busy.", "opptatt", "", "busy", "adjective"),


  createCard("Vi ses i morgen.", "See you tomorrow.", "morgen", "", "tomorrow", "noun"),
  createCard("Nå eller aldri.", "Now or never.", "Nå", "", "now", "adverb"),
  createCard("Det er her.", "It is here.", "her", "", "here", "adverb"),
  createCard("Det er der borte.", "It is over there.", "der", "", "there", "adverb")
];


```

# src/assets/starter-decks/polish.ts

```typescript
import { Card } from '@/types';
import { createPolishCard as createCard } from '@/features/collection/utils/createCard';

export const POLISH_BEGINNER_DECK: Card[] = [

  createCard("Dzień dobry, poproszę kawę.", "Good morning, a coffee please.", "poproszę", "Polite way to ask for something.", "please", "adverb"),
  createCard("Dziękuję bardzo.", "Thank you very much.", "Dziękuję", "", "I thank", "verb"),
  createCard("Nie rozumiem.", "I don't understand.", "rozumiem", "Verb: rozumieć.", "I understand", "verb"),
  createCard("Przepraszam, gdzie jest toaleta?", "Excuse me, where is the toilet?", "gdzie", "", "where", "adverb"),
  createCard("Mówisz po angielsku?", "Do you speak English?", "Mówisz", "Informal singular.", "you speak", "verb"),
  createCard("Cześć, jak się masz?", "Hi, how are you?", "Cześć", "Informal greeting.", "hello", "interjection"),
  createCard("Dobranoc.", "Good night.", "Dobranoc", "", "good night", "interjection"),
  createCard("Do widzenia.", "Goodbye.", "widzenia", "Formal.", "goodbye", "interjection"),
  createCard("Proszę.", "Please / Here you go.", "Proszę", "", "please", "interjection"),
  createCard("Tak, poproszę.", "Yes, please.", "Tak", "", "yes", "adverb"),
  createCard("Nie, dziękuję.", "No, thank you.", "Nie", "", "no", "adverb"),


  createCard("Jestem zmęczony.", "I am tired (male).", "Jestem", "", "I am", "verb"),
  createCard("Ona jest bardzo miła.", "She is very nice.", "jest", "", "is", "verb"),
  createCard("To jest mój dom.", "This is my house.", "To", "Used as a pointer here.", "this/that", "pronoun"),
  createCard("Jesteśmy w pracy.", "We are at work.", "pracy", "Locative case of 'praca'.", "work", "noun"),
  createCard("Gdzie oni są?", "Where are they?", "są", "", "are", "verb"),
  createCard("Czy jesteś głodny?", "Are you hungry?", "jesteś", "", "you are", "verb"),
  createCard("Byłem tam wczoraj.", "I was there yesterday (male).", "Byłem", "Past tense.", "I was", "verb"),


  createCard("Mam pytanie.", "I have a question.", "Mam", "", "I have", "verb"),
  createCard("Nie mam czasu.", "I don't have time.", "czasu", "Genitive case of 'czas' (negation).", "time", "noun"),
  createCard("Masz ochotę na piwo?", "Do you feel like having a beer?", "ochotę", "Idiom: Mieć ochotę na...", "desire", "noun"),
  createCard("On nie ma pieniędzy.", "He doesn't have money.", "pieniędzy", "Genitive plural.", "money", "noun"),
  createCard("Mamy nowy samochód.", "We have a new car.", "Mamy", "", "we have", "verb"),


  createCard("Co robisz?", "What are you doing?", "robisz", "", "you do", "verb"),
  createCard("Idę do sklepu.", "I am going to the store.", "Idę", "Directional movement.", "I go", "verb"),
  createCard("Chcę kupić chleb.", "I want to buy bread.", "Chcę", "Verb: chcieć + infinitive.", "I want", "verb"),
  createCard("Lubię czytać książki.", "I like reading books.", "Lubię", "", "I like", "verb"),
  createCard("Muszę już iść.", "I have to go now.", "Muszę", "Modal verb: musieć.", "I must", "verb"),
  createCard("Wiesz, o co chodzi?", "Do you know what it's about?", "Wiesz", "Common phrase.", "you know", "verb"),
  createCard("Mogę ci pomóc?", "Can I help you?", "pomóc", "Takes dative case (ci).", "to help", "verb"),
  createCard("Myślę, że tak.", "I think so.", "Myślę", "", "I think", "verb"),
  createCard("Nie wiem.", "I don't know.", "wiem", "", "I know", "verb"),
  createCard("Robię obiad.", "I am making lunch.", "Robię", "", "I make", "verb"),
  createCard("Weź to.", "Take this.", "Weź", "Imperative.", "take", "verb"),
  createCard("Daj mi to.", "Give me that.", "Daj", "Imperative.", "give", "verb"),
  createCard("Widzę cię.", "I see you.", "Widzę", "", "I see", "verb"),
  createCard("Słyszysz mnie?", "Do you hear me?", "Słyszysz", "", "you hear", "verb"),


  createCard("Kto to jest?", "Who is this?", "Kto", "", "who", "pronoun"),
  createCard("Dlaczego płaczesz?", "Why are you crying?", "Dlaczego", "", "why", "adverb"),
  createCard("Kiedy wracasz?", "When are you coming back?", "Kiedy", "", "when", "adverb"),
  createCard("Gdzie mieszkasz?", "Where do you live?", "Gdzie", "", "where", "adverb"),
  createCard("Jak się nazywasz?", "What is your name?", "Jak", "Literally: How do you call yourself?", "how", "adverb"),
  createCard("Co to jest?", "What is this?", "Co", "", "what", "pronoun"),
  createCard("Ile to kosztuje?", "How much does it cost?", "Ile", "", "how much", "pronoun"),


  createCard("Wszystko w porządku?", "Is everything in order/okay?", "porządku", "", "order", "noun"),
  createCard("Nic się nie stało.", "Nothing happened.", "Nic", "Double negation is standard.", "nothing", "pronoun"),
  createCard("Na zdrowie!", "Cheers! / Bless you!", "zdrowie", "", "health", "noun"),
  createCard("Smacznego.", "Bon appétit.", "Smacznego", "", "tasty", "adjective"),
  createCard("Pomocy!", "Help!", "Pomocy", "", "help", "noun"),
  createCard("Zgubiłem się.", "I am lost (male).", "Zgubiłem", "", "I lost", "verb"),
  createCard("Potrzebuję lekarza.", "I need a doctor.", "Potrzebuję", "", "I need", "verb"),


  createCard("Ten samochód jest szybki.", "This car is fast.", "szybki", "", "fast", "adjective"),
  createCard("Pogoda jest dzisiaj ładna.", "The weather is nice today.", "ładna", "", "nice", "adjective"),
  createCard("Jest mi zimno.", "I am cold.", "zimno", "Literally: 'It is cold to me'.", "cold", "adjective"),
  createCard("To jest za drogie.", "This is too expensive.", "drogie", "", "expensive", "adjective"),
  createCard("Jestem szczęśliwy.", "I am happy (male).", "szczęśliwy", "", "happy", "adjective"),
  createCard("To jest trudne.", "This is difficult.", "trudne", "", "difficult", "adjective"),


  createCard("Mieszkam w Polsce.", "I live in Poland.", "Polsce", "Locative case.", "Poland", "noun"),
  createCard("Widzimy się jutro.", "See you tomorrow.", "jutro", "", "tomorrow", "noun"),
  createCard("Teraz czy później?", "Now or later?", "Teraz", "", "now", "adverb"),
  createCard("Jest blisko stąd.", "It is close to here.", "blisko", "", "close", "adverb"),
  createCard("To jest daleko.", "It is far.", "daleko", "", "far", "adverb")
];


```

# src/assets/starter-decks/spanish.ts

```typescript
import { Card } from '@/types';
import { createSpanishCard as createCard } from '@/features/collection/utils/createCard';

export const SPANISH_BEGINNER_DECK: Card[] = [

  createCard("Hola, ¿cómo estás?", "Hello, how are you?", "estás", "Informal 'you'."),
  createCard("Buenos días, mucho gusto.", "Good morning, nice to meet you.", "gusto", ""),
  createCard("Me llamo Sofía.", "My name is Sofia.", "llamo", "Reflexive: llamarse."),
  createCard("Por favor, una cerveza.", "One beer, please.", "cerveza", ""),
  createCard("Gracias por tu ayuda.", "Thanks for your help.", "ayuda", ""),
  createCard("De nada.", "You're welcome.", "nada", ""),
  createCard("Lo siento.", "I am sorry.", "siento", ""),
  createCard("Disculpe.", "Excuse me (formal).", "Disculpe", ""),
  createCard("No hablo español.", "I don't speak Spanish.", "hablo", ""),
  createCard("¿Hablas inglés?", "Do you speak English?", "Hablas", ""),


  createCard("Soy de España.", "I am from Spain.", "Soy", "Ser: Origin/Permanent."),
  createCard("Estoy cansado.", "I am tired.", "Estoy", "Estar: Condition/Temporary."),
  createCard("Ella es inteligente.", "She is intelligent.", "es", "Ser: Characteristic."),
  createCard("¿Dónde estás?", "Where are you?", "estás", "Estar: Location."),
  createCard("La fiesta es mañana.", "The party is tomorrow.", "es", "Ser: Time/Event."),
  createCard("Estamos listos.", "We are ready.", "Estamos", "Estar: Condition."),
  createCard("Eres mi mejor amigo.", "You are my best friend.", "Eres", "Ser: Relationship."),


  createCard("No entiendo español.", "I don't understand Spanish.", "entiendo", "Verb: entender (stem changing)."),
  createCard("Quiero comer tacos.", "I want to eat tacos.", "Quiero", "Verb: querer."),
  createCard("¿Puedes hablar más despacio?", "Can you speak more slowly?", "Puedes", "Verb: poder."),
  createCard("Tengo que irme.", "I have to leave.", "Tengo", "Tener que + infinitive = Have to."),
  createCard("Me gusta este lugar.", "I like this place.", "gusta", "Literally: This place pleases me."),
  createCard("Voy al supermercado.", "I am going to the supermarket.", "Voy", "Verb: ir."),
  createCard("Hago ejercicio todos los días.", "I do exercise every day.", "Hago", "Verb: hacer."),
  createCard("¿Qué haces?", "What are you doing?", "haces", ""),
  createCard("Dime la verdad.", "Tell me the truth.", "Dime", "Imperative of decir + me."),
  createCard("No sé.", "I don't know.", "sé", "Verb: saber."),
  createCard("Creo que sí.", "I think so.", "Creo", "Verb: creer."),
  createCard("Tomo un café.", "I take/drink a coffee.", "Tomo", "Verb: tomar."),


  createCard("¿Qué hora es?", "What time is it?", "hora", ""),
  createCard("¿Dónde está el baño?", "Where is the bathroom?", "baño", ""),
  createCard("¿Cuánto cuesta esto?", "How much does this cost?", "cuesta", ""),
  createCard("Vamos a la playa.", "Let's go to the beach.", "playa", ""),
  createCard("La cuenta, por favor.", "The check, please.", "cuenta", ""),
  createCard("¿Quién es él?", "Who is he?", "Quién", ""),
  createCard("¿Por qué preguntas?", "Why do you ask?", "Por", ""),
  createCard("¿Cuándo llegas?", "When do you arrive?", "Cuándo", ""),
  createCard("¿Cómo te llamas?", "What is your name?", "llamas", ""),


  createCard("¡Ayuda!", "Help!", "Ayuda", ""),
  createCard("Necesito un médico.", "I need a doctor.", "Necesito", ""),
  createCard("Estoy perdido.", "I am lost (male).", "perdido", ""),
  createCard("¡Salud!", "Cheers! / Bless you!", "Salud", ""),
  createCard("Buen provecho.", "Bon appétit.", "provecho", ""),
  createCard("Tengo hambre.", "I am hungry.", "hambre", "Literally: I have hunger."),
  createCard("Tengo sed.", "I am thirsty.", "sed", "Literally: I have thirst."),
  createCard("Hace calor.", "It is hot.", "calor", "Literally: It makes heat."),
  createCard("Hace frío.", "It is cold.", "frío", "Literally: It makes cold."),


  createCard("Es muy bonito.", "It is very pretty.", "bonito", ""),
  createCard("Es difícil.", "It is difficult.", "difícil", ""),
  createCard("Es fácil.", "It is easy.", "fácil", ""),
  createCard("El coche es rojo.", "The car is red.", "rojo", ""),
  createCard("La casa es grande.", "The house is big.", "grande", "")
];


```

# src/components/common/ErrorBoundary.tsx

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

```

# src/components/common/LanguageThemeManager.tsx

```typescript
import React, { useLayoutEffect } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';

const STYLE_TAG_ID = 'custom-language-theme';

export const LanguageThemeManager: React.FC = () => {
  const settings = useSettingsStore(s => s.settings);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const previousLanguage = root.getAttribute('data-language');
    if (previousLanguage && previousLanguage !== settings.language) {
      root.removeAttribute('data-language');
    }

    if (!settings.language) return;

    root.setAttribute('data-language', settings.language);

    const customColor = settings.languageColors?.[settings.language];
    let styleTag = document.getElementById(STYLE_TAG_ID);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = STYLE_TAG_ID;
      document.head.appendChild(styleTag);
    }

    if (customColor && typeof customColor === 'string') {
      if (!/^[0-9\s.%]+$/.test(customColor)) {
        styleTag.innerHTML = '';
        return;
      }
      const [h, s, l] = customColor.split(' ').map(v => parseFloat(v));
      const normalizedH = Number.isNaN(h) ? 0 : h;
      const normalizedS = Number.isNaN(s) ? 100 : s;
      const normalizedL = Number.isNaN(l) ? 50 : l;
      const darkL = normalizedL < 50 ? Math.min(normalizedL + 30, 90) : Math.max(normalizedL - 10, 60);
      const darkColor = `${normalizedH} ${normalizedS}% ${darkL}%`;

      styleTag.innerHTML = `
        :root[data-language="${settings.language}"] {
          --primary: hsl(${customColor});
          --ring: hsl(${customColor});
        }
        :root[data-language="${settings.language}"].dark {
          --primary: hsl(${darkColor});
          --ring: hsl(${darkColor});
        }
      `;
    } else {
      styleTag.innerHTML = '';
    }


    return () => {
      root.removeAttribute('data-language');
      const existingStyleTag = document.getElementById(STYLE_TAG_ID);
      if (existingStyleTag) {
        existingStyleTag.remove();
      }
    };
  }, [settings.language, settings.languageColors]);

  return null;
};

```

# src/components/layout/Layout.tsx

```typescript
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  List as ListIcon,
  Settings,
  LogOut,
  Plus,
  Zap,
  ChevronUp,
  Save,
  Download
} from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useCardOperations } from '@/features/collection/hooks/useCardOperations';
import { AddCardModal } from '@/features/collection/components/AddCardModal';

import { CramModal } from '@/features/study/components/CramModal';
import { LanguageId } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PolishFlag, NorwegianFlag, JapaneseFlag, SpanishFlag, GermanFlag } from '@/components/ui/flags';
import { toast } from 'sonner';
import { useSyncthingSync } from '@/features/settings/hooks/useSyncthingSync';

interface NavActionProps {
  onOpenAdd: () => void;
  onOpenCram: () => void;
  onSyncSave: () => void;
  onSyncLoad: () => void;
  isSyncing: boolean;
  isSyncingLoad: boolean;
  onCloseMobileMenu?: () => void;
}

const AppSidebar: React.FC<NavActionProps> = ({
  onOpenAdd,
  onOpenCram,
  onSyncSave,
  onSyncLoad,
  isSyncing,
  isSyncingLoad,
  onCloseMobileMenu
}) => {
  const location = useLocation();
  const settings = useSettingsStore(s => s.settings);
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const { signOut } = useAuth();
  const { profile } = useProfile();

  const languages = [
    { code: LanguageId.Polish, name: 'Polish', Flag: PolishFlag },
    { code: LanguageId.Norwegian, name: 'Norwegian', Flag: NorwegianFlag },
    { code: LanguageId.Japanese, name: 'Japanese', Flag: JapaneseFlag },
    { code: LanguageId.Spanish, name: 'Spanish', Flag: SpanishFlag },
    { code: LanguageId.German, name: 'German', Flag: GermanFlag },
  ] as const;

  const currentLanguage = languages.find(lang => lang.code === settings.language) || languages[0];

  const mainNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Overview' },
    { to: '/cards', icon: ListIcon, label: 'Index' },
    { to: '/study', icon: GraduationCap, label: 'Study' },
  ];

  const toolItems = [
    { icon: Plus, label: 'Add Entry', onClick: () => { onOpenAdd(); onCloseMobileMenu?.(); } },
    { icon: Zap, label: 'Cram Mode', onClick: () => { onOpenCram(); onCloseMobileMenu?.(); } },
    { icon: Save, label: isSyncing ? 'Saving...' : 'Save Changes', onClick: () => { if (!isSyncing) { onSyncSave(); } }, disabled: isSyncing },
    { icon: Download, label: isSyncingLoad ? 'Loading...' : 'Import Changes', onClick: () => { if (!isSyncingLoad) { onSyncLoad(); } }, disabled: isSyncingLoad },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LinguaFlow</span>
                  <span className="truncate text-xs">Sentence Miner</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    onClick={onCloseMobileMenu}
                    tooltip={item.label}
                  >
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-primary data-[state=open]:text-sidebar-primary-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground">
                    <currentLanguage.Flag className="w-full h-full object-cover rounded-sm" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{currentLanguage.name}</span>
                    <span className="truncate text-xs">Change Language</span>
                  </div>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      updateSettings({ language: lang.code });
                      toast.success(`Switched to ${lang.name}`);
                      onCloseMobileMenu?.();
                    }}
                    className="gap-2"
                  >
                    <lang.Flag className="w-4 h-3 rounded-[1px] border border-border/30" />
                    <span>{lang.name}</span>
                    {settings.language === lang.code && (
                      <span className="ml-auto text-xs text-muted-foreground">Active</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          <SidebarSeparator />

          {profile && (
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className='font-bold'>{profile.username?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{profile.username}</span>
                  <span className="truncate text-xs">Free Plan</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => { signOut(); onCloseMobileMenu?.(); }}>
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings" onClick={onCloseMobileMenu}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addCard } = useCardOperations();
  const location = useLocation();
  const { saveToSyncFile, loadFromSyncFile, isSaving: isSyncing, isLoading: isSyncingLoad } = useSyncthingSync();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCramModalOpen, setIsCramModalOpen] = useState(false);

  const isStudyMode = location.pathname === '/study';

  const sidebarProps: NavActionProps = {
    onOpenAdd: () => setIsAddModalOpen(true),
    onOpenCram: () => setIsCramModalOpen(true),
    onSyncSave: saveToSyncFile,
    onSyncLoad: loadFromSyncFile,
    isSyncing,
    isSyncingLoad,
  };

  if (isStudyMode) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        <main className="min-h-screen p-0">
          {children}
        </main>
        <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addCard} />
        <CramModal isOpen={isCramModalOpen} onClose={() => setIsCramModalOpen(false)} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar {...sidebarProps} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="flex-1 flex flex-col p-4 pt-0">
          <div className="min-h-screen flex-1 rounded-xl md:min-h-min md:flex-col overflow-y-auto">
            {children}
          </div>
        </div>
      </SidebarInset>

      <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addCard} />
      <CramModal isOpen={isCramModalOpen} onClose={() => setIsCramModalOpen(false)} />
    </SidebarProvider>
  );
};


```

# src/components/ui/accordion.tsx

```typescript
import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

```

# src/components/ui/alert-dialog.tsx

```typescript
import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}

```

# src/components/ui/alert.tsx

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }

```

# src/components/ui/aspect-ratio.tsx

```typescript
"use client"

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }

```

# src/components/ui/avatar.tsx

```typescript
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }

```

# src/components/ui/badge.tsx

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

```

# src/components/ui/breadcrumb.tsx

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  )
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

```

# src/components/ui/button-group.tsx

```typescript
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const buttonGroupVariants = cva(
  "flex w-fit items-stretch [&>*]:focus-visible:z-10 [&>*]:focus-visible:relative [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      className={cn(
        "bg-muted flex items-center gap-2 rounded-md border px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "bg-input relative !m-0 self-stretch data-[orientation=vertical]:h-auto",
        className
      )}
      {...props}
    />
  )
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
}

```

# src/components/ui/button.tsx

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

```

# src/components/ui/calendar.tsx

```typescript
"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-popover inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-muted-foreground",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
            : "[&:first-child[data-selected=true]_button]:rounded-l-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }

```

# src/components/ui/card.tsx

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

```

# src/components/ui/carousel.tsx

```typescript
import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        scrollNext()
      }
    },
    [scrollPrev, scrollNext]
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)

    return () => {
      api?.off("select", onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div
      ref={carouselRef}
      className="overflow-hidden"
      data-slot="carousel-content"
    >
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel()

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}

```

# src/components/ui/chart.tsx

```typescript
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  }) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === "string"
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div
      className={cn(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> &
  Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
    hideIcon?: boolean
    nameKey?: string
  }) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}

```

# src/components/ui/checkbox.tsx

```typescript
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }

```

# src/components/ui/collapsible.tsx

```typescript
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

```

# src/components/ui/color-picker.tsx

```typescript
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hexToHSL, hslToHex } from '@/lib/utils';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  const hexValue = React.useMemo(() => {
    try {

      if (!value) return '#000000';
      const [h, s, l] = value.split(' ').map(v => parseFloat(v));

      if (isNaN(h) || isNaN(s) || isNaN(l)) return '#000000';

      return hslToHex(h, s, l);
    } catch (e) {
      return '#000000';
    }
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    const { h, s, l } = hexToHSL(newHex);

    onChange(`${h} ${s}% ${l}%`);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;

    if (/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
      const { h, s, l } = hexToHSL(newHex);

      onChange(`${h} ${s}% ${l}%`);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10 rounded-md overflow-hidden border border-input shadow-sm">
          <input
            type="color"
            value={hexValue}
            onChange={handleColorChange}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
          />
        </div>
        <Input
          defaultValue={hexValue}
          key={hexValue}
          onBlur={handleTextChange}
          className="w-24 font-mono uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
};

```

# src/components/ui/command.tsx

```typescript
import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn("overflow-hidden p-0", className)}
        showCloseButton={showCloseButton}
      >
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-9 items-center gap-2 border-b px-3"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}

```

# src/components/ui/context-menu.tsx

```typescript
"use client"

import * as React from "react"
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function ContextMenu({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

function ContextMenuTrigger({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return (
    <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
  )
}

function ContextMenuGroup({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
  )
}

function ContextMenuPortal({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Portal>) {
  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
  )
}

function ContextMenuSub({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />
}

function ContextMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  )
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </ContextMenuPrimitive.SubTrigger>
  )
}

function ContextMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  return (
    <ContextMenuPrimitive.SubContent
      data-slot="context-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

function ContextMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.Label
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn(
        "text-foreground px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}

```

# src/components/ui/data-table.tsx

```typescript
"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    RowSelectionState,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    onRowSelectionChange?: (selection: RowSelectionState) => void
    rowSelection?: RowSelectionState
    enableRowSelection?: boolean
    getRowId?: (row: TData) => string
    searchValue?: string
    searchColumn?: string
    pageSize?: number
    onRowClick?: (row: TData) => void
    pageCount?: number
    pageIndex?: number
    onPageChange?: (page: number) => void
    manualPagination?: boolean
    totalItems?: number
}

export function DataTable<TData, TValue>({
    columns,
    data,
    onRowSelectionChange,
    rowSelection: externalRowSelection,
    enableRowSelection = true,
    getRowId,
    searchValue = "",
    searchColumn,
    pageSize = 50,
    onRowClick,
    pageCount = -1,
    pageIndex = 0,
    onPageChange,
    manualPagination = false,
    totalItems,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({})
    const [internalPagination, setInternalPagination] = React.useState({
        pageIndex: 0,
        pageSize: pageSize,
    })

    const rowSelection = externalRowSelection ?? internalRowSelection

    const paginationState = manualPagination
        ? { pageIndex, pageSize }
        : internalPagination

    React.useEffect(() => {
        if (searchColumn && searchValue) {
            setColumnFilters([{ id: searchColumn, value: searchValue }])
        } else {
            setColumnFilters([])
        }
    }, [searchValue, searchColumn])

    const table = useReactTable({
        data,
        columns,
        pageCount: manualPagination ? pageCount : undefined,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: (updater) => {
            const newState = typeof updater === 'function' ? updater(rowSelection) : updater
            if (onRowSelectionChange) {
                onRowSelectionChange(newState)
            } else {
                setInternalRowSelection(newState)
            }
        },
        onPaginationChange: (updater) => {
            if (manualPagination && onPageChange) {
                const newState = typeof updater === 'function' ? updater(paginationState) : updater
                onPageChange(newState.pageIndex)
            } else {
                setInternalPagination(updater as any)
            }
        },
        getRowId,
        manualPagination: manualPagination,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: paginationState,
        },
        enableRowSelection,
    })

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Standard Table Container */}
            <div className="relative flex-1 min-h-0 overflow-auto border rounded-md">
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="relative h-11 text-muted-foreground font-medium">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={() => onRowClick?.(row.original)}
                                    className={cn(
                                        "cursor-pointer transition-colors group",
                                        "hover:bg-muted/50",
                                        row.getIsSelected() && "bg-muted"
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-12">
                                        <span className="text-lg font-medium text-foreground">No results found</span>
                                        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} row(s) selected
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Page</span>
                        <span className="text-foreground font-medium tabular-nums">
                            {table.getState().pagination.pageIndex + 1}
                        </span>
                        <span>of</span>
                        <span className="text-foreground font-medium tabular-nums">
                            {table.getPageCount()}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                                "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                                "h-8 px-4"
                            )}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                                "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                                "h-8 px-4"
                            )}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

```

# src/components/ui/dialog.tsx

```typescript
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

```

# src/components/ui/drawer.tsx

```typescript
"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
          className
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}

```

# src/components/ui/dropdown-menu.tsx

```typescript
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}

```

# src/components/ui/empty-state.tsx

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps {
    icon: React.ElementType
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className
}: EmptyStateProps) {
    return (
        <Card className={cn("p-8", className)}>
            <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-muted p-3">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-2">
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    {description}
                </p>

                {action && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={action.onClick}
                    >
                        {action.label}
                    </Button>
                )}
            </div>
        </Card>
    )
}

```

# src/components/ui/empty.tsx

```typescript
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12",
        className
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        "flex max-w-sm flex-col items-center gap-2 text-center",
        className
      )}
      {...props}
    />
  )
}

const emptyMediaVariants = cva(
  "flex shrink-0 items-center justify-center mb-2 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-lg font-medium tracking-tight", className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance",
        className
      )}
      {...props}
    />
  )
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
}

```

# src/components/ui/field.tsx

```typescript
import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-3 font-medium",
        "data-[variant=legend]:text-base",
        "data-[variant=label]:text-sm",
        className
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "group/field flex w-full gap-3 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],
        horizontal: [
          "flex-row items-center",
          "[&>[data-slot=field-label]]:flex-auto",
          "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        ],
        responsive: [
          "flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto",
          "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
          "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        ],
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-1.5 leading-snug",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4",
        "has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10",
        className
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-muted-foreground text-sm leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
        "last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="bg-background text-muted-foreground relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-destructive text-sm font-normal", className)}
      {...props}
    >
      {content}
    </div>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}

```

# src/components/ui/flags.tsx

```typescript
import React from 'react';

interface FlagProps {
  className?: string;
}

export const PolishFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#FFFFFF"/>
    <rect y="12" width="32" height="12" fill="#DC143C"/>
  </svg>
);

export const NorwegianFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#BA0C2F"/>
    <path d="M0,12 h32 M10,0 v24" stroke="#FFFFFF" strokeWidth="6"/>
    <path d="M0,12 h32 M10,0 v24" stroke="#00205B" strokeWidth="3"/>
  </svg>
);

export const JapaneseFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#FFFFFF"/>
    <circle cx="16" cy="12" r="7" fill="#BC002D"/>
  </svg>
);

export const SpanishFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#AA151B"/>
    <rect y="6" width="32" height="12" fill="#F1BF00"/>
  </svg>
);

export const GermanFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="8" fill="#000000"/>
    <rect y="8" width="32" height="8" fill="#DD0000"/>
    <rect y="16" width="32" height="8" fill="#FFCC00"/>
  </svg>
);


```

# src/components/ui/form.tsx

```typescript
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : props.children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}

```

# src/components/ui/furigana-renderer.tsx

```typescript
import React from 'react';
import { parseFurigana, cn } from '@/lib/utils';

interface FuriganaRendererProps {
    text: string;
    className?: string;
    processText?: (text: string) => string;
}

export const FuriganaRenderer: React.FC<FuriganaRendererProps> = ({
    text,
    className = '',
    processText = (t) => t
}) => {
    const segments = parseFurigana(text);
    const hasFurigana = segments.some(s => s.furigana);

    if (!hasFurigana) {
        return <span className={className}>{processText(text)}</span>;
    }

    return (
        <span className={cn(className, "leading-[1.6]")}>
            {segments.map((segment, i) => {
                if (segment.furigana) {
                    return (
                        <ruby key={i} className="group/ruby" style={{ rubyAlign: 'center' }}>
                            <span>{processText(segment.text)}</span>
                            <rt className="text-[0.5em] text-muted-foreground/70 select-none opacity-0 group-hover/ruby:opacity-100 transition-opacity duration-500 font-sans font-light tracking-wide text-center" style={{ textAlign: 'center' }}>
                                {processText(segment.furigana)}
                            </rt>
                        </ruby>
                    );
                }
                return <span key={i}>{processText(segment.text)}</span>;
            })}
        </span>
    );
};

```

# src/components/ui/hover-card.tsx

```typescript
"use client"

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

function HoverCard({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }

```

# src/components/ui/input-group.tsx

```typescript
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group border-input dark:bg-input/30 relative flex w-full items-center rounded-md border shadow-xs transition-[color,box-shadow] outline-none",
        "h-9 min-w-0 has-[>textarea]:h-auto",

        // Variants based on alignment.
        "has-[>[data-align=inline-start]]:[&>input]:pl-2",
        "has-[>[data-align=inline-end]]:[&>input]:pr-2",
        "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
        "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",

        // Focus state.
        "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot=input-group-control]:focus-visible]:ring-[3px]",

        // Error state.
        "has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40",

        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none [&>svg:not([class*='size-'])]:size-4 [&>kbd]:rounded-[calc(var(--radius)-5px)] group-data-[disabled=true]/input-group:opacity-50",
  {
    variants: {
      align: {
        "inline-start":
          "order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",
        "inline-end":
          "order-last pr-3 has-[>button]:mr-[-0.45rem] has-[>kbd]:mr-[-0.35rem]",
        "block-start":
          "order-first w-full justify-start px-3 pt-3 [.border-b]:pb-3 group-has-[>input]/input-group:pt-2.5",
        "block-end":
          "order-last w-full justify-start px-3 pb-3 [.border-t]:pt-3 group-has-[>input]/input-group:pb-2.5",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props}
    />
  )
}

const inputGroupButtonVariants = cva(
  "text-sm shadow-none flex gap-2 items-center",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 px-2 rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-3.5 has-[>svg]:px-2",
        sm: "h-8 px-2.5 gap-1.5 rounded-md has-[>svg]:px-2.5",
        "icon-xs":
          "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",
        "icon-sm": "size-8 p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
)

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-muted-foreground flex items-center gap-2 text-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}

```

# src/components/ui/input-otp.tsx

```typescript
import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { MinusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center", className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }

```

# src/components/ui/input.tsx

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }

```

# src/components/ui/item.tsx

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn("group/item-group flex flex-col", className)}
      {...props}
    />
  )
}

function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn("my-0", className)}
      {...props}
    />
  )
}

const itemVariants = cva(
  "group/item flex items-center border border-transparent text-sm rounded-md transition-colors [a]:hover:bg-accent/50 [a]:transition-colors duration-100 flex-wrap outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-border",
        muted: "bg-muted/50",
      },
      size: {
        default: "p-4 gap-4 ",
        sm: "py-3 px-4 gap-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Item({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof itemVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      data-size={size}
      className={cn(itemVariants({ variant, size, className }))}
      {...props}
    />
  )
}

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none group-has-[[data-slot=item-description]]/item:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-8 border rounded-sm bg-muted [&_svg:not([class*='size-'])]:size-4",
        image:
          "size-10 rounded-sm overflow-hidden [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function ItemMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        "flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none",
        className
      )}
      {...props}
    />
  )
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium",
        className
      )}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "text-muted-foreground line-clamp-2 text-sm leading-normal font-normal text-balance",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
}

```

# src/components/ui/kbd.tsx

```typescript
import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-muted text-muted-foreground pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium select-none",
        "[&_svg:not([class*='size-'])]:size-3",
        "[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }

```

# src/components/ui/label.tsx

```typescript
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }

```

# src/components/ui/level-badge.tsx

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export const RANK_CONFIG = [
    { maxLevel: 5, title: 'Novice' },
    { maxLevel: 10, title: 'Apprentice' },
    { maxLevel: 20, title: 'Scholar' },
    { maxLevel: 35, title: 'Adept' },
    { maxLevel: 50, title: 'Expert' },
    { maxLevel: 75, title: 'Master' },
    { maxLevel: 100, title: 'Grandmaster' },
    { maxLevel: Infinity, title: 'Legend' },
] as const

export function getRankForLevel(level: number) {
    return RANK_CONFIG.find(r => level <= r.maxLevel) || RANK_CONFIG[RANK_CONFIG.length - 1]
}

export interface LevelBadgeProps {
    level: number
    xp: number
    progressPercent: number
    xpToNextLevel: number
    showDetails?: boolean
    className?: string
}

export function LevelBadge({
    level,
    xp,
    progressPercent,
    xpToNextLevel,
    showDetails = true,
    className
}: LevelBadgeProps) {
    const rank = getRankForLevel(level)

    return (
        <div className={cn("flex items-center gap-4", className)}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {level}
            </div>

            {showDetails && (
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">
                            {rank.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Lv. {level}
                        </span>
                    </div>

                    <Progress value={progressPercent} className="h-2 mb-1" />

                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">
                            {xp.toLocaleString()} XP
                        </span>
                        <span className="text-xs text-muted-foreground">
                            ({xpToNextLevel.toLocaleString()} to next)
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

```

# src/components/ui/loading.tsx

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const LOADING_TIPS = [
    "Reviewing daily keeps the streak alive!",
    "Use mnemonics to remember difficult words.",
    "Consistency is key to language mastery.",
    "Take breaks to let your brain absorb the material.",
    "Say the words out loud for better retention."
];

export interface LoaderProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function Loader({ size = 'md', className }: LoaderProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    }

    return (
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
    )
}

export interface LoadingScreenProps {
    title?: string
    subtitle?: string
    showTip?: boolean
    className?: string
}

export function LoadingScreen({
    title = "Loading",
    subtitle,
    showTip = true,
    className
}: LoadingScreenProps) {
    const [tipIndex] = React.useState(() => Math.floor(Math.random() * LOADING_TIPS.length))
    const tip = LOADING_TIPS[tipIndex]

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background",
            className
        )}>
            <div className="flex flex-col items-center gap-6 px-6">
                <Loader size="lg" />

                <div className="flex flex-col items-center gap-2 text-center">
                    <h2 className="text-xl font-semibold text-foreground">
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-sm text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {showTip && (
                <div className="absolute bottom-12 left-0 right-0 px-8">
                    <div className="max-w-md mx-auto text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tip</p>
                        <p className="text-sm text-muted-foreground italic">
                            "{tip}"
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export function ButtonLoader({ className }: { className?: string }) {
    return (
        <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
    )
}

```

# src/components/ui/menubar.tsx

```typescript
import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Menubar({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Root>) {
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      className={cn(
        "bg-background flex h-9 items-center gap-1 rounded-md border p-1 shadow-xs",
        className
      )}
      {...props}
    />
  )
}

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return (
    <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
  )
}

function MenubarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
  return (
    <MenubarPrimitive.Trigger
      data-slot="menubar-trigger"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none",
        className
      )}
      {...props}
    />
  )
}

function MenubarContent({
  className,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Content>) {
  return (
    <MenubarPortal>
      <MenubarPrimitive.Content
        data-slot="menubar-content"
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[12rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </MenubarPortal>
  )
}

function MenubarItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <MenubarPrimitive.Item
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function MenubarCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem>) {
  return (
    <MenubarPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  )
}

function MenubarRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioItem>) {
  return (
    <MenubarPrimitive.RadioItem
      data-slot="menubar-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  )
}

function MenubarLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.Label
      data-slot="menubar-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function MenubarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  return (
    <MenubarPrimitive.Separator
      data-slot="menubar-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function MenubarShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="menubar-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

function MenubarSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.SubTrigger
      data-slot="menubar-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[inset]:pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto h-4 w-4" />
    </MenubarPrimitive.SubTrigger>
  )
}

function MenubarSubContent({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
  return (
    <MenubarPrimitive.SubContent
      data-slot="menubar-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      {...props}
    />
  )
}

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
}

```

# src/components/ui/navigation-menu.tsx

```typescript
import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className
      )}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "group flex flex-1 list-none items-center justify-center gap-1",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  )
}

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=open]:hover:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:focus:bg-accent data-[state=open]:bg-accent/50 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1"
)

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...props}
    >
      {children}{" "}
      <ChevronDownIcon
        className="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 top-0 left-0 w-full p-2 pr-2.5 md:absolute md:w-auto",
        "group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=false]/navigation-menu:duration-200 **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div
      className={cn(
        "absolute top-full left-0 isolate z-50 flex justify-center"
      )}
    >
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "origin-top-center bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow md:w-[var(--radix-navigation-menu-viewport-width)]",
          className
        )}
        {...props}
      />
    </div>
  )
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(
        "data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="bg-border relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
}

```

# src/components/ui/pagination.tsx

```typescript
import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}

```

# src/components/ui/popover.tsx

```typescript
"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }

```

# src/components/ui/progress.tsx

```typescript
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

```

# src/components/ui/radio-group.tsx

```typescript
"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }

```

# src/components/ui/resizable.tsx

```typescript
import * as React from "react"
import { GripVerticalIcon } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }

```

# src/components/ui/scroll-area.tsx

```typescript
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }

```

# src/components/ui/section-header.tsx

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    subtitle?: string
    icon?: React.ReactNode
}

export function SectionHeader({
    title,
    subtitle,
    icon,
    className,
    ...props
}: SectionHeaderProps) {
    return (
        <div className={cn("mb-6", className)} {...props}>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {icon && <span className="text-muted-foreground">{icon}</span>}
                {title}
            </h2>

            {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">
                    {subtitle}
                </p>
            )}
        </div>
    )
}

```

# src/components/ui/select.tsx

```typescript
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}

```

# src/components/ui/separator.tsx

```typescript
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }

```

# src/components/ui/sheet.tsx

```typescript
import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

```

# src/components/ui/sidebar.tsx

```typescript
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { PanelLeftIcon } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("bg-background h-8 w-full shadow-none", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button"
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  showOnHover?: boolean
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
        "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}


```

# src/components/ui/skeleton.tsx

```typescript
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }

```

# src/components/ui/slider.tsx

```typescript
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="border-primary ring-ring/50 block size-4 shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }

```

# src/components/ui/sonner.tsx

```typescript
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

```

# src/components/ui/spinner.tsx

```typescript
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }

```

# src/components/ui/streak-display.tsx

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"
import { Flame } from "lucide-react"

export interface StreakDisplayProps {
    currentStreak: number
    lastSevenDays: { date: Date; active: boolean; count: number }[]
    isAtRisk?: boolean
    className?: string
}

export function StreakDisplay({
    currentStreak,
    lastSevenDays,
    isAtRisk = false,
    className
}: StreakDisplayProps) {
    return (
        <div className={cn("flex items-center gap-4", className)}>
            <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                currentStreak > 0 ? "bg-primary/10" : "bg-muted"
            )}>
                <Flame className={cn(
                    "h-6 w-6",
                    currentStreak > 0 ? "text-primary" : "text-muted-foreground"
                )} />
            </div>

            <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-foreground tabular-nums">
                        {currentStreak}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        day{currentStreak === 1 ? '' : 's'}
                    </span>
                    {isAtRisk && currentStreak > 0 && (
                        <span className="text-xs text-destructive font-medium ml-2">
                            At Risk
                        </span>
                    )}
                </div>

                <div className="flex gap-1">
                    {lastSevenDays.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                                {day.date.toLocaleDateString('en', { weekday: 'narrow' })}
                            </span>
                            <div className={cn(
                                "w-6 h-6 rounded-sm flex items-center justify-center",
                                day.active
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                            )}>
                                {day.active && (
                                    <span className="text-xs">✓</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

```

# src/components/ui/switch.tsx

```typescript
"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

```

# src/components/ui/table.tsx

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-4 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

```

# src/components/ui/tabs.tsx

```typescript
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

```

# src/components/ui/textarea.tsx

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

```

# src/components/ui/toggle-group.tsx

```typescript
import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
})

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
  }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-md data-[spacing=default]:data-[variant=outline]:shadow-xs",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        "w-auto min-w-0 shrink-0 px-3 focus:z-10 focus-visible:z-10",
        "data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none data-[spacing=0]:first:rounded-l-md data-[spacing=0]:last:rounded-r-md data-[spacing=0]:data-[variant=outline]:border-l-0 data-[spacing=0]:data-[variant=outline]:first:border-l",
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }

```

# src/components/ui/toggle.tsx

```typescript
import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }

```

# src/components/ui/tooltip.tsx

```typescript
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

```

# src/constants.ts

```typescript
import { Card, ReviewHistory } from './types';

export const MOCK_CARDS: Card[] = [
  {
    id: '1',
    targetSentence: "Cześć, jak się masz?",
    targetWord: "Cześć",
    nativeTranslation: "Hi, how are you?",
    notes: "Informal greeting. Also means 'Bye' depending on context.",
    status: 'new',
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
  {
    id: '2',
    targetSentence: "Dziękuję za pomoc.",
    targetWord: "Dziękuję",
    nativeTranslation: "Thank you for the help.",
    notes: "First person singular of dziękować.",
    status: 'learning',
    interval: 1,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    targetSentence: "Ten mężczyzna jest wysoki.",
    targetWord: "mężczyzna",
    nativeTranslation: "That man is tall.",
    notes: "Noun, Masculine Personal.",
    status: 'new',
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
  {
    id: '4',
    targetSentence: "Lubię pić kawę rano.",
    targetWord: "kawę",
    nativeTranslation: "I like to drink coffee in the morning.",
    notes: "Accusative case of 'kawa'.",
    status: 'graduated',
    interval: 10,
    easeFactor: 2.7,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
  },
  {
    id: '5',
    targetSentence: "Wszystko w porządku?",

    nativeTranslation: "Is everything okay?",
    notes: "Common phrase used to ask if someone is fine or if a situation is resolved.",
    status: 'new',
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
];


export const getUTCDateString = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

const generateMockHistory = (): ReviewHistory => {
  const history: ReviewHistory = {};
  const today = new Date();
  for (let i = 0; i < 100; i++) {

    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * 365));
    const dateKey = getUTCDateString(pastDate);


    history[dateKey] = (history[dateKey] || 0) + Math.floor(Math.random() * 10) + 1;
  }
  return history;
};

export const MOCK_HISTORY = generateMockHistory();

export const STORAGE_KEY = 'language_mining_deck_v1';
export const HISTORY_KEY = 'language_mining_history_v1';

export const SRS_CONFIG = {
  CUTOFF_HOUR: 4,
};

export const FSRS_DEFAULTS = {
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzzing: true,
  w: [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542],
};

export const LANGUAGE_NAMES = {
  polish: 'Polish',
  norwegian: 'Norwegian',
  japanese: 'Japanese',
  spanish: 'Spanish',
  german: 'German'
} as const;

```

# src/contexts/AuthContext.tsx

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, hashPassword, generateId, LocalUser } from '@/db/dexie';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  register: (username: string, password: string) => Promise<{ user: AuthUser }>;
  login: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  getRegisteredUsers: () => Promise<LocalUser[]>;
}

const SESSION_KEY = 'linguaflow_current_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUserId = localStorage.getItem(SESSION_KEY);
        if (savedUserId) {
          const existingUser = await db.users.get(savedUserId);
          if (existingUser) {
            setUser({ id: existingUser.id, username: existingUser.username });
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const register = async (username: string, password: string): Promise<{ user: AuthUser }> => {
    // Check if username already exists
    const existingUser = await db.users.where('username').equals(username).first();
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    // Create user account
    await db.users.add({
      id: userId,
      username,
      passwordHash,
      created_at: now
    });

    // Create profile for the user
    await db.profile.put({
      id: userId,
      username,
      xp: 0,
      points: 0,
      level: 1,
      created_at: now,
      updated_at: now
    });

    // Save session
    localStorage.setItem(SESSION_KEY, userId);

    const authUser = { id: userId, username };
    setUser(authUser);

    return { user: authUser };
  };

  const login = async (username: string, password: string): Promise<void> => {
    const existingUser = await db.users.where('username').equals(username).first();

    if (!existingUser) {
      throw new Error('User not found');
    }

    const passwordHash = await hashPassword(password);
    if (existingUser.passwordHash !== passwordHash) {
      throw new Error('Invalid password');
    }

    // Save session
    localStorage.setItem(SESSION_KEY, existingUser.id);
    setUser({ id: existingUser.id, username: existingUser.username });

    toast.success(`Welcome back, ${existingUser.username}!`);
  };

  const updateUsername = async (username: string) => {
    if (!user) throw new Error('No user logged in');

    const now = new Date().toISOString();

    // Update user account
    await db.users.update(user.id, { username });

    // Update profile
    const exists = await db.profile.get(user.id);
    if (exists) {
      await db.profile.update(user.id, { username, updated_at: now });
    } else {
      await db.profile.put({
        id: user.id,
        username,
        xp: 0,
        points: 0,
        level: 1,
        created_at: now,
        updated_at: now
      });
    }

    setUser(prev => prev ? { ...prev, username } : null);
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    toast.success('Signed out');
  };

  const getRegisteredUsers = async (): Promise<LocalUser[]> => {
    return await db.users.toArray();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        signOut,
        updateUsername,
        getRegisteredUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

```

# src/contexts/DeckActionsContext.tsx

```typescript
import React, { createContext, useContext, useCallback } from 'react';
import { Card, Grade } from '@/types';
import { CardXpPayload } from '@/core/gamification/xp';
import { useRecordReviewMutation, useUndoReviewMutation } from '@/features/collection/hooks/useDeckQueries';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUTCDateString } from '@/constants';
import { getSRSDate } from '@/core/srs/scheduler';
import { useDeckStore } from '@/stores/useDeckStore';

interface DeckDispatch {
    recordReview: (oldCard: Card, newCard: Card, grade: Grade, xpPayload?: CardXpPayload) => Promise<void>;
    undoReview: () => Promise<void>;
    refreshDeckData: () => void;
}

const DeckActionsContext = createContext<DeckDispatch | undefined>(undefined);

export const DeckActionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const recordReviewMutation = useRecordReviewMutation();
    const undoReviewMutation = useUndoReviewMutation();

    const recordReview = useCallback(async (oldCard: Card, newCard: Card, grade: Grade, xpPayload?: CardXpPayload) => {
        const today = getUTCDateString(getSRSDate(new Date()));
        const xpEarned = xpPayload?.totalXp ?? 0;

        useDeckStore.getState().setLastReview({ card: oldCard, date: today, xpEarned });

        try {
            await recordReviewMutation.mutateAsync({ card: oldCard, newCard, grade, xpPayload });
        } catch (error) {
            console.error("Failed to record review", error);
            toast.error("Failed to save review progress");
            const currentLast = useDeckStore.getState().lastReview;
            if (currentLast?.card.id === oldCard.id) {
                useDeckStore.getState().clearLastReview();
            }
        }
    }, [recordReviewMutation]);

    const undoReview = useCallback(async () => {
        const lastReview = useDeckStore.getState().lastReview;
        if (!lastReview) return;
        const { card, date, xpEarned } = lastReview;

        try {
            await undoReviewMutation.mutateAsync({ card, date, xpEarned });
            useDeckStore.getState().clearLastReview();
            toast.success('Review undone');
        } catch (error) {
            console.error("Failed to undo review", error);
            toast.error("Failed to undo review");
        }
    }, [undoReviewMutation]);

    const refreshDeckData = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['deckStats'] });
        queryClient.invalidateQueries({ queryKey: ['dueCards'] });
        queryClient.invalidateQueries({ queryKey: ['reviewsToday'] });
        queryClient.invalidateQueries({ queryKey: ['history'] });
        queryClient.invalidateQueries({ queryKey: ['cards'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardCards'] });
    }, [queryClient]);

    const value = {
        recordReview,
        undoReview,
        refreshDeckData,
    };

    return (
        <DeckActionsContext.Provider value={value}>
            {children}
        </DeckActionsContext.Provider>
    );
};

export const useDeckActions = () => {
    const context = useContext(DeckActionsContext);
    if (context === undefined) {
        throw new Error('useDeckActions must be used within a DeckActionsProvider');
    }
    return context;
};

```

# src/contexts/GamificationContext.tsx

```typescript
import React, { createContext, useContext } from 'react';
import { db } from '@/db/dexie';
import { useAuth } from './AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';

interface GamificationContextType {
    incrementXP: (amount: number) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { profile, refreshProfile } = useProfile();

    const incrementXP = (amount: number) => {
        if (!profile || !user) return;

        const newXP = (profile.xp || 0) + amount;
        const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;





        db.profile.update(user.id, {
            xp: newXP,
            points: (profile.points || 0) + amount,
            level: newLevel,
            updated_at: new Date().toISOString()
        }).then(() => {
            refreshProfile();
        }).catch(console.error);
    };

    return (
        <GamificationContext.Provider value={{ incrementXP }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (!context) {
        throw new Error('useGamification must be used within GamificationProvider');
    }
    return context;
};

```

# src/contexts/MusicContext.tsx

```typescript
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface MusicContextType {
  isPlaying: boolean;
  togglePlay: () => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const MUSIC_URL = '/music/medieval.mp3';

  useEffect(() => {
    audioRef.current = new Audio(MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    if (isPlaying) {
      audioRef.current.play().catch(e => {
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <MusicContext.Provider value={{ isPlaying, togglePlay, volume, setVolume }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};


```

# src/contexts/ThemeContext.tsx

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'vite-ui-theme',
}: ThemeProviderProps) {

  const theme = 'light';

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
  }, []);

  const value: ThemeContextState = {
    theme,
    setTheme: () => {}, 
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

```

# src/contexts/UserProfileContext.tsx

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/db/dexie';

interface LocalProfile {
    id: string;
}

interface UserProfileContextType {
    profile: LocalProfile | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
}

const LOCAL_USER_ID = 'local-user';

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<LocalProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshProfile = async () => {
        try {
            const count = await db.profile.where('id').equals(LOCAL_USER_ID).count();
            if (count > 0) {
                setProfile({ id: LOCAL_USER_ID });
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshProfile();
    }, []);

    return (
        <UserProfileContext.Provider value={{ profile, isLoading, refreshProfile }}>
            {children}
        </UserProfileContext.Provider>
    );
};

export const useUserProfile = () => {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};

```

# src/core/gamification/index.ts

```typescript
export * from './xp';

```

# src/core/gamification/xp.ts

```typescript
export type CardRating = 'again' | 'hard' | 'good' | 'easy';

export const XP_CONFIG = {
  BASE: {
    again: 1,
    hard: 3,
    good: 5,
    easy: 8,
  },
  CRAM_CORRECT: 2,
  ASYMPTOTE_SCALE: 30,
} as const;

export const getDailyStreakMultiplier = (
  days: number
): { value: number; label: string } => {
  if (days <= 0) return { value: 1.0, label: 'Standard (1.00x)' };

  const rawCurve = Math.tanh(days / XP_CONFIG.ASYMPTOTE_SCALE);

  const value = Math.round((1 + rawCurve) * 100) / 100;

  let tier = 'Rookie';
  if (value >= 1.9) tier = 'Godlike';
  else if (value >= 1.75) tier = 'Grandmaster';
  else if (value >= 1.5) tier = 'Master';
  else if (value >= 1.25) tier = 'Elite';
  else if (value >= 1.1) tier = 'Pro';

  return {
    value,
    label: `${tier} (${value.toFixed(2)}x)`
  };
};

export interface XpCalculationResult {
  baseXp: number;
  bonusXp: number;
  multiplier: number;
  totalXp: number;
  isStreakBonus: boolean;
}

export interface CardXpPayload extends XpCalculationResult {
  rating: CardRating;
  streakAfter: number;
  isCramMode: boolean;
  dailyStreak: number;
  multiplierLabel: string;
}

export const calculateCardXp = (
  rating: CardRating,
  sessionStreak: number,
  dailyStreak: number,
  isCramMode: boolean = false
): XpCalculationResult => {
  if (isCramMode) {
    const cramXp = rating === 'again' ? 0 : XP_CONFIG.CRAM_CORRECT;
    return {
      baseXp: cramXp,
      bonusXp: 0,
      multiplier: 1,
      totalXp: cramXp,
      isStreakBonus: false,
    };
  }

  const baseXp = XP_CONFIG.BASE[rating];
  const bonusXp = 0;

  const { value: multiplier } = getDailyStreakMultiplier(dailyStreak);
  const preMultiplied = baseXp + bonusXp;


  const totalXp = Math.round(preMultiplied * multiplier);

  return {
    baseXp,
    bonusXp,
    multiplier,
    totalXp,
    isStreakBonus: false,
  };
};

```

# src/core/srs/cardSorter.ts

```typescript
import { Card } from '@/types';

export type CardOrder = 'newFirst' | 'reviewFirst' | 'mixed';

import { isNewCard } from '@/services/studyLimits';

export const sortCards = (cards: Card[], order: CardOrder): Card[] => {
    if (cards.length === 0) return [];

    const dateSorted = [...cards].sort((a, b) => {
        const dateComparison = (a.dueDate || '').localeCompare(b.dueDate || '');
        if (dateComparison !== 0) return dateComparison;
        return (a.id || '').localeCompare(b.id || '');
    });

    if (order === 'mixed') {
        const shuffled = [...cards];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    const newCards = dateSorted.filter(c => isNewCard(c));
    const reviewCards = dateSorted.filter(c => !isNewCard(c));

    if (order === 'reviewFirst') {
        return [...reviewCards, ...newCards];
    }

    return [...newCards, ...reviewCards];
};

```

# src/core/srs/index.ts

```typescript
export * from './scheduler';
export * from './cardSorter';

```

# src/core/srs/scheduler.ts

```typescript
import { addDays, startOfDay, subHours, isBefore, isSameDay, addMinutes } from 'date-fns';
import { Card, Grade, UserSettings, CardStatus } from '@/types';
import { SRS_CONFIG, FSRS_DEFAULTS } from '@/constants';
import { FSRS, Card as FSRSCard, Rating, State, generatorParameters } from 'ts-fsrs';

let cachedFSRS: FSRS | null = null;
let lastConfig: UserSettings['fsrs'] | null = null;
let lastWHash: string | null = null;

export const getSRSDate = (date: Date = new Date()): Date => {

  return startOfDay(subHours(date, SRS_CONFIG.CUTOFF_HOUR));
};

const mapGradeToRating = (grade: Grade): Rating => {
  switch (grade) {
    case 'Again': return Rating.Again;
    case 'Hard': return Rating.Hard;
    case 'Good': return Rating.Good;
    case 'Easy': return Rating.Easy;
  }
};

const mapStateToStatus = (state: State): CardStatus => {
  if (state === State.New) return 'new';
  if (state === State.Learning || state === State.Relearning) return 'learning';
  return 'graduated';
};

function getFSRS(settings?: UserSettings['fsrs']) {
  const currentWHash = settings?.w ? JSON.stringify(settings.w) : null;

  if (!cachedFSRS ||
    lastConfig?.request_retention !== settings?.request_retention ||
    lastConfig?.maximum_interval !== settings?.maximum_interval ||
    lastWHash !== currentWHash ||
    lastConfig?.enable_fuzzing !== settings?.enable_fuzzing) {

    lastWHash = currentWHash;

    const paramsConfig = {
      request_retention: settings?.request_retention || FSRS_DEFAULTS.request_retention,
      maximum_interval: settings?.maximum_interval || FSRS_DEFAULTS.maximum_interval,
      w: settings?.w || FSRS_DEFAULTS.w,
      enable_fuzz: settings?.enable_fuzzing ?? FSRS_DEFAULTS.enable_fuzzing,
      learning_steps: []
    };
    const params = generatorParameters(paramsConfig);
    cachedFSRS = new FSRS(params);
    lastConfig = settings || null;
  }
  return cachedFSRS;
}

export const calculateNextReview = (
  card: Card,
  grade: Grade,
  settings?: UserSettings['fsrs'],
  learningSteps: number[] = [1, 10]): Card => {
  const now = new Date();
  const learningStepsMinutes = learningSteps.length > 0 ? learningSteps : [1, 10];
  // rawStep is the actual saved learning step (may be >= length when ready to graduate)
  const rawStep = card.learningStep ?? 0;
  // currentStep is clamped for array access only
  const currentStep = Math.max(0, Math.min(rawStep, learningStepsMinutes.length - 1));

  // Use rawStep (not clamped) to determine graduation eligibility
  // When rawStep >= length, the card has completed all learning steps and should graduate
  const isLearningPhase = (card.status === 'new' || card.status === 'learning') && rawStep < learningStepsMinutes.length;

  if (isLearningPhase) {

    let nextStep = currentStep;
    let nextIntervalMinutes = 0;

    if (grade === 'Again') {
      nextStep = 0;
      nextIntervalMinutes = learningStepsMinutes[0] ?? 1;
    } else if (grade === 'Hard') {
      // Safe access with fallback - currentStep might be out of bounds
      nextIntervalMinutes = learningStepsMinutes[currentStep]
        ?? learningStepsMinutes[learningStepsMinutes.length - 1]
        ?? 1;
    } else if (grade === 'Good') {
      nextStep = currentStep + 1;
      if (nextStep > learningStepsMinutes.length) {
        // Will graduate - handled below by falling through to FSRS
      } else {
        // Use CURRENT step's interval, not next step's
        // This ensures step 0 → 1 min, step 1 → 10 min, etc.
        nextIntervalMinutes = learningStepsMinutes[currentStep] ?? 1;
      }
    }
    // For 'Easy' during learning: graduate immediately by falling through to FSRS
    // nextIntervalMinutes is intentionally unused; FSRS calculates the graduation interval

    // Stay in learning if we haven't completed all learning steps yet
    // Graduate when nextStep > length (i.e., after completing the last step)
    if ((grade === 'Again' || grade === 'Hard') || (grade === 'Good' && nextStep <= learningStepsMinutes.length)) {
      let nextDue = addMinutes(now, nextIntervalMinutes);

      // Safety check for invalid dates
      if (isNaN(nextDue.getTime())) {
        console.error('[SRS] Invalid learning step interval', { nextIntervalMinutes, grade, card });
        nextDue = addMinutes(now, 1); // Fallback to 1 minute
      }

      const intervalDays = nextIntervalMinutes / (24 * 60);

      return {
        ...card,
        dueDate: nextDue.toISOString(),
        status: 'learning',
        state: State.Learning, learningStep: nextStep,
        interval: intervalDays,
        precise_interval: intervalDays,
        scheduled_days: 0, last_review: now.toISOString(),
        reps: (card.reps || 0) + 1,
        lapses: grade === 'Again' ? (card.lapses || 0) + 1 : (card.lapses || 0),
      };
    }
  }


  const f = getFSRS(settings);

  let currentState = card.state;
  if (currentState === undefined) {
    if (card.status === 'new') currentState = State.New;
    else if (card.status === 'learning') currentState = State.Learning;
    else if (card.status === 'graduated') currentState = State.Review;
    else currentState = State.Review;
  }

  // If we are graduating from custom learning steps (isLearningPhase is false but status is learning/new),
  // we must treat it as a New card for FSRS to initialize Stability/Difficulty.
  if (!isLearningPhase && (card.status === 'learning' || card.status === 'new')) {
    currentState = State.New;
  }

  const lastReviewDate = card.last_review ? new Date(card.last_review) : undefined;


  if ((currentState === State.Review || currentState === State.Learning || currentState === State.Relearning) && !lastReviewDate) {
    currentState = State.New;
  }

  const fsrsCard: FSRSCard = {
    due: new Date(card.dueDate),
    stability: card.stability || 0,
    difficulty: card.difficulty || 0,
    elapsed_days: card.elapsed_days || 0,
    scheduled_days: card.scheduled_days || 0,
    reps: card.reps || 0,
    lapses: card.lapses || 0,
    state: currentState,
    last_review: lastReviewDate
  } as FSRSCard;


  const schedulingCards = f.repeat(fsrsCard, now);

  const rating = mapGradeToRating(grade);
  const log = schedulingCards[rating].card;

  const tentativeStatus = mapStateToStatus(log.state);

  const totalLapses = log.lapses;
  let isLeech = card.isLeech || false;

  if (totalLapses > 8 && !isLeech) {
    isLeech = true;
  }

  const nowMs = now.getTime();
  const dueMs = log.due.getTime();
  const diffMs = dueMs - nowMs;
  const preciseInterval = Math.max(0, diffMs / (24 * 60 * 60 * 1000));

  let scheduledDaysInt = Math.round(preciseInterval);
  if (tentativeStatus !== 'learning' && tentativeStatus !== 'new') {
    scheduledDaysInt = Math.max(1, scheduledDaysInt);
  }


  return {
    ...card,
    dueDate: !isNaN(log.due.getTime()) ? log.due.toISOString() : addMinutes(now, 10).toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    scheduled_days: scheduledDaysInt, precise_interval: preciseInterval, reps: log.reps,
    lapses: log.lapses,
    state: log.state,
    last_review: (log.last_review && !isNaN(log.last_review.getTime())) ? log.last_review.toISOString() : now.toISOString(),
    first_review: card.first_review || ((card.reps || 0) === 0 ? now.toISOString() : undefined),
    status: tentativeStatus,
    interval: preciseInterval, learningStep: undefined, leechCount: totalLapses,
    isLeech
  };
};

export const isCardDue = (card: Card, now: Date = new Date()): boolean => {
  if (card.status === 'new' || card.state === State.New || (card.state === undefined && (card.reps || 0) === 0)) {
    return true;
  }

  const due = new Date(card.dueDate);

  // Short-interval cards (< 1 hour) use exact-time due checks (for learning steps)
  // Longer intervals use SRS-day boundary logic
  const ONE_HOUR_IN_DAYS = 1 / 24;
  if (card.interval < ONE_HOUR_IN_DAYS) {
    return due <= now;
  }

  const srsToday = getSRSDate(now);
  const nextSRSDay = addDays(srsToday, 1);

  return isBefore(due, nextSRSDay);
};

```

# src/db/client.ts

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Card } from '@/types';

export interface HistoryEntry {
  date: string;
  count: number;
  byLanguage?: Record<string, number>;
}

export interface LinguaFlowDB extends DBSchema {
  cards: {
    key: string;
    value: Card;
    indexes: { dueDate: string; status: string; last_review: string };
  };
  history: {
    key: string;
    value: HistoryEntry;
  };
}

const DB_NAME = 'linguaflow-db';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<LinguaFlowDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<LinguaFlowDB>(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        let cardStore;
        if (!db.objectStoreNames.contains('cards')) {
          cardStore = db.createObjectStore('cards', { keyPath: 'id' });
        } else {
          cardStore = transaction.objectStore('cards');
        }

        if (!cardStore.indexNames.contains('dueDate')) {
          cardStore.createIndex('dueDate', 'dueDate');
        }
        if (!cardStore.indexNames.contains('status')) {
          cardStore.createIndex('status', 'status');
        }
        if (!cardStore.indexNames.contains('last_review')) {
          cardStore.createIndex('last_review', 'last_review');
        }

        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'date' });
        }
      },
    });
  }

  return dbPromise;
};

export const resetDBCache = () => {
  dbPromise = null;
};

```

# src/db/dexie.ts

```typescript
import Dexie, { Table } from 'dexie';
import { Card, ReviewLog, UserSettings } from '@/types';
import { State } from 'ts-fsrs';

// User account for authentication
export interface LocalUser {
    id: string;
    username: string;
    passwordHash: string;
    created_at: string;
}

export interface LocalProfile {
    id: string; // This is the user_id
    username: string;
    xp: number;
    points: number;
    level: number;
    language_level?: string;
    initial_deck_generated?: boolean;
    created_at: string;
    updated_at: string;
}

export interface RevlogEntry {
    id: string;
    card_id: string;
    user_id?: string; // Added for multi-user
    grade: number;
    state: State;
    elapsed_days: number;
    scheduled_days: number;
    stability: number;
    difficulty: number;
    created_at: string;
}

export interface HistoryEntry {
    date: string;
    language: string;
    user_id?: string; // Added for multi-user
    count: number;
}

export type LocalSettings = Partial<UserSettings> & {
    id: string; // This is the user_id
    geminiApiKey?: string;
    googleTtsApiKey?: string;
    azureTtsApiKey?: string;
    azureRegion?: string;
    deviceId?: string;
    syncPath?: string;
    lastSync?: string;
};

export interface AggregatedStat {
    id: string;
    language: string;
    user_id?: string; // Added for multi-user
    metric: string;
    value: number;
    updated_at: string;
}

export class LinguaFlowDB extends Dexie {
    cards!: Table<Card>;
    revlog!: Table<RevlogEntry>;
    history!: Table<HistoryEntry>;
    profile!: Table<LocalProfile>;
    settings!: Table<LocalSettings>;
    aggregated_stats!: Table<AggregatedStat>;
    users!: Table<LocalUser>; // New users table

    constructor() {
        super('linguaflow-dexie');

        this.version(2).stores({
            cards: 'id, status, language, dueDate, isBookmarked, [status+language], [language+status], [language+status+interval]',
            revlog: 'id, card_id, created_at, [card_id+created_at]',
            history: '[date+language], date, language',
            profile: 'id',
            settings: 'id'
        });

        this.version(3).stores({
            cards: 'id, status, language, dueDate, isBookmarked, [status+language], [language+status], [language+status+interval]',
            revlog: 'id, card_id, created_at, [card_id+created_at]',
            history: '[date+language], date, language',
            profile: 'id',
            settings: 'id',
            aggregated_stats: 'id, [language+metric], updated_at'
        }).upgrade(async (tx) => {

            const allCards = await tx.table<Card>('cards').toArray();
            const languages = Array.from(new Set(allCards.map(c => c.language)));

            for (const language of languages) {
                const cardIds = new Set(
                    allCards.filter(c => c.language === language).map(c => c.id)
                );

                let totalXp = 0;
                let totalReviews = 0;

                await tx.table<RevlogEntry>('revlog').each(log => {
                    if (cardIds.has(log.card_id)) {
                        totalXp += 10; totalReviews++;
                    }
                });

                await tx.table<AggregatedStat>('aggregated_stats').bulkAdd([
                    {
                        id: `${language}:total_xp`,
                        language,
                        metric: 'total_xp',
                        value: totalXp,
                        updated_at: new Date().toISOString()
                    },
                    {
                        id: `${language}:total_reviews`,
                        language,
                        metric: 'total_reviews',
                        value: totalReviews,
                        updated_at: new Date().toISOString()
                    }
                ]);

            }

            let globalXp = 0;
            let globalReviews = 0;
            await tx.table<RevlogEntry>('revlog').each(() => {
                globalXp += 10;
                globalReviews++;
            });

            await tx.table<AggregatedStat>('aggregated_stats').bulkAdd([
                {
                    id: 'global:total_xp',
                    language: 'global',
                    metric: 'total_xp',
                    value: globalXp,
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'global:total_reviews',
                    language: 'global',
                    metric: 'total_reviews',
                    value: globalReviews,
                    updated_at: new Date().toISOString()
                }
            ]);

        });

        // Version 4: Multi-user support
        this.version(4).stores({
            cards: 'id, status, language, dueDate, isBookmarked, user_id, [status+language], [language+status], [language+status+interval], [user_id+language], [user_id+status+language]',
            revlog: 'id, card_id, user_id, created_at, [card_id+created_at]',
            history: '[date+language], date, language, user_id', // Keep original primary key
            profile: 'id',
            settings: 'id',
            aggregated_stats: 'id, [language+metric], [user_id+language+metric], updated_at',
            users: 'id, &username' // &username makes it unique
        });

        // Version 5: Optimized indexes for efficient queries
        this.version(5).stores({
            cards: 'id, status, language, dueDate, isBookmarked, user_id, [status+language], [language+status], [language+status+interval], [user_id+language], [user_id+status+language], [user_id+language+status], [user_id+language+dueDate]',
            revlog: 'id, card_id, user_id, created_at, [card_id+created_at], [user_id+created_at]',
            history: '[date+language], [user_id+date+language], [user_id+language], date, language, user_id',
            profile: 'id',
            settings: 'id',
            aggregated_stats: 'id, [language+metric], [user_id+language+metric], updated_at',
            users: 'id, &username'
        });

        this.cards.hook('deleting', (primKey, obj, transaction) => {
            return this.revlog.where('card_id').equals(primKey).delete();
        });
    }
}

export const db = new LinguaFlowDB();

// Password hashing utility using SHA-256
export const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

```

# src/db/index.ts

```typescript
import * as cardRepository from './repositories/cardRepository';
import * as historyRepository from './repositories/historyRepository';
import * as statsRepository from './repositories/statsRepository';

export { getDB, resetDBCache } from './client';

export const db = {
  getCards: cardRepository.getCards,
  saveCard: cardRepository.saveCard,
  deleteCard: cardRepository.deleteCard,
  saveAllCards: cardRepository.saveAllCards,
  clearAllCards: cardRepository.clearAllCards,
  getDueCards: cardRepository.getDueCards,
  getCramCards: cardRepository.getCramCards,
  deleteCardsByLanguage: cardRepository.deleteCardsByLanguage,
  getStats: statsRepository.getStats,
  getTodayReviewStats: statsRepository.getTodayReviewStats,
  getHistory: historyRepository.getHistory,
  incrementHistory: historyRepository.incrementHistory,
  saveFullHistory: historyRepository.saveFullHistory,
  clearHistory: historyRepository.clearHistory,
};

```

# src/db/repositories/aggregatedStatsRepository.ts

```typescript
import { db, AggregatedStat } from '@/db/dexie';
import { getCurrentUserId } from './cardRepository';

export const getAggregatedStat = async (language: string, metric: string): Promise<number> => {
    const userId = getCurrentUserId();
    if (!userId) return 0;

    const id = `${userId}:${language}:${metric}`;
    const stat = await db.aggregated_stats.get(id);
    return stat?.value ?? 0;
};

export const incrementStat = async (language: string, metric: string, delta: number): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) return;

    const id = `${userId}:${language}:${metric}`;
    const existing = await db.aggregated_stats.get(id);

    if (existing) {
        await db.aggregated_stats.update(id, {
            value: existing.value + delta,
            updated_at: new Date().toISOString()
        });
    } else {
        await db.aggregated_stats.add({
            id,
            language,
            user_id: userId,
            metric,
            value: delta,
            updated_at: new Date().toISOString()
        });
    }
};

export const bulkSetStats = async (stats: Array<{ language: string; metric: string; value: number }>): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) return;

    const records: AggregatedStat[] = stats.map(s => ({
        id: `${userId}:${s.language}:${s.metric}`,
        language: s.language,
        user_id: userId,
        metric: s.metric,
        value: s.value,
        updated_at: new Date().toISOString()
    }));

    await db.aggregated_stats.bulkPut(records);
};

export const recalculateAllStats = async (language?: string): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) return;

    // Use composite index for user+language query instead of filter
    const cards = language
        ? await db.cards.where('[user_id+language]').equals([userId, language]).toArray()
        : await db.cards.where('user_id').equals(userId).toArray();

    const cardIds = new Set(cards.map(c => c.id));

    let totalXp = 0;
    let totalReviews = 0;

    const logs = await db.revlog.where('user_id').equals(userId).toArray();
    logs.forEach(log => {
        if (!language || cardIds.has(log.card_id)) {
            totalXp += 10; totalReviews++;
        }
    });

    const statsToWrite: Array<{ language: string; metric: string; value: number }> = [];
    const lang = language || 'global';

    statsToWrite.push(
        { language: lang, metric: 'total_xp', value: totalXp },
        { language: lang, metric: 'total_reviews', value: totalReviews }
    );

    await bulkSetStats(statsToWrite);
};

```

# src/db/repositories/cardRepository.ts

```typescript
import { Card, CardStatus, Language, LanguageId } from '@/types';
import { getSRSDate } from '@/core/srs';
import { db, generateId } from '@/db/dexie';
import { SRS_CONFIG } from '@/constants';

const SESSION_KEY = 'linguaflow_current_user';

// Get current user ID from session storage
export const getCurrentUserId = (): string | null => {
  return localStorage.getItem(SESSION_KEY);
};

export const mapToCard = (data: any): Card => ({
  id: data.id,
  targetSentence: data.targetSentence,
  targetWord: data.targetWord || undefined,
  targetWordTranslation: data.targetWordTranslation || undefined,
  targetWordPartOfSpeech: data.targetWordPartOfSpeech || undefined,
  nativeTranslation: data.nativeTranslation,
  furigana: data.furigana || undefined,
  notes: data.notes ?? '',
  tags: data.tags ?? undefined,
  language: data.language,
  status: data.status,
  interval: data.interval ?? 0,
  easeFactor: data.easeFactor ?? 2.5,
  dueDate: data.dueDate,
  stability: data.stability ?? undefined,
  difficulty: data.difficulty ?? undefined,
  elapsed_days: data.elapsed_days ?? undefined,
  scheduled_days: data.scheduled_days ?? undefined,
  reps: data.reps ?? undefined,
  lapses: data.lapses ?? undefined,
  state: data.state ?? undefined,
  last_review: data.last_review ?? undefined,
  first_review: data.first_review ?? undefined,
  learningStep: data.learningStep ?? undefined,
  leechCount: data.leechCount ?? undefined,
  isLeech: data.isLeech ?? false,
  user_id: data.user_id ?? undefined,
});

export const getCards = async (): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cards = await db.cards.where('user_id').equals(userId).toArray();
  return cards;
};

export const getAllCardsByLanguage = async (language: Language): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .toArray();
  return cards;
};

export const getCardsForRetention = async (language: Language): Promise<Partial<Card>[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .toArray();

  return cards.map(c => ({
    id: c.id,
    dueDate: c.dueDate,
    status: c.status,
    stability: c.stability,
    state: c.state
  }));
};

export const getDashboardCounts = async (language: Language): Promise<{
  total: number;
  new: number;
  learned: number;
  hueDue: number;
}> => {
  const userId = getCurrentUserId();
  if (!userId) return { total: 0, new: 0, learned: 0, hueDue: 0 };

  const now = new Date();
  const srsToday = getSRSDate(now);
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(4);
  const cutoffISO = cutoffDate.toISOString();

  const allCards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .toArray();

  const total = allCards.length;
  const newCards = allCards.filter(c => c.status === 'new').length;
  const learned = allCards.filter(c => c.status === 'known').length;
  const due = allCards.filter(c => c.status !== 'known' && c.dueDate <= cutoffISO).length;

  return {
    total,
    new: newCards,
    learned,
    hueDue: due
  };
};

export const getCardsForDashboard = async (language: Language): Promise<Array<{
  id: string;
  dueDate: string | null;
  status: string;
  stability: number | null;
  state: number | null
}>> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .toArray();

  return cards.map(card => ({
    id: card.id,
    dueDate: card.dueDate,
    status: card.status,
    stability: card.stability ?? null,
    state: card.state ?? null
  }));
};

export const saveCard = async (card: Card) => {
  const userId = getCurrentUserId();
  if (!card.id) {
    card.id = generateId();
  }
  // Ensure user_id is set
  if (!card.user_id && userId) {
    card.user_id = userId;
  }
  await db.cards.put(card);
};

export const deleteCard = async (id: string) => {
  await db.transaction('rw', [db.cards, db.revlog], async () => {
    await db.cards.delete(id);
  });
};

export const deleteCardsBatch = async (ids: string[]) => {
  if (!ids.length) return;
  await db.transaction('rw', [db.cards, db.revlog], async () => {
    await db.cards.bulkDelete(ids);
  });
};

export const saveAllCards = async (cards: Card[]) => {
  if (!cards.length) return;
  const userId = getCurrentUserId();

  const cardsWithIds = cards.map(card => ({
    ...card,
    id: card.id || generateId(),
    user_id: card.user_id || userId || undefined
  }));

  await db.cards.bulkPut(cardsWithIds);
};

export const clearAllCards = async () => {
  const userId = getCurrentUserId();
  if (!userId) return;

  // Only clear cards for current user
  await db.cards.where('user_id').equals(userId).delete();
};

export const getDueCards = async (now: Date, language: Language): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const srsToday = getSRSDate(now);
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);

  const cutoffISO = cutoffDate.toISOString();

  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .filter(card => card.status !== 'known' && card.dueDate <= cutoffISO)
    .toArray();

  return cards.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

export const getCramCards = async (limit: number, tag?: string, language?: Language): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language || LanguageId.Polish])
    .toArray();

  if (tag) {
    cards = cards.filter(c => c.tags?.includes(tag));
  }

  const shuffled = cards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};

export const deleteCardsByLanguage = async (language: Language) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const cardsToDelete = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .toArray();

  const ids = cardsToDelete.map(c => c.id);
  if (ids.length > 0) {
    await db.cards.bulkDelete(ids);
  }
};

export const getCardSignatures = async (language: Language): Promise<Array<{ target_sentence: string; language: string }>> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .toArray();

  return cards.map(c => ({
    target_sentence: c.targetSentence,
    language: c.language
  }));
};

export const getTags = async (language?: Language): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let cards: Card[];

  if (language) {
    cards = await db.cards
      .where('[user_id+language]')
      .equals([userId, language])
      .toArray();
  } else {
    cards = await db.cards
      .where('user_id')
      .equals(userId)
      .toArray();
  }

  const uniqueTags = new Set<string>();
  cards.forEach((card) => {
    if (card.tags) {
      card.tags.forEach((tag: string) => uniqueTags.add(tag));
    }
  });

  return Array.from(uniqueTags).sort();
};

export const getLearnedWords = async (language: Language): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .filter(card => card.status !== 'new' && card.targetWord != null)
    .toArray();

  const words = cards
    .map(card => card.targetWord)
    .filter((word): word is string => word !== null && word !== undefined);

  return [...new Set(words)];
};

export const getCardByTargetWord = async (targetWord: string, language: Language): Promise<Card | undefined> => {
  const userId = getCurrentUserId();
  if (!userId) return undefined;

  const lowerWord = targetWord.toLowerCase();
  const cards = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .filter(card => card.targetWord?.toLowerCase() === lowerWord)
    .toArray();

  return cards[0];
};

```

# src/db/repositories/historyRepository.ts

```typescript
import { db } from '@/db/dexie';
import { ReviewHistory, Language, LanguageId } from '@/types';
import { format } from 'date-fns';
import { getCurrentUserId } from './cardRepository';

export const getHistory = async (language?: Language): Promise<ReviewHistory> => {
  const userId = getCurrentUserId();
  if (!userId) return {};

  // Use composite index for user-scoped query
  let logs = await db.revlog
    .where('user_id')
    .equals(userId)
    .toArray();

  if (language) {
    // Use composite index for user+language card lookup
    const cards = await db.cards
      .where('[user_id+language]')
      .equals([userId, language])
      .toArray();
    const cardIds = new Set(cards.map(c => c.id));
    logs = logs.filter(log => cardIds.has(log.card_id));
  }

  return logs.reduce<ReviewHistory>((acc, entry) => {
    const dateKey = format(new Date(entry.created_at), 'yyyy-MM-dd');
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});
};

export const incrementHistory = async (
  date: string,
  delta: number = 1,
  language: Language = LanguageId.Polish
) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  // Use composite index [user_id+date+language] for efficient lookup
  const existing = await db.history
    .where('[user_id+date+language]')
    .equals([userId, date, language])
    .first();

  if (existing) {
    // Update using the composite primary key
    await db.history.update([date, language], {
      count: existing.count + delta
    });
  } else {
    await db.history.add({
      date,
      language,
      user_id: userId,
      count: delta
    });
  }
};

export const saveFullHistory = async (history: ReviewHistory, language: Language = LanguageId.Polish) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const entries = Object.entries(history).map(([date, count]) => ({
    date,
    language,
    user_id: userId,
    count: typeof count === 'number' ? count : 0
  }));

  if (entries.length === 0) return;

  await db.history.bulkPut(entries);
};

export const clearHistory = async (language?: Language) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  if (language) {
    // Use composite index for user+language
    const historyToDelete = await db.history
      .where('[user_id+language]')
      .equals([userId, language])
      .toArray();

    for (const entry of historyToDelete) {
      await db.history.delete([entry.date, entry.language]);
    }
  } else {
    const historyToDelete = await db.history
      .where('user_id')
      .equals(userId)
      .toArray();

    for (const entry of historyToDelete) {
      await db.history.delete([entry.date, entry.language]);
    }
  }
};

```

# src/db/repositories/revlogRepository.ts

```typescript
import { db, generateId, RevlogEntry } from '@/db/dexie';
import { ReviewLog, Card, Grade } from '@/types';
import { State } from 'ts-fsrs';
import { incrementStat } from './aggregatedStatsRepository';
import { getCurrentUserId } from './cardRepository';

const mapGradeToNumber = (grade: Grade): number => {
  switch (grade) {
    case 'Again': return 1;
    case 'Hard': return 2;
    case 'Good': return 3;
    case 'Easy': return 4;
  }
};

export const addReviewLog = async (
  card: Card,
  grade: Grade,
  elapsedDays: number,
  scheduledDays: number
) => {
  const userId = getCurrentUserId();

  const entry: RevlogEntry = {
    id: generateId(),
    card_id: card.id,
    user_id: userId || undefined,
    grade: mapGradeToNumber(grade),
    state: card.state ?? State.New,
    elapsed_days: elapsedDays,
    scheduled_days: scheduledDays,
    stability: card.stability ?? 0,
    difficulty: card.difficulty ?? 0,
    created_at: new Date().toISOString()
  };

  await db.revlog.add(entry);

  await incrementStat(card.language || 'polish', 'total_xp', 10);
  await incrementStat(card.language || 'polish', 'total_reviews', 1);

  await incrementStat('global', 'total_xp', 10);
  await incrementStat('global', 'total_reviews', 1);
};


export const getAllReviewLogs = async (language?: string): Promise<ReviewLog[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let logs = await db.revlog
    .where('user_id')
    .equals(userId)
    .toArray();

  if (language) {
    const cards = await db.cards
      .where('language')
      .equals(language)
      .filter(c => c.user_id === userId)
      .toArray();
    const cardIds = new Set(cards.map(c => c.id));
    logs = logs.filter(log => cardIds.has(log.card_id));
  }

  logs.sort((a, b) => a.created_at.localeCompare(b.created_at));

  return logs as unknown as ReviewLog[];
};

```

# src/db/repositories/settingsRepository.ts

```typescript
import { db, LocalSettings } from '../dexie';
import { UserSettings } from '@/types';

export interface UserApiKeys {
    geminiApiKey?: string;
    googleTtsApiKey?: string;
    azureTtsApiKey?: string;
    azureRegion?: string;
}

const SETTINGS_KEY = 'linguaflow_api_keys';
const UI_SETTINGS_KEY = 'language_mining_settings';

export async function getUserSettings(userId: string): Promise<UserApiKeys | null> {
    try {
        const settings = await db.settings.get(userId);
        if (!settings) return null;

        return settings as UserApiKeys;
    } catch (error) {
        console.error('Failed to fetch user settings:', error);
        return null;
    }
}

export async function getFullSettings(userId: string): Promise<LocalSettings | null> {
    try {
        const settings = await db.settings.get(userId);
        return settings || null;
    } catch (error) {
        console.error('Failed to fetch full settings:', error);
        return null;
    }
}

export async function updateUserSettings(userId: string, settings: Partial<LocalSettings>): Promise<void> {
    try {
        const existing = await db.settings.get(userId);
        const merged = { ...existing, ...settings, id: userId };
        await db.settings.put(merged);
    } catch (error) {
        console.error('Failed to update user settings:', error);
        throw error;
    }
}

export async function getSystemSetting<T>(key: keyof LocalSettings, userId: string = 'local-user'): Promise<T | undefined> {
    try {
        const settings = await db.settings.get(userId);
        return settings?.[key] as T;
    } catch (error) {
        console.error(`Failed to fetch system setting ${key}:`, error);
        return undefined;
    }
}

export async function setSystemSetting(key: keyof LocalSettings, value: any, userId: string = 'local-user'): Promise<void> {
    try {
        const existing = await db.settings.get(userId) || { id: userId };
        await db.settings.put({ ...existing, [key]: value });
    } catch (error) {
        console.error(`Failed to update system setting ${key}:`, error);
        throw error;
    }
}

export async function migrateLocalSettingsToDatabase(userId: string): Promise<boolean> {
    try {
        const existingDb = await db.settings.get(userId);
        
        const storedKeys = localStorage.getItem(SETTINGS_KEY);
        const storedUi = localStorage.getItem(UI_SETTINGS_KEY);

        if (existingDb) {
             if (storedKeys) localStorage.removeItem(SETTINGS_KEY);
             if (storedUi) localStorage.removeItem(UI_SETTINGS_KEY);
             return false;
        }

        if (!storedKeys && !storedUi) return false;

        const apiKeys = storedKeys ? JSON.parse(storedKeys) : {};
        const uiSettings = storedUi ? JSON.parse(storedUi) : {};

        const merged: LocalSettings = {
            id: userId,
            ...uiSettings,
            ...apiKeys
        };

        await db.settings.put(merged);
        
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem(UI_SETTINGS_KEY);

        return true;
    } catch (error) {
        console.error('Failed to migrate settings:', error);
        return false;
    }
}

```

# src/db/repositories/statsRepository.ts

```typescript
import { getSRSDate } from '@/core/srs';
import { SRS_CONFIG } from '@/constants';
import { db } from '@/db/dexie';
import { differenceInCalendarDays, parseISO, addDays, format, subDays, startOfDay, parse } from 'date-fns';
import {
  getCardsForDashboard,
  getDashboardCounts,
  getDueCards,
  getCurrentUserId
} from './cardRepository';

export const getDashboardStats = async (language?: string) => {
  const userId = getCurrentUserId();
  const counts = { new: 0, learning: 0, graduated: 0, known: 0 };
  let languageXp = 0;

  if (language && userId) {
    // Use optimized composite index queries with user_id
    const [newCount, knownCount, learningCount, graduatedCount] = await Promise.all([
      db.cards.where('[user_id+language+status]').equals([userId, language, 'new']).count(),
      db.cards.where('[user_id+language+status]').equals([userId, language, 'known']).count(),
      db.cards.where('[language+status+interval]')
        .between([language, 'review', 0], [language, 'review', 30], true, false)
        .filter(c => c.user_id === userId)
        .count(),
      db.cards.where('[language+status+interval]')
        .between([language, 'review', 30], [language, 'review', 180], true, false)
        .filter(c => c.user_id === userId)
        .count(),
    ]);

    const xpStat = await db.aggregated_stats.get(`${userId}:${language}:total_xp`);
    languageXp = xpStat?.value ?? 0;

    const implicitKnownCount = await db.cards.where('[language+status+interval]')
      .aboveOrEqual([language, 'review', 180])
      .filter(c => c.user_id === userId)
      .count();

    counts.new = newCount;
    counts.learning = learningCount;
    counts.graduated = graduatedCount;
    counts.known = knownCount + implicitKnownCount;

  } else {

    const [newCount, knownCountByStatus] = await Promise.all([
      db.cards.where('status').equals('new').count(),
      db.cards.where('status').equals('known').count()
    ]);


    let learning = 0;
    let graduated = 0;
    let implicitKnown = 0;

    await db.cards.where('status').equals('review').each(c => {
      const interval = c.interval || 0;
      if (interval < 30) learning++;
      else if (interval < 180) graduated++;
      else implicitKnown++;
    });

    counts.new = newCount;
    counts.known = knownCountByStatus + implicitKnown;
    counts.learning = learning;
    counts.graduated = graduated;

    const globalXpStat = await db.aggregated_stats.get('global:total_xp');
    languageXp = globalXpStat?.value ?? 0;
  }

  const daysToShow = 14;
  const today = startOfDay(new Date());
  const forecast = new Array(daysToShow).fill(0).map((_, i) => ({
    day: format(addDays(today, i), 'd'),
    fullDate: addDays(today, i).toISOString(),
    count: 0
  }));

  const endDate = addDays(today, daysToShow);

  let query = db.cards.where('dueDate').between(today.toISOString(), endDate.toISOString(), true, false);

  if (language) {
    query = query.filter(c => c.language === language);
  }

  query = query.filter(c => c.status !== 'new' && c.status !== 'known');

  await query.each(card => {
    if (!card.dueDate) return;
    const due = parseISO(card.dueDate);
    const diff = differenceInCalendarDays(due, today);
    if (diff >= 0 && diff < daysToShow) {
      forecast[diff].count++;
    }
  });

  return { counts, forecast, languageXp };
};

export const getStats = async (language?: string) => {
  if (language) {
    const counts = await getDashboardCounts(language as any);
    return {
      total: counts.total,
      due: counts.hueDue,
      learned: counts.learned
    };
  }


  const srsToday = getSRSDate(new Date());
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);
  const cutoffIso = cutoffDate.toISOString();

  const total = await db.cards.count();
  const due = await db.cards
    .where('dueDate').below(cutoffIso)
    .filter(c => c.status !== 'known')
    .count();
  const learned = await db.cards
    .where('status').anyOf('graduated', 'known')
    .count();

  return { total, due, learned };
};

export const getTodayReviewStats = async (language?: string) => {
  const userId = getCurrentUserId();
  if (!userId) return { newCards: 0, reviewCards: 0 };

  const srsToday = getSRSDate(new Date());
  const rangeStart = new Date(srsToday);
  rangeStart.setHours(rangeStart.getHours() + SRS_CONFIG.CUTOFF_HOUR);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  // Use user_id+created_at composite index for efficient filtering
  const logs = await db.revlog
    .where('[user_id+created_at]')
    .between(
      [userId, rangeStart.toISOString()],
      [userId, rangeEnd.toISOString()],
      true,
      false
    )
    .toArray();

  let newCards = 0;
  let reviewCards = 0;

  if (language) {
    // Get card IDs for this language using composite index
    const cardIds = await db.cards
      .where('[user_id+language]')
      .equals([userId, language])
      .primaryKeys();
    const cardIdSet = new Set(cardIds);

    logs.forEach(entry => {
      if (cardIdSet.has(entry.card_id)) {
        if (entry.state === 0) newCards++;
        else reviewCards++;
      }
    });
  } else {
    logs.forEach(entry => {
      if (entry.state === 0) newCards++;
      else reviewCards++;
    });
  }

  return { newCards, reviewCards };
};

export const getRevlogStats = async (language: string, days = 30) => {
  const userId = getCurrentUserId();
  if (!userId) return { activity: [], grades: [], retention: [] };

  const startDate = startOfDay(subDays(new Date(), days - 1));
  const startDateIso = startDate.toISOString();

  // Use composite index for efficient user+language card lookup
  const cardIds = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .primaryKeys();
  const cardIdSet = new Set(cardIds);

  // Use composite index for user+created_at range query
  const logs = await db.revlog
    .where('[user_id+created_at]')
    .between([userId, startDateIso], [userId, '\uffff'], true, true)
    .filter(log => cardIdSet.has(log.card_id))
    .toArray();


  const activityMap = new Map<string, { date: string; count: number; pass: number }>();
  const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };

  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
    activityMap.set(date, { date, count: 0, pass: 0 });
  }

  logs.forEach(log => {
    // Validate date string first
    if (!log.created_at) return;

    const dateObj = new Date(log.created_at);
    // distinct check for Invalid Date
    if (isNaN(dateObj.getTime())) return;

    const dateKey = format(dateObj, 'yyyy-MM-dd');
    const dayData = activityMap.get(dateKey);
    if (dayData) {
      dayData.count++;
      if (log.grade >= 2) dayData.pass++;
    }

    switch (log.grade) {
      case 1: gradeCounts.Again++; break;
      case 2: gradeCounts.Hard++; break;
      case 3: gradeCounts.Good++; break;
      case 4: gradeCounts.Easy++; break;
    }
  });

  const activityData = Array.from(activityMap.values());

  const retentionData = activityData.map((day) => {
    const dateObj = parse(day.date, 'yyyy-MM-dd', new Date());
    return {
      date: format(dateObj, 'MMM d'),
      rate: day.count > 0 ? (day.pass / day.count) * 100 : null
    };
  });

  return {
    activity: activityData.map((d) => {
      const dateObj = parse(d.date, 'yyyy-MM-dd', new Date());
      return { ...d, label: format(dateObj, 'dd') };
    }),
    grades: [
      { name: 'Again', value: gradeCounts.Again, color: '#ef4444' },
      { name: 'Hard', value: gradeCounts.Hard, color: '#f97316' },
      { name: 'Good', value: gradeCounts.Good, color: '#22c55e' },
      { name: 'Easy', value: gradeCounts.Easy, color: '#3b82f6' },
    ],
    retention: retentionData
  };
};

```

# src/db/workers/stats.worker.ts

```typescript
import { format, subDays } from 'date-fns';

interface Log {
  created_at: string;
  grade: number;
  card_id: string;
}

interface ActivityWorkerInput {
  action: 'calculate_activity';
  logs: Log[];
  days: number;
  cardIds: string[];
}

interface StreakWorkerInput {
  action: 'calculate_streaks';
  history: Record<string, number>; todayStr: string;
  yesterdayStr: string;
}

type WorkerInput = ActivityWorkerInput | StreakWorkerInput;

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const input = e.data;

  if (input.action === 'calculate_activity') {
    const { logs, days, cardIds } = input;
    const cardIdSet = new Set(cardIds);

    const filteredLogs = logs.filter(log => cardIdSet.has(log.card_id));

    const activityMap = new Map<string, { date: string; count: number; pass: number; fail: number }>();
    const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };

    const now = new Date();

    for (let i = 0; i < days; i++) {
      const d = subDays(now, i);
      const key = format(d, 'yyyy-MM-dd');
      activityMap.set(key, {
        date: key,
        count: 0,
        pass: 0,
        fail: 0
      });
    }

    filteredLogs.forEach(log => {
      const date = new Date(log.created_at);
      const key = format(date, 'yyyy-MM-dd');

      if (activityMap.has(key)) {
        const entry = activityMap.get(key)!;
        entry.count++;
        if (log.grade === 1) {
          entry.fail++;
        } else {
          entry.pass++;
        }
      }

      if (log.grade === 1) gradeCounts.Again++;
      else if (log.grade === 2) gradeCounts.Hard++;
      else if (log.grade === 3) gradeCounts.Good++;
      else if (log.grade === 4) gradeCounts.Easy++;
    });

    const activityData = Array.from(activityMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    self.postMessage({
      activityData,
      gradeCounts,
      totalReviews: filteredLogs.length
    });
  } else if (input.action === 'calculate_streaks') {
    const { history, todayStr, yesterdayStr } = input;

    if (!history || Object.keys(history).length === 0) {
      self.postMessage({
        currentStreak: 0,
        longestStreak: 0,
        totalReviews: 0
      });
      return;
    }

    const sortedDates = Object.keys(history).sort();

    const totalReviews = Object.values(history).reduce(
      (acc, val) => acc + (typeof val === 'number' ? val : 0),
      0
    );

    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    let currentStreak = 0;

    const hasToday = history[todayStr];
    const hasYesterday = history[yesterdayStr];

    if (hasToday || hasYesterday) {
      currentStreak = 1;

      const dateSet = new Set(sortedDates);

      const startDateStr = hasToday ? todayStr : yesterdayStr;
      let checkDate = new Date(startDateStr);
      checkDate.setDate(checkDate.getDate() - 1);

      const maxDays = Math.min(sortedDates.length, 3650);

      for (let i = 0; i < maxDays; i++) {
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        if (dateSet.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    self.postMessage({
      currentStreak,
      longestStreak,
      totalReviews
    });
  }
};


```

# src/features/auth/AuthPage.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, User as UserIcon, Lock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { LanguageLevelSelector, DeckGenerationStep, AuthLayout } from './components';
import { LanguageSelector } from './components/LanguageSelector';
import { generateInitialDeck } from '@/features/generator/services/deckGeneration';
import { saveAllCards } from '@/db/repositories/cardRepository';
import { updateUserSettings } from '@/db/repositories/settingsRepository';
import { Difficulty, Card as CardType, Language, LanguageId } from '@/types';
import { Loader } from '@/components/ui/loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { POLISH_BEGINNER_DECK } from '@/assets/starter-decks/polish';
import { NORWEGIAN_BEGINNER_DECK } from '@/assets/starter-decks/norwegian';
import { JAPANESE_BEGINNER_DECK } from '@/assets/starter-decks/japanese';
import { SPANISH_BEGINNER_DECK } from '@/assets/starter-decks/spanish';
import { GERMAN_BEGINNER_DECK } from '@/assets/starter-decks/german';
import { v4 as uuidv4 } from 'uuid';
import { LocalUser } from '@/db/dexie';

type AuthMode = 'login' | 'register';
type SetupStep = 'auth' | 'language' | 'level' | 'deck';

const BEGINNER_DECKS: Record<Language, CardType[]> = {
  [LanguageId.Polish]: POLISH_BEGINNER_DECK,
  [LanguageId.Norwegian]: NORWEGIAN_BEGINNER_DECK,
  [LanguageId.Japanese]: JAPANESE_BEGINNER_DECK,
  [LanguageId.Spanish]: SPANISH_BEGINNER_DECK,
  [LanguageId.German]: GERMAN_BEGINNER_DECK,
};

export const AuthPage: React.FC = () => {
  const { markInitialDeckGenerated } = useProfile();
  const { register, login, getRegisteredUsers } = useAuth();

  const settings = useSettingsStore(s => s.settings);
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const [loading, setLoading] = useState(false);

  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [existingUsers, setExistingUsers] = useState<LocalUser[]>([]);
  const [setupStep, setSetupStep] = useState<SetupStep>('auth');
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const users = await getRegisteredUsers();
      setExistingUsers(users);
      // If there are existing users, default to login mode
      if (users.length > 0) {
        setAuthMode('login');
      }
    };
    loadUsers();
  }, [getRegisteredUsers]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === 'register') {
      if (!username.trim() || username.length < 3) {
        toast.error('Username must be at least 3 characters');
        return;
      }
      if (!password || password.length < 4) {
        toast.error('Password must be at least 4 characters');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      setLoading(true);
      try {
        const result = await register(username.trim(), password);
        setCurrentUserId(result.user.id);
        toast.success('Account created!');
        setSetupStep('language');
      } catch (error: any) {
        toast.error(error.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      // Login
      if (!username.trim()) {
        toast.error('Please enter your username');
        return;
      }
      if (!password) {
        toast.error('Please enter your password');
        return;
      }

      setLoading(true);
      try {
        await login(username.trim(), password);
        // Login successful - AuthContext sets user state, App.tsx will re-render
      } catch (error: any) {
        toast.error(error.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLanguageToggle = (language: Language) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const handleLanguageContinue = () => {
    if (selectedLanguages.length > 0) {
      updateSettings({ language: selectedLanguages[0] });
      setSetupStep('level');
    }
  };

  const handleLevelSelected = (level: Difficulty) => {
    setSelectedLevel(level);
    setSetupStep('deck');
  };

  const handleDeckSetup = async (languages: Language[], useAI: boolean, apiKey?: string) => {
    if (!selectedLevel || !currentUserId) return;
    setLoading(true);

    try {
      if (useAI && apiKey) {
        await updateUserSettings(currentUserId, { geminiApiKey: apiKey });
      }

      let allCards: CardType[] = [];

      if (useAI && apiKey) {
        for (const language of languages) {
          const languageCards = await generateInitialDeck({
            language,
            proficiencyLevel: selectedLevel,
            apiKey,
          });
          allCards = [...allCards, ...languageCards];
        }
        toast.success(`Generated ${allCards.length} personalized cards for ${languages.length} language${languages.length > 1 ? 's' : ''}!`);
      } else {
        for (const language of languages) {
          const rawDeck = BEGINNER_DECKS[language] || [];
          const languageCards = rawDeck.map(c => ({
            ...c,
            id: uuidv4(),
            dueDate: new Date().toISOString(),
            tags: [...(c.tags || []), selectedLevel],
            user_id: currentUserId
          }));
          allCards = [...allCards, ...languageCards];
        }
        toast.success(`Loaded ${allCards.length} starter cards for ${languages.length} language${languages.length > 1 ? 's' : ''}!`);
      }

      // Add user_id to all cards
      allCards = allCards.map(c => ({ ...c, user_id: currentUserId }));

      if (allCards.length > 0) {
        await saveAllCards(allCards);
      }

      await markInitialDeckGenerated(currentUserId);

      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="text-center my-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        LinguaFlow
      </h1>
      <p className="text-sm text-muted-foreground mt-2 font-medium">
        {authMode === 'login' ? 'Welcome back' : 'Begin your journey'}
      </p>
    </div>
  );

  const renderAuthStep = () => (
    <form onSubmit={handleAuthSubmit} className="space-y-4">
      {/* Auth Mode Toggle */}
      <Tabs value={authMode} onValueChange={(val) => setAuthMode(val as AuthMode)} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Existing users hint */}
      {authMode === 'login' && existingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 mb-4">
          <Users size={14} />
          <span>
            {existingUsers.length} user{existingUsers.length > 1 ? 's' : ''} registered: {existingUsers.map(u => u.username).join(', ')}
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-xs font-medium text-muted-foreground ml-1">
          Username
        </Label>
        <div className="relative group/input">
          <Input
            id="username"
            type="text"
            placeholder={authMode === 'login' ? 'Enter your username' : 'Choose a username'}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-11"
            required
            minLength={3}
            maxLength={20}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">
            <UserIcon size={16} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-medium text-muted-foreground ml-1">
          Password
        </Label>
        <div className="relative group/input">
          <Input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-11"
            required
            minLength={4}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">
            <Lock size={16} />
          </div>
        </div>
      </div>

      {authMode === 'register' && (
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground ml-1">
            Confirm Password
          </Label>
          <div className="relative group/input">
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-11"
              required
              minLength={4}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">
              <Lock size={16} />
            </div>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? (
          <Loader size="sm" />
        ) : (
          <>
            {authMode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} />
          </>
        )}
      </Button>
    </form>
  );

  if (loading && setupStep === 'deck') {
    return (
      <AuthLayout>
        <Card className="text-center py-12 p-6">
          <Loader size="lg" />
          <h3 className="mt-4 text-lg font-medium tracking-wide ">Forging your deck...</h3>
          <p className="mt-2 text-muted-foreground text-sm max-w-xs mx-auto">
            Preparing your personalized learning path.
          </p>
        </Card>
      </AuthLayout>
    );
  }

  if (setupStep === 'language') {
    return (
      <AuthLayout className="max-w-2xl">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSetupStep('auth')}>
              <ArrowLeft size={16} /> Back
            </Button>
            <h2 className="text-xl font-bold">Select Languages</h2>
          </div>
          <LanguageSelector
            selectedLanguages={selectedLanguages}
            onToggle={handleLanguageToggle}
            onContinue={handleLanguageContinue}
          />
        </Card>
      </AuthLayout>
    );
  }

  if (setupStep === 'level') {
    return (
      <AuthLayout className="max-w-2xl">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSetupStep('language')}>
              <ArrowLeft size={16} /> Back
            </Button>
            <h2 className="text-xl font-bold">Select Proficiency</h2>
          </div>
          <LanguageLevelSelector
            selectedLevel={selectedLevel}
            onSelectLevel={handleLevelSelected}
          />
        </Card>
      </AuthLayout>
    );
  }

  if (setupStep === 'deck') {
    return (
      <AuthLayout className="max-w-2xl">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSetupStep('level')}>
              <ArrowLeft size={16} /> Back
            </Button>
            <h2 className="text-xl font-bold">Deck Configuration</h2>
          </div>
          <DeckGenerationStep
            languages={selectedLanguages}
            proficiencyLevel={selectedLevel!}
            onComplete={handleDeckSetup}
          />
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="py-8 px-6 md:px-8">
        {renderHeader()}
        {renderAuthStep()}

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Your data is stored locally on this device
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
};

```

# src/features/auth/LoginScreen.tsx

```typescript
import React from 'react';
import { LogIn, Command } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background px-6 text-center text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center ">
          <Command size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LinguaFlow</h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Sign in to sync your decks, earn XP, and climb the global leaderboard.
          </p>
        </div>
      </div>
      <Button
        onClick={signInWithGoogle}
        disabled={loading}
        className="rounded-full px-6 py-6 text-base font-medium"
      >
        <LogIn size={18} className="mr-2" />
        Continue with Google
      </Button>
      <p className="text-[11px] uppercase text-muted-foreground tracking-[0.2em]">
        Powered by Supabase Auth
      </p>
    </div>
  );
};

```

# src/features/auth/OnboardingFlow.tsx

```typescript
import React, { useState } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { LanguageLevelSelector } from './components/LanguageLevelSelector';
import { LanguageSelector } from './components/LanguageSelector';
import { DeckGenerationStep } from './components/DeckGenerationStep';
import { Difficulty, Card, Language, LanguageId } from '@/types';
import { toast } from 'sonner';
import { updateUserSettings } from '@/db/repositories/settingsRepository';
import { generateInitialDeck } from '@/features/generator/services/deckGeneration';
import { saveAllCards } from '@/db/repositories/cardRepository';
import { Command, LogOut } from 'lucide-react';
import { POLISH_BEGINNER_DECK, NORWEGIAN_BEGINNER_DECK, JAPANESE_BEGINNER_DECK, SPANISH_BEGINNER_DECK, GERMAN_BEGINNER_DECK } from '@/assets/starter-decks';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';

const BEGINNER_DECKS: Record<Language, Card[]> = {
  [LanguageId.Polish]: POLISH_BEGINNER_DECK,
  [LanguageId.Norwegian]: NORWEGIAN_BEGINNER_DECK,
  [LanguageId.Japanese]: JAPANESE_BEGINNER_DECK,
  [LanguageId.Spanish]: SPANISH_BEGINNER_DECK,
  [LanguageId.German]: GERMAN_BEGINNER_DECK,
};

export const OnboardingFlow: React.FC = () => {
  const { user, signOut } = useAuth();
  const { markInitialDeckGenerated } = useProfile();
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const [step, setStep] = useState<'language' | 'level' | 'deck'>('language');
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);

  const handleLanguageToggle = (language: Language) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const handleLanguageContinue = () => {
    if (selectedLanguages.length > 0) {
      // Set the first selected language as the primary language
      updateSettings({ language: selectedLanguages[0] });
      setStep('level');
    }
  };

  const handleLevelSelected = (level: Difficulty) => {
    setSelectedLevel(level);
    setStep('deck');
  };

  const handleDeckComplete = async (languages: Language[], useAI: boolean, apiKey?: string) => {
    if (!user || !selectedLevel) return;

    try {
      if (useAI && apiKey) {
        await updateUserSettings(user.id, { geminiApiKey: apiKey });
      }

      let allCards: Card[] = [];

      if (useAI && apiKey) {
        // For AI generation, generate for all selected languages
        for (const language of languages) {
          const languageCards = await generateInitialDeck({
            language,
            proficiencyLevel: selectedLevel,
            apiKey,
          });
          allCards = [...allCards, ...languageCards];
        }
      } else {
        // Load default decks for all selected languages
        for (const language of languages) {
          const rawDeck = BEGINNER_DECKS[language] || [];
          const languageCards = rawDeck.map(c => ({
            ...c,
            id: uuidv4(),
            dueDate: new Date().toISOString(),
            tags: [...(c.tags || []), selectedLevel],
            user_id: user.id
          }));
          allCards = [...allCards, ...languageCards];
        }
      }

      // Ensure all cards have user_id
      allCards = allCards.map(c => ({ ...c, user_id: user.id }));

      if (allCards.length > 0) {
        console.log('[OnboardingFlow] Saving', allCards.length, 'cards across', languages.length, 'languages...');
        await saveAllCards(allCards);
        toast.success(`Loaded ${allCards.length} cards for ${languages.length} language${languages.length > 1 ? 's' : ''}.`);
        console.log('[OnboardingFlow] Cards saved.');
      }

      console.log('[OnboardingFlow] Marking initial deck as generated...');
      await markInitialDeckGenerated();

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Onboarding failed:', error);
      toast.error(error.message || 'Setup failed. Please try again.');
      throw error;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 md:p-12 selection:bg-foreground selection:text-background">

      {/* Header / Nav */}
      <div className="fixed top-6 right-6">
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2 h-auto p-2"
        >
          <LogOut size={14} />
          Sign Out
        </Button>
      </div>

      <div className="w-full max-w-[320px] flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Branding */}
        <div className="flex flex-col gap-6 items-start">
          <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center rounded-[2px]">
            <Command size={16} strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-light tracking-tight text-foreground">
              {step === 'language' ? 'Select Languages.' : (step === 'level' ? 'Proficiency Level.' : 'Initialize Decks.')}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              {step === 'language' ? 'Step 1 of 3' : (step === 'level' ? 'Step 2 of 3' : 'Step 3 of 3')}
            </p>
          </div>
        </div>

        {/* Steps */}
        {step === 'language' && (
          <LanguageSelector
            selectedLanguages={selectedLanguages}
            onToggle={handleLanguageToggle}
            onContinue={handleLanguageContinue}
          />
        )}

        {step === 'level' && (
          <div className="flex flex-col gap-6">
            <LanguageLevelSelector
              selectedLevel={selectedLevel}
              onSelectLevel={handleLevelSelected}
            />
            <Button
              variant="link"
              onClick={() => setStep('language')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center h-auto p-0"
            >
              Back to Language Selection
            </Button>
          </div>
        )}

        {step === 'deck' && selectedLevel && (
          <div className="flex flex-col gap-6">
            <DeckGenerationStep
              languages={selectedLanguages}
              proficiencyLevel={selectedLevel}
              onComplete={handleDeckComplete}
            />
            <Button
              variant="link"
              onClick={() => setStep('level')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center h-auto p-0"
            >
              Back to Level Selection
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

```

# src/features/auth/UsernameSetup.tsx

```typescript
import React, { useState } from 'react';
import { ArrowRight, User } from 'lucide-react';
import { ButtonLoader } from '@/components/ui/loading';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const UsernameSetup: React.FC = () => {
  const { updateUsername, user } = useAuth();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    if (username.length < 3) {
      toast.error("Minimum 3 characters required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUsername(username.trim());
      toast.success("Identity established.");
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 selection:bg-foreground selection:text-background">

      <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-700 space-y-12">

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-4">
            Step 02 / Identity
          </span>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground leading-tight">
            How should we <br /> call you?
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="relative group">
            <Input
              className="w-full bg-transparent border-b border-border border-t-0 border-x-0 px-0 py-4 text-2xl md:text-3xl font-light outline-none transition-all focus-visible:ring-0 focus:border-foreground placeholder:text-muted-foreground/20 rounded-none text-foreground h-auto shadow-none"
              placeholder="Type name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              minLength={3}
              maxLength={20}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500">
              <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                {username.length} / 20
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              ID: {user?.email}
            </div>

            <Button
              type="submit"
              variant="ghost"
              className="group flex items-center gap-3 text-sm font-medium hover:text-foreground/70 transition-colors disabled:opacity-50"
              disabled={isSubmitting || !username}
            >
              {isSubmitting ? 'Processing' : 'Confirm'}
              {isSubmitting ? (
                <ButtonLoader />
              ) : (
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

```

# src/features/auth/components/AuthLayout.tsx

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className={cn("w-full max-w-md", className)}>
        {children}
      </div>
    </div>
  );
};

```

# src/features/auth/components/DeckGenerationStep.tsx

```typescript
import React, { useState } from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import { motion } from "framer-motion";
import { Difficulty, Language, LanguageId, LANGUAGE_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import { ButtonLoader } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeckGenerationStepProps {
    languages: Language[];
    proficiencyLevel: Difficulty;
    onComplete: (languages: Language[], useAI: boolean, apiKey?: string) => Promise<void>;
}

type DeckOption = 'ai' | 'default' | null;

export const DeckGenerationStep: React.FC<DeckGenerationStepProps> = ({
    languages,
    proficiencyLevel,
    onComplete,
}) => {
    const [selectedOption, setSelectedOption] = useState<DeckOption>(null);
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (selectedOption === 'ai' && !apiKey.trim()) {
            setError('Please enter your Gemini API key');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onComplete(languages, selectedOption === 'ai', selectedOption === 'ai' ? apiKey : undefined);
        } catch (err: any) {
            setError(err.message || 'Failed to complete setup');
            setLoading(false);
        }
    };

    const languageNames = languages.map(lang => LANGUAGE_LABELS[lang] || lang).join(', ');
    const languageCount = languages.length;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <p className="text-xs  text-muted-foreground uppercase tracking-wider">
                    Choose how to start learning {languageCount > 1 ? `${languageCount} languages` : languageNames} at {proficiencyLevel} level.
                </p>
                {languageCount > 1 && (
                    <p className="text-xs text-muted-foreground/70">
                        Selected: {languageNames}
                    </p>
                )}
            </div>

            {/* Options */}
            <div className="grid gap-3">
                {/* AI Generated Deck */}
                {/* AI Generated Deck */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedOption('ai')}
                    disabled={loading}
                    className={cn(
                        'group relative w-full h-auto flex justify-start items-start p-4 text-left',
                        selectedOption === 'ai'
                            ? 'border-primary bg-primary/10 hover:bg-primary/20'
                            : ''
                    )}
                >
                    <div className="flex items-start gap-3 w-full">
                        <div className="mt-1 w-8 h-8 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center shrink-0">
                            <Sparkles size={16} className="text-primary" />
                        </div>
                        <div className="flex-1 space-y-1 ml-2">
                            <div className={cn(
                                "text-sm font-bold uppercase tracking-wider",
                                selectedOption === 'ai' ? "text-primary" : "text-foreground"
                            )}>
                                AI-Generated Decks
                            </div>
                            <p className="text-xs text-muted-foreground/80 leading-relaxed font-normal whitespace-normal">
                                Generate 50 personalized flashcards per language using Gemini AI, tailored to {proficiencyLevel} level.
                                Requires your API key.
                            </p>
                        </div>
                    </div>
                </Button>

                {/* Default Deck */}
                {/* Default Deck */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedOption('default')}
                    disabled={loading}
                    className={cn(
                        'group relative w-full h-auto flex justify-start items-start p-4 text-left',
                        selectedOption === 'default'
                            ? 'border-primary bg-primary/10 hover:bg-primary/20'
                            : ''
                    )}
                >
                    <div className="flex items-start gap-3 w-full">
                        <div className="mt-1 w-8 h-8 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center shrink-0">
                            <BookOpen size={16} className="text-primary" />
                        </div>
                        <div className="flex-1 space-y-1 ml-2">
                            <div className={cn(
                                "text-sm font-bold uppercase tracking-wider",
                                selectedOption === 'default' ? "text-primary" : "text-foreground"
                            )}>
                                Standard Courses
                            </div>
                            <p className="text-xs text-muted-foreground/80 leading-relaxed font-normal whitespace-normal">
                                Start with our curated beginner decks for {languageCount > 1 ? 'each language' : 'this language'}. Best for getting started quickly.
                            </p>
                        </div>
                    </div>
                </Button>
            </div>

            {/* API Key Input */}
            {selectedOption === 'ai' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1.5">
                        <Label htmlFor="apiKey" className="text-xs font-medium text-muted-foreground  uppercase tracking-wider ml-1">
                            Gemini API Key
                        </Label>
                        <Input
                            id="apiKey"
                            type="password"
                            placeholder="Enter your API key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        {error && <p className="text-destructive text-xs ml-1">{error}</p>}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                        Your key is stored locally and only used for deck generation.
                    </p>
                </div>
            )}

            {/* Action Button */}
            {selectedOption && (
                <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? (
                            <ButtonLoader />
                        ) : (
                            selectedOption === 'ai'
                                ? `Generate ${languageCount} Deck${languageCount > 1 ? 's' : ''}`
                                : 'Start Learning'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};

```

# src/features/auth/components/LanguageLevelSelector.tsx

```typescript
import React from 'react';
import { Check } from 'lucide-react';
import { Difficulty } from '@/types';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface LanguageLevelSelectorProps {
    selectedLevel: Difficulty | null;
    onSelectLevel: (level: Difficulty) => void;
}

const LEVELS: { level: Difficulty; name: string; description: string }[] = [
    { level: 'A1', name: 'Beginner', description: 'Basic phrases, greetings, simple present tense' },
    { level: 'A2', name: 'Elementary', description: 'Everyday expressions, simple past, basic questions' },
    { level: 'B1', name: 'Intermediate', description: 'Connected text, express opinions, common idioms' },
    { level: 'B2', name: 'Upper Intermediate', description: 'Complex topics, abstract ideas, nuanced expressions' },
    { level: 'C1', name: 'Advanced', description: 'Sophisticated vocabulary, idiomatic expressions' },
    { level: 'C2', name: 'Mastery', description: 'Near-native fluency, literary expressions' },
];

export const LanguageLevelSelector: React.FC<LanguageLevelSelectorProps> = ({
    selectedLevel,
    onSelectLevel,
}) => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    This helps us create appropriate content for you.
                </p>
            </div>

            <RadioGroup
                value={selectedLevel || ""}
                onValueChange={(value) => onSelectLevel(value as Difficulty)}
                className="grid gap-3"
            >
                {LEVELS.map(({ level, name, description }) => (
                    <div key={level}>
                        <RadioGroupItem value={level} id={level} className="peer sr-only" />
                        <Label
                            htmlFor={level}
                            className={cn(
                                "flex items-start gap-3 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all",
                                selectedLevel === level && "border-primary bg-primary/5"
                            )}
                        >
                            <div className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary",
                                selectedLevel === level ? "bg-primary text-primary-foreground" : "opacity-0"
                            )}>
                                <Check className="h-3 w-3" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                                        {level}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        {name}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground/80 leading-relaxed font-normal">
                                    {description}
                                </p>
                            </div>
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    );
};


```

# src/features/auth/components/LanguageSelector.tsx

```typescript
import React from 'react';
import { Language, LanguageId } from '@/types';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface LanguageSelectorProps {
    selectedLanguages: Language[];
    onToggle: (lang: Language) => void;
    onContinue: () => void;
}

const LANGUAGES: { id: Language; name: string; flag: string }[] = [
    { id: LanguageId.Polish, name: "Polish", flag: "🇵🇱" },
    { id: LanguageId.Norwegian, name: "Norwegian", flag: "🇳🇴" },
    { id: LanguageId.Japanese, name: "Japanese", flag: "🇯🇵" },
    { id: LanguageId.Spanish, name: "Spanish", flag: "🇪🇸" },
    { id: LanguageId.German, name: "German", flag: "🇩🇪" },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    selectedLanguages,
    onToggle,
    onContinue,
}) => {
    const isSelected = (id: Language) => selectedLanguages.includes(id);
    const canContinue = selectedLanguages.length > 0;

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                    Select the languages you want to learn.
                </p>
            </div>

            <div className="grid gap-3">
                {LANGUAGES.map(({ id, name, flag }) => (
                    <div key={id}>
                        <Label
                            htmlFor={id}
                            className={cn(
                                'flex items-center justify-between w-full p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50',
                                isSelected(id)
                                    ? 'border-primary bg-primary/10'
                                    : 'border-input bg-card'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{flag}</span>
                                <span className="font-medium text-foreground">
                                    {name}
                                </span>
                            </div>

                            <Checkbox
                                id={id}
                                checked={isSelected(id)}
                                onCheckedChange={() => onToggle(id)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                        </Label>
                    </div>
                ))}
            </div>

            {canContinue && (
                <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <Button onClick={onContinue} className="w-full">
                        Continue ({selectedLanguages.length} selected)
                    </Button>
                </div>
            )}
        </div>
    );
};

```

# src/features/auth/components/index.ts

```typescript
export * from './AuthLayout';
export * from './DeckGenerationStep';
export * from './LanguageLevelSelector';


```

# src/features/collection/components/AddCardModal.tsx

```typescript
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Card, LanguageId } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { aiService } from "@/lib/ai";
import { escapeRegExp, parseFurigana } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";


interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (card: Card) => void;
    initialCard?: Card;
}

const formSchema = z.object({
    sentence: z.string().min(1, "Sentence is required"),
    targetWord: z.string().optional(),
    targetWordTranslation: z.string().optional(),
    targetWordPartOfSpeech: z.string().optional(),
    translation: z.string().min(1, "Translation is required"),
    notes: z.string().optional(),
    furigana: z.string().optional()
}).superRefine((data, ctx) => {
    if (data.targetWord && data.sentence) {
        try {
            if (!data.sentence.toLowerCase().includes(data.targetWord.toLowerCase())) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Target word provided but not found in sentence",
                    path: ["targetWord"],
                });
            }
        } catch (e) {
        }
    }
});

type FormValues = z.infer<typeof formSchema>;

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAdd, initialCard }) => {
    const settings = useSettingsStore(s => s.settings);
    const [isGenerating, setIsGenerating] = useState(false);
    const isMounted = React.useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const wasOpen = useRef(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            sentence: "",
            targetWord: "",
            targetWordTranslation: "",
            targetWordPartOfSpeech: "",
            translation: "",
            notes: "",
            furigana: ""
        }
    });

    const watchedSentence = form.watch("sentence");
    const watchedTargetWord = form.watch("targetWord");

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (isOpen && !wasOpen.current) {
            if (initialCard) {
                form.reset({
                    sentence: initialCard.targetSentence,
                    targetWord: initialCard.targetWord || "",
                    targetWordTranslation: initialCard.targetWordTranslation || "",
                    targetWordPartOfSpeech: initialCard.targetWordPartOfSpeech || "",
                    translation: initialCard.nativeTranslation,
                    notes: initialCard.notes,
                    furigana: initialCard.furigana || ""
                });
            } else {
                form.reset({ sentence: "", targetWord: "", targetWordTranslation: "", targetWordPartOfSpeech: "", translation: "", notes: "", furigana: "" });
            }

            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
                }
            }, 100);
        }
        wasOpen.current = isOpen;
    }, [isOpen, initialCard, settings.language, form.reset]);

    const handleAutoFill = async () => {
        const currentSentence = form.watch("sentence");
        if (!currentSentence) return;
        if (!settings.geminiApiKey) {
            toast.error("Please add your Gemini API Key in Settings > General");
            return;
        }
        setIsGenerating(true);
        try {
            const targetLanguage = initialCard?.language || settings.language;
            const result = await aiService.generateCardContent(currentSentence, targetLanguage, settings.geminiApiKey);

            if (isMounted.current) {
                if (targetLanguage === LanguageId.Japanese && result.furigana) {
                    form.setValue("sentence", result.furigana);
                }

                form.setValue("translation", result.translation);
                if (result.targetWord) form.setValue("targetWord", result.targetWord);
                if (result.targetWordTranslation) form.setValue("targetWordTranslation", result.targetWordTranslation);
                if (result.targetWordPartOfSpeech) form.setValue("targetWordPartOfSpeech", result.targetWordPartOfSpeech);
                form.setValue("notes", result.notes);
                if (result.furigana) form.setValue("furigana", result.furigana);

                toast.success("Content generated");
            }
        } catch (e: any) {
            console.error("Auto-fill error:", e);
            if (isMounted.current) toast.error(e.message || "Generation failed");
        } finally {
            if (isMounted.current) setIsGenerating(false);
        }
    };

    const onSubmit = (data: FormValues) => {
        const cardBase = initialCard || { id: uuidv4(), status: "new", interval: 0, easeFactor: 2.5, dueDate: new Date().toISOString(), reps: 0, lapses: 0 } as Card;

        const targetLanguage = initialCard?.language || settings.language;
        let targetSentence = data.sentence;
        let furigana = data.furigana || undefined;

        if (targetLanguage === LanguageId.Japanese) {
            furigana = data.sentence;
            targetSentence = parseFurigana(data.sentence).map(s => s.text).join("");
        }

        const newCard: Card = {
            ...cardBase,
            targetSentence: targetSentence,
            targetWord: data.targetWord || undefined,
            targetWordTranslation: data.targetWordTranslation || undefined,
            targetWordPartOfSpeech: data.targetWordPartOfSpeech || undefined,
            nativeTranslation: data.translation,
            notes: data.notes || "",
            furigana: furigana,
            language: targetLanguage
        };
        onAdd(newCard);
        form.reset({ sentence: "", targetWord: "", targetWordTranslation: "", targetWordPartOfSpeech: "", translation: "", notes: "", furigana: "" });
        onClose();
    };


    const HighlightedPreview = useMemo(() => {
        if (!watchedSentence) return null;

        const targetLanguage = initialCard?.language || settings.language;

        if (targetLanguage === LanguageId.Japanese) {
            const segments = parseFurigana(watchedSentence);
            return (
                <div className="mt-2 text-lg font-normal text-muted-foreground select-none">
                    {segments.map((segment, i) => {
                        const isTarget = watchedTargetWord && segment.text === watchedTargetWord;
                        if (segment.furigana) {
                            return (
                                <ruby key={i} className="mr-1" style={{ rubyAlign: 'center' }}>
                                    <span className={isTarget ? "text-primary border-b border-primary/50" : "text-foreground"}>{segment.text}</span>
                                    <rt className="text-xs text-muted-foreground select-none text-center" style={{ textAlign: 'center' }}>{segment.furigana}</rt>
                                </ruby>
                            );
                        }
                        return <span key={i} className={isTarget ? "text-primary border-b border-primary/50" : ""}>{segment.text}</span>;
                    })}
                </div>
            );
        }

        if (!watchedTargetWord) return null;
        try {
            const parts = watchedSentence.split(new RegExp(`(${escapeRegExp(watchedTargetWord)})`, "gi"));
            return (
                <div className="mt-2 text-lg font-normal text-muted-foreground select-none">
                    {parts.map((part, i) => part.toLowerCase() === watchedTargetWord.toLowerCase() ? <span key={i} className="text-primary border-b border-primary/50">{part}</span> : <span key={i}>{part}</span>)}
                </div>
            );
        } catch (e) {
            return (
                <div className="mt-2 text-lg font-normal text-muted-foreground select-none">
                    {watchedSentence}
                </div>
            );
        }
    }, [watchedSentence, watchedTargetWord, settings.language, initialCard]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialCard ? "Edit Card" : "Add New Card"}</DialogTitle>
                    <DialogDescription>
                        Create or modify your flashcard details.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Sentence Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <FormLabel className="text-base font-semibold">Native Sentence</FormLabel>
                                <Button
                                    type="button"
                                    onClick={handleAutoFill}
                                    disabled={isGenerating || !watchedSentence}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2"
                                >
                                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                    <span className="text-xs">Auto-Fill with AI</span>
                                </Button>
                            </div>

                            <FormField
                                control={form.control}
                                name="sentence"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Type the sentence in target language..."
                                                className="resize-none text-lg min-h-[100px]"
                                                ref={(e) => {
                                                    field.ref(e);
                                                    textareaRef.current = e as HTMLTextAreaElement;
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {HighlightedPreview}
                        </div>

                        <Separator />

                        {/* Translation and Target Word */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="translation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Translation</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Sentence translation" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="targetWord"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Word</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Word to highlight" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Word Details */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="targetWordTranslation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Word Definition</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Definition of target word" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="targetWordPartOfSpeech"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Part of Speech</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="noun">Noun</SelectItem>
                                                <SelectItem value="verb">Verb</SelectItem>
                                                <SelectItem value="adjective">Adjective</SelectItem>
                                                <SelectItem value="adverb">Adverb</SelectItem>
                                                <SelectItem value="pronoun">Pronoun</SelectItem>
                                                <SelectItem value="expression">Expression</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Usage notes, context, or grammar rules" className="min-h-[80px]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Save Card</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

```

# src/features/collection/components/CardHistoryModal.tsx

```typescript
import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Card } from '@/types';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { Activity, Clock, Target, Zap, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card as UiCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CardHistoryModalProps {
  card: Card | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const StatBox = ({
  label,
  value,
  subtext,
  icon
}: {
  label: string,
  value: string | number,
  subtext?: string,
  icon?: React.ReactNode
}) => (
  <UiCard>
    <CardContent className="flex flex-col items-center justify-center p-4 text-center">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      {subtext && <span className="text-xs text-muted-foreground mt-1">{subtext}</span>}
    </CardContent>
  </UiCard>
);

const TimelineEvent = ({ label, dateStr }: { label: string, dateStr?: string }) => {
  if (!dateStr || !isValid(parseISO(dateStr))) return null;
  const date = parseISO(dateStr);

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="text-right flex flex-col items-end">
        <span className="text-sm font-medium tabular-nums">{format(date, 'PPP')}</span>
        <span className="text-xs text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</span>
      </div>
    </div>
  );
};

export const CardHistoryModal: React.FC<CardHistoryModalProps> = ({ card, isOpen, onClose }) => {
  if (!card) return null;

  const difficultyPercent = Math.min(100, Math.round(((card.difficulty || 0) / 10) * 100));
  const stability = card.stability ? parseFloat(card.stability.toFixed(2)) : 0;

  const getFsrsLabel = (state?: number) => {
    if (state === 0) return 'New';
    if (state === 1) return 'Learning';
    if (state === 2) return 'Review';
    if (state === 3) return 'Relearning';
    return 'Unknown';
  };

  const getStateVariant = (state?: number): "default" | "secondary" | "destructive" | "outline" => {
    if (state === 0) return 'default'; // New
    if (state === 1) return 'secondary'; // Learning
    if (state === 2) return 'outline'; // Review
    if (state === 3) return 'destructive'; // Relearning
    return 'outline';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-muted-foreground" />
              <DialogTitle>Card History</DialogTitle>
            </div>
            <Badge variant={getStateVariant(card.state)}>
              {getFsrsLabel(card.state)}
            </Badge>
          </div>
          <DialogDescription>
            Detailed statistics and timeline for this card.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold leading-tight text-balance">
              {card.targetSentence}
            </h2>
            <p className="text-muted-foreground text-balance">
              {card.nativeTranslation}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatBox
              label="Reviews"
              value={card.reps || 0}
              subtext="Total Repetitions"
              icon={<Activity size={16} />}
            />
            <StatBox
              label="Lapses"
              value={card.lapses || 0}
              subtext="Forgotten count"
              icon={<Zap size={16} />}
            />
            <StatBox
              label="Stability"
              value={`${stability}d`}
              subtext="Retention Interval"
              icon={<Target size={16} />}
            />
            <StatBox
              label="Difficulty"
              value={`${(card.difficulty || 0).toFixed(1)}`}
              subtext={difficultyPercent > 60 ? "High Difficulty" : "Normal Range"}
              icon={<Clock size={16} />}
            />
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <History size={14} /> Timeline
            </h3>
            <div className="space-y-1">
              <TimelineEvent label="Created" dateStr={card.first_review || card.dueDate} />
              <TimelineEvent label="Last Seen" dateStr={card.last_review} />
              <TimelineEvent label="Next Due" dateStr={card.dueDate} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

```

# src/features/collection/components/CardList.tsx

```typescript
import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { Card as CardModel } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { getCardColumns } from './CardTableColumns';
import { Card } from '@/components/ui/card';
import { RowSelectionState } from '@tanstack/react-table';

interface CardListProps {
  cards: CardModel[];
  searchTerm: string;
  onEditCard: (card: CardModel) => void;
  onDeleteCard: (id: string) => void;
  onViewHistory: (card: CardModel) => void;
  onPrioritizeCard: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, index: number, isShift: boolean) => void;
  onSelectAll: () => void;

  page?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

export const CardList: React.FC<CardListProps> = ({
  cards,
  searchTerm,
  onEditCard,
  onDeleteCard,
  onViewHistory,
  onPrioritizeCard,
  selectedIds,
  onToggleSelect,
  onSelectAll,

  page = 0,
  totalPages = 1,
  totalCount = 0,
  onPageChange,
}) => {
  const rowSelection = useMemo(() => {
    const state: RowSelectionState = {};
    selectedIds.forEach((id) => {
      state[id] = true;
    });
    return state;
  }, [selectedIds]);

  const handleRowSelectionChange = (newSelection: RowSelectionState) => {
    const newSelectedIds = new Set(Object.keys(newSelection).filter(id => newSelection[id]));
    const currentSelectedIds = selectedIds;

    newSelectedIds.forEach(id => {
      if (!currentSelectedIds.has(id)) {
        const index = cards.findIndex(c => c.id === id);
        if (index !== -1) {
          onToggleSelect(id, index, false);
        }
      }
    });

    currentSelectedIds.forEach(id => {
      if (!newSelectedIds.has(id)) {
        const index = cards.findIndex(c => c.id === id);
        if (index !== -1) {
          onToggleSelect(id, index, false);
        }
      }
    });
  };

  const columns = useMemo(
    () => getCardColumns({
      onEditCard,
      onDeleteCard,
      onViewHistory,
      onPrioritizeCard,
      onToggleSelect,
    }),
    [onEditCard, onDeleteCard, onViewHistory, onPrioritizeCard, onToggleSelect]
  );

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Card className="p-6 md:p-14 border-dashed flex flex-col items-center justify-center text-center max-w-md">
          {/* Decorative container with diamond shape */}
          <div className="relative mb-8">
            <div className="w-16 h-16 border rounded-full flex items-center justify-center bg-muted/20">
              <BookOpen className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </div>
          <h3 className="text-xl font-light text-foreground mb-2 tracking-tight">No cards found</h3>
          <p className="text-sm text-muted-foreground/60 font-light ">
            Your collection appears to be empty
          </p>
          {/* Decorative line */}

        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full w-full px-4 md:px-6 lg:px-8 py-4">
      <DataTable
        columns={columns}
        data={cards}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        enableRowSelection
        getRowId={(row) => row.id}
        searchValue={searchTerm}
        searchColumn="targetSentence"
        pageSize={50}
        onRowClick={onViewHistory}
        manualPagination={true}
        pageCount={totalPages}
        pageIndex={page}
        onPageChange={onPageChange}
        totalItems={totalCount}
      />
    </div>
  );
};

```

# src/features/collection/components/CardTableColumns.tsx

```typescript
import { ColumnDef } from "@tanstack/react-table"
import { Card } from "@/types"
import {
    MoreHorizontal,
    Zap,
    History,
    Pencil,
    Trash2,
    Star,
    Clock,
    CheckCircle2,
    BookOpen,
    Sparkles,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Bookmark
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, parseISO, isValid, format } from "date-fns"
import { formatInterval } from "@/utils/formatInterval"
import { Button } from "@/components/ui/button"

const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, {
        label: string;
        icon: React.ReactNode;
        className: string;
    }> = {
        new: {
            label: 'New',
            icon: <Star className="w-3 h-3" strokeWidth={1.5} fill="currentColor" />,
            className: 'text-primary bg-primary/10 border-primary/30'
        },
        learning: {
            label: 'Learning',
            icon: <BookOpen className="w-3 h-3" strokeWidth={1.5} />,
            className: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
        },
        graduated: {
            label: 'Review',
            icon: <Clock className="w-3 h-3" strokeWidth={1.5} />,
            className: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/30'
        },
        known: {
            label: 'Mastered',
            icon: <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />,
            className: 'text-primary bg-primary/10 border-primary/30'
        },
    }

    const config = statusConfig[status] || statusConfig.new

    return (
        <span
            className={cn(
                "relative inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-all border rounded-sm",
                config.className
            )}
        >
            {config.icon}
            {config.label}
        </span>
    )
}

const ScheduleCell = ({ dateStr, status, interval }: { dateStr: string, status: string, interval: number }) => {
    if (status === 'new') {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                <span className="text-xs font-medium">Awaiting</span>
            </div>
        )
    }

    const date = parseISO(dateStr)
    if (!isValid(date)) return <span className="text-muted-foreground/40 text-xs">—</span>

    if (date.getFullYear() === 1970) {
        return (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/50 text-primary rounded-sm">
                <Zap className="w-3 h-3" strokeWidth={2} fill="currentColor" />
                <span className="text-xs font-bold">Priority</span>
            </div>
        )
    }

    const isPast = date < new Date()

    return (
        <div className="space-y-0.5">
            <p className={cn(
                "text-sm font-medium tabular-nums ",
                isPast ? "text-destructive" : "text-foreground"
            )}>
                {format(date, 'MMM d')}
            </p>
            <p className="text-xs text-muted-foreground">
                {interval > 0 && `${formatInterval(interval * 24 * 60 * 60 * 1000)} • `}
                {formatDistanceToNow(date, { addSuffix: true })}
            </p>
        </div>
    )
}

const SortableHeader = ({
    column,
    children
}: {
    column: any;
    children: React.ReactNode
}) => {
    const isSorted = column.getIsSorted()

    return (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 hover:text-primary transition-colors group h-8 px-2 font-bold"
        >
            {children}
            {isSorted === "asc" ? (
                <ArrowUp className="w-3 h-3 text-primary" />
            ) : isSorted === "desc" ? (
                <ArrowDown className="w-3 h-3 text-primary" />
            ) : (
                <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
            )}
        </Button>

    )
}

interface ColumnActions {
    onEditCard: (card: Card) => void
    onDeleteCard: (id: string) => void
    onViewHistory: (card: Card) => void
    onPrioritizeCard: (id: string) => void
    onToggleSelect?: (id: string, index: number, isShift: boolean) => void
}

export function getCardColumns(actions: ColumnActions): ColumnDef<Card>[] {
    return [
        {
            id: "select",
            header: ({ table }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ? true :
                                table.getIsSomePageRowsSelected() ? "indeterminate" : false
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                        className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary text-primary-foreground"
                    />
                </div>
            ),
            cell: ({ row, table }) => {
                const handleClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (actions.onToggleSelect) {
                        const rowIndex = table.getRowModel().rows.findIndex(r => r.id === row.id);
                        actions.onToggleSelect(row.id, rowIndex, e.shiftKey);
                    } else {
                        row.toggleSelected();
                    }
                };
                return (
                    <div
                        className="flex items-center justify-center"
                        onClick={handleClick}
                    >
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={() => { }}
                            aria-label="Select row"
                            className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary text-primary-foreground pointer-events-none"
                        />
                    </div>
                );
            },
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },

        {
            accessorKey: "isBookmarked",
            header: ({ column }) => (
                <div className="flex justify-center">
                    <SortableHeader column={column}>
                        <Bookmark size={14} strokeWidth={1.5} />
                    </SortableHeader>
                </div>
            ),
            cell: ({ row }) => {
                const isBookmarked = row.original.isBookmarked;
                if (!isBookmarked) return null;
                return (
                    <div className="flex items-center justify-center">
                        <Bookmark size={14} className="text-primary fill-primary" />
                    </div>
                );
            },
            size: 50,
        },

        {
            accessorKey: "status",
            header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
            cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
            size: 120,
        },

        {
            accessorKey: "targetWord",
            header: ({ column }) => <SortableHeader column={column}>Word</SortableHeader>,
            cell: ({ row }) => {
                const word = row.original.targetWord
                const pos = row.original.targetWordPartOfSpeech

                if (!word) return <span className="text-muted-foreground/40">—</span>

                return (
                    <div className="space-y-0.5">
                        <p className="font-medium text-foreground text-base">{word}</p>
                        {pos && (
                            <p className="text-xs text-muted-foreground font-medium">{pos}</p>
                        )}
                    </div>
                )
            },
            size: 140,
        },

        {
            accessorKey: "targetSentence",
            header: ({ column }) => <SortableHeader column={column}>Sentence</SortableHeader>,
            cell: ({ row }) => (
                <p className="text-sm font-light text-foreground/90 truncate max-w-[150px]">
                    {row.getValue("targetSentence")}
                </p>
            ),
            filterFn: "includesString",
        },

        {
            accessorKey: "nativeTranslation",
            header: "Translation",
            cell: ({ row }) => (
                <p className="text-sm text-muted-foreground font-light line-clamp-2 max-w-[150px]">
                    {row.getValue("nativeTranslation")}
                </p>
            ),
        },

        {
            accessorKey: "dueDate",
            header: ({ column }) => <SortableHeader column={column}>Due</SortableHeader>,
            cell: ({ row }) => (
                <ScheduleCell
                    dateStr={row.getValue("dueDate")}
                    status={row.original.status}
                    interval={row.original.interval}
                />
            ),
            size: 120,
        },


        {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const card = row.original

                return (
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className={cn(
                                    "relative w-8 h-8 flex items-center justify-center transition-all duration-200 outline-none border border-transparent rounded-full",
                                    "text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:border-primary/30",
                                    "opacity-0 group-hover:opacity-100 focus:opacity-100"
                                )}
                            >
                                <MoreHorizontal size={16} strokeWidth={1.5} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 border-border bg-card p-1.5 text-foreground">
                                <DropdownMenuItem
                                    onClick={() => actions.onPrioritizeCard(card.id)}
                                    className="text-sm cursor-pointer py-2 px-3 focus:bg-primary/10 focus:text-primary"
                                >
                                    <Zap size={14} className="mr-2.5 opacity-60" strokeWidth={1.5} />
                                    Priority
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => actions.onViewHistory(card)}
                                    className="text-sm cursor-pointer py-2 px-3 focus:bg-primary/10 focus:text-primary"
                                >
                                    <History size={14} className="mr-2.5 opacity-60" strokeWidth={1.5} />
                                    History
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => actions.onEditCard(card)}
                                    className="text-sm cursor-pointer py-2 px-3 focus:bg-primary/10 focus:text-primary"
                                >
                                    <Pencil size={14} className="mr-2.5 opacity-60" strokeWidth={1.5} />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 bg-border" />
                                <DropdownMenuItem
                                    onClick={() => actions.onDeleteCard(card.id)}
                                    className="text-sm cursor-pointer py-2 px-3 text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                    <Trash2 size={14} className="mr-2.5 opacity-60" strokeWidth={1.5} />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
            size: 50,
        },
    ]
}

```

# src/features/collection/hooks/useCardOperations.ts

```typescript
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/types';
import {
  deleteCard as deleteCardFromRepo,
  deleteCardsBatch as deleteCardsBatchFromRepo,
  saveCard,
  saveAllCards,
} from '@/db/repositories/cardRepository';
import { useDeckActions } from '@/contexts/DeckActionsContext';
import { db } from '@/db/dexie';

interface CardOperations {
  addCard: (card: Card) => Promise<void>;
  addCardsBatch: (cards: Card[]) => Promise<void>;
  updateCard: (card: Card, options?: { silent?: boolean }) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  deleteCardsBatch: (ids: string[]) => Promise<void>;
  prioritizeCards: (ids: string[]) => Promise<void>;
}

export const useCardOperations = (): CardOperations => {
  const { refreshDeckData } = useDeckActions();
  const queryClient = useQueryClient();

  const addCard = useCallback(
    async (card: Card) => {
      try {
        await saveCard(card);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        toast.success('Card added successfully');
      } catch (error) {
        console.error(error);
        toast.error('Failed to add card');
      }
    },
    [queryClient, refreshDeckData]
  );

  const addCardsBatch = useCallback(
    async (cards: Card[]) => {
      try {
        await saveAllCards(cards);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        toast.success(`${cards.length} cards added successfully`);
      } catch (error) {
        console.error(error);
        toast.error('Failed to add cards');
      }
    },
    [queryClient, refreshDeckData]
  );

  const updateCard = useCallback(
    async (card: Card, options?: { silent?: boolean }) => {
      try {
        await saveCard(card);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        if (!options?.silent) {
          toast.success('Card updated successfully');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to update card');
      }
    },
    [queryClient, refreshDeckData]
  );

  const deleteCard = useCallback(
    async (id: string) => {
      try {
        await deleteCardFromRepo(id);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        toast.success('Card deleted');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete card');
      }
    },
    [queryClient, refreshDeckData]
  );

  const deleteCardsBatch = useCallback(
    async (ids: string[]) => {
      try {
        await deleteCardsBatchFromRepo(ids);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        toast.success(`${ids.length} cards deleted`);
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete cards');
      }
    },
    [queryClient, refreshDeckData]
  );

  const prioritizeCards = useCallback(
    async (ids: string[]) => {
      try {
        await db.cards
          .where('id')
          .anyOf(ids)
          .modify({ dueDate: new Date(0).toISOString() });

        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        await queryClient.invalidateQueries({ queryKey: ['dueCards'] });
        refreshDeckData();
        toast.success(`${ids.length} card${ids.length === 1 ? '' : 's'} moved to top of queue`);
      } catch (error) {
        console.error(error);
        toast.error('Failed to prioritize cards');
      }
    },
    [queryClient, refreshDeckData]
  );

  return { addCard, addCardsBatch, updateCard, deleteCard, deleteCardsBatch, prioritizeCards };
};

```

# src/features/collection/hooks/useCardText.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/types';

export const useCardText = (card: Card) => {
  const [displayedTranslation, setDisplayedTranslation] = useState(card.nativeTranslation);
  const [isGaslit, setIsGaslit] = useState(false);

  useEffect(() => {
    setDisplayedTranslation(card.nativeTranslation);
    setIsGaslit(false);
  }, [card.id, card.nativeTranslation]);

  const processText = useCallback((text: string) => {
    return text;
  }, []);

  return {
    displayedTranslation,
    isGaslit,
    processText
  };
};

```

# src/features/collection/hooks/useCardsQuery.ts

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { db } from '@/db/dexie';
import { mapToCard, getCurrentUserId } from '@/db/repositories/cardRepository';
import { CardStatus } from '@/types';

export interface CardFilters {
  status?: CardStatus | 'all';
  bookmarked?: boolean;
  leech?: boolean;
}

export const useCardsQuery = (
  page = 0,
  pageSize = 50,
  searchTerm = '',
  filters: CardFilters = {}
) => {
  const settings = useSettingsStore(s => s.settings);
  const language = settings.language;

  return useQuery({
    queryKey: ['cards', language, page, pageSize, searchTerm, filters],
    queryFn: async () => {
      const userId = getCurrentUserId();
      if (!userId) return { data: [], count: 0 };

      // Use composite index for user+language
      let collection = db.cards
        .where('[user_id+language]')
        .equals([userId, language]);

      // Get total count before filtering (for pagination)
      let cards = await collection.toArray();

      // Apply search filter in memory (text search not indexable)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        cards = cards.filter(c =>
          c.targetSentence?.toLowerCase().includes(term) ||
          c.nativeTranslation?.toLowerCase().includes(term) ||
          c.targetWord?.toLowerCase().includes(term) ||
          c.notes?.toLowerCase().includes(term)
        );
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        cards = cards.filter(c => c.status === filters.status);
      }

      // Apply bookmarked filter
      if (filters.bookmarked) {
        cards = cards.filter(c => c.isBookmarked === true);
      }

      // Apply leech filter
      if (filters.leech) {
        cards = cards.filter(c => c.isLeech === true);
      }

      // Sort by dueDate descending
      cards.sort((a, b) => b.dueDate.localeCompare(a.dueDate));

      const totalCount = cards.length;

      // Apply pagination
      const start = page * pageSize;
      const end = start + pageSize;
      const paginatedCards = cards.slice(start, end);

      return {
        data: paginatedCards,
        count: totalCount
      };
    },
    placeholderData: keepPreviousData,
  });
};

```

# src/features/collection/hooks/useDeckQueries.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { db } from '@/db/dexie';
import {
  getStats as fetchStats,
  getTodayReviewStats,
} from '@/db/repositories/statsRepository';
import {
  getHistory as fetchHistory,
  incrementHistory,
} from '@/db/repositories/historyRepository';
import { getDueCards, saveCard } from '@/db/repositories/cardRepository';
import { addReviewLog } from '@/db/repositories/revlogRepository';
import { Card, Grade } from '@/types';
import { getSRSDate } from '@/core/srs/scheduler';
import { format, differenceInMinutes } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/contexts/GamificationContext';
import { toast } from 'sonner';
import { CardXpPayload } from '@/core/gamification/xp';

export const useDeckStatsQuery = () => {
  const settings = useSettingsStore(s => s.settings);
  return useQuery({
    queryKey: ['deckStats', settings.language],
    queryFn: () => fetchStats(settings.language),
    staleTime: 60 * 1000,
  });
};

export const useDueCardsQuery = () => {
  const settings = useSettingsStore(s => s.settings);
  return useQuery({
    queryKey: ['dueCards', settings.language],
    queryFn: () => getDueCards(new Date(), settings.language),
    staleTime: 60 * 1000,
  });
};

export const useReviewsTodayQuery = () => {
  const settings = useSettingsStore(s => s.settings);
  return useQuery({
    queryKey: ['reviewsToday', settings.language],
    queryFn: () => getTodayReviewStats(settings.language),
    staleTime: 60 * 1000,
  });
};

export const useHistoryQuery = () => {
  const settings = useSettingsStore(s => s.settings);
  return useQuery({
    queryKey: ['history', settings.language],
    queryFn: () => fetchHistory(settings.language),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecordReviewMutation = () => {
  const queryClient = useQueryClient();
  const settings = useSettingsStore(s => s.settings);
  const { user } = useAuth();
  const { incrementXP } = useGamification();

  return useMutation({
    mutationFn: async ({ card, newCard, grade, xpPayload }: { card: Card; newCard: Card; grade: Grade; xpPayload?: CardXpPayload }) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');

      const now = new Date();
      const lastReview = card.last_review ? new Date(card.last_review) : now;

      const diffMinutes = differenceInMinutes(now, lastReview);
      const elapsedDays = diffMinutes / 1440;

      const scheduledDays = card.scheduled_days ?? card.interval ?? 0;

      await db.transaction('rw', [db.cards, db.revlog, db.aggregated_stats, db.history], async () => {
        await saveCard(newCard); await addReviewLog(card, grade, elapsedDays, scheduledDays);
        await incrementHistory(today, 1, card.language || settings.language);
      });

      const xpAmount = xpPayload?.totalXp ?? 0;

      return { card: newCard, grade, today, xpAmount };
    },
    onMutate: async ({ card, grade, xpPayload }) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['history', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['reviewsToday', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['dueCards', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['deckStats', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['dashboardStats', settings.language] })
      ]);

      const previousHistory = queryClient.getQueryData(['history', settings.language]);
      const previousReviewsToday = queryClient.getQueryData(['reviewsToday', settings.language]);
      const previousDueCards = queryClient.getQueryData(['dueCards', settings.language]);
      const previousDashboardStats = queryClient.getQueryData(['dashboardStats', settings.language]);

      queryClient.setQueryData(['history', settings.language], (old: any) => {
        if (!old) return { [today]: 1 };
        return { ...old, [today]: (old[today] || 0) + 1 };
      });

      queryClient.setQueryData(['reviewsToday', settings.language], (old: any) => {
        if (!old) return { newCards: 0, reviewCards: 0 };
        return {
          newCards: card.status === 'new' ? old.newCards + 1 : old.newCards,
          reviewCards: card.status !== 'new' ? old.reviewCards + 1 : old.reviewCards
        };
      });

      queryClient.setQueryData(['dueCards', settings.language], (old: Card[] | undefined) => {
        if (!old) return [];
        if (grade === 'Again') return old;
        return old.filter(c => c.id !== card.id);
      });

      if (user) {
        const xpAmount = xpPayload?.totalXp ?? 0;
        incrementXP(xpAmount);

        queryClient.setQueryData(['dashboardStats', settings.language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: (old.languageXp || 0) + xpAmount
          };
        });
      }

      return { previousHistory, previousReviewsToday, previousDueCards, previousDashboardStats };
    },
    onError: (err, newTodo, context) => {
      if (context) {
        queryClient.setQueryData(['history', settings.language], context.previousHistory);
        queryClient.setQueryData(['reviewsToday', settings.language], context.previousReviewsToday);
        queryClient.setQueryData(['dueCards', settings.language], context.previousDueCards);
        queryClient.setQueryData(['dashboardStats', settings.language], context.previousDashboardStats);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['history', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['reviewsToday', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['deckStats', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['dueCards', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', settings.language] });
    },
  });
};


export const useClaimDailyBonusMutation = () => {
  const queryClient = useQueryClient();
  const settings = useSettingsStore(s => s.settings);
  const { incrementXP } = useGamification();
  const BONUS_AMOUNT = 20;

  return useMutation({
    mutationFn: async () => {
      return { success: true };
    },
    onSuccess: (data) => {
      if (data && data.success) {
        toast.success(`Daily Goal Complete! +${BONUS_AMOUNT} XP`);
        incrementXP(BONUS_AMOUNT);

        queryClient.setQueryData(['dashboardStats', settings.language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: (old.languageXp || 0) + BONUS_AMOUNT
          };
        });
      }
    }
  });
};

export const useUndoReviewMutation = () => {
  const queryClient = useQueryClient();
  const settings = useSettingsStore(s => s.settings);
  const { user } = useAuth();
  const { incrementXP } = useGamification();

  return useMutation({
    mutationFn: async ({ card, date, xpEarned }: { card: Card; date: string; xpEarned: number }) => {
      await saveCard(card);
      await incrementHistory(date, -1, card.language || settings.language);
      return { card, date, xpEarned };
    },
    onSuccess: ({ xpEarned }) => {
      if (user && xpEarned > 0) {
        incrementXP(-xpEarned);

        queryClient.setQueryData(['dashboardStats', settings.language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: Math.max(0, (old.languageXp || 0) - xpEarned)
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['history', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['reviewsToday', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['deckStats', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['dueCards', settings.language] });
    }
  });
};

```

# src/features/collection/hooks/useDeckStats.ts

```typescript
import { useMemo } from 'react';
import { useDeckStatsQuery, useDueCardsQuery, useHistoryQuery, useReviewsTodayQuery } from '@/features/collection/hooks/useDeckQueries';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useStreakStats } from './useStreakStats';
import { applyStudyLimits, isNewCard } from '@/services/studyLimits';
import { DeckStats } from '@/types';

export const useDeckStats = () => {
    const settings = useSettingsStore(s => s.settings);
    const streakStats = useStreakStats();

    const { data: reviewsTodayData, isLoading: reviewsTodayLoading } = useReviewsTodayQuery();
    const reviewsToday = reviewsTodayData || { newCards: 0, reviewCards: 0 };

    const { data: dbStats, isLoading: statsLoading } = useDeckStatsQuery();
    const { data: dueCards, isLoading: dueCardsLoading } = useDueCardsQuery();
    const { data: history, isLoading: historyLoading } = useHistoryQuery();

    const isLoading = statsLoading || dueCardsLoading || historyLoading || reviewsTodayLoading;

    const currentNewLimit = settings.dailyNewLimits?.[settings.language] ?? 20;
    const currentReviewLimit = settings.dailyReviewLimits?.[settings.language] ?? 100;

    const stats = useMemo<DeckStats>(() => {
        if (!dbStats || !dueCards) {
            return {
                total: 0,
                due: 0,
                newDue: 0,
                reviewDue: 0,
                learned: 0,
                streak: 0,
                totalReviews: 0,
                longestStreak: 0,
            };
        }

        const limitedCards = applyStudyLimits(dueCards, {
            dailyNewLimit: currentNewLimit,
            dailyReviewLimit: currentReviewLimit,
            reviewsToday: reviewsToday,
        });

        const newDue = limitedCards.filter(isNewCard).length;
        const reviewDue = limitedCards.length - newDue;

        return {
            total: dbStats.total,
            learned: dbStats.learned,
            due: limitedCards.length,
            newDue,
            reviewDue,
            streak: streakStats.currentStreak,
            totalReviews: streakStats.totalReviews,
            longestStreak: streakStats.longestStreak,
        };
    }, [dbStats, dueCards, reviewsToday, currentNewLimit, currentReviewLimit, streakStats]);

    return {
        stats,
        history: history || {},
        isLoading
    };
};

```

# src/features/collection/hooks/useStreakStats.ts

```typescript
import { useState, useEffect, useRef } from 'react';
import { useHistoryQuery } from '@/features/collection/hooks/useDeckQueries';
import { getUTCDateString } from '@/constants';
import { getSRSDate } from '@/core/srs/scheduler';

export interface StreakStats {
    currentStreak: number;
    longestStreak: number;
    totalReviews: number;
}

export const useStreakStats = () => {
    const { data: history } = useHistoryQuery();
    const [stats, setStats] = useState<StreakStats>({ currentStreak: 0, longestStreak: 0, totalReviews: 0 });
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        workerRef.current = new Worker(
            new URL('@/services/db/workers/stats.worker.ts', import.meta.url),
            { type: 'module' }
        );

        workerRef.current.onmessage = (e: MessageEvent) => {
            const { currentStreak, longestStreak, totalReviews } = e.data;
            setStats({ currentStreak, longestStreak, totalReviews });
        };

        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!history || Object.keys(history).length === 0) {
            setStats({ currentStreak: 0, longestStreak: 0, totalReviews: 0 });
            return;
        }

        if (!workerRef.current) return;

        const srsToday = getSRSDate(new Date());
        const todayStr = getUTCDateString(srsToday);
        const srsYesterday = new Date(srsToday);
        srsYesterday.setDate(srsYesterday.getDate() - 1);
        const yesterdayStr = getUTCDateString(srsYesterday);

        workerRef.current.postMessage({
            action: 'calculate_streaks',
            history,
            todayStr,
            yesterdayStr
        });

    }, [history]);

    return stats;
};

```

# src/features/collection/utils/createCard.ts

```typescript
import { Card, Language, LanguageId } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const createCard = (
  language: Language,
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string,
  furigana?: string
): Card => ({
  id: uuidv4(),
  targetSentence: sentence,
  targetWord,
  nativeTranslation: translation,
  notes,
  targetWordTranslation,
  targetWordPartOfSpeech,
  furigana,
  status: 'new',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language
});

export const createPolishCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card => createCard(LanguageId.Polish, sentence, translation, targetWord, notes, targetWordTranslation, targetWordPartOfSpeech);

export const createNorwegianCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card => createCard(LanguageId.Norwegian, sentence, translation, targetWord, notes, targetWordTranslation, targetWordPartOfSpeech);

export const createJapaneseCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  furigana?: string
): Card => createCard(LanguageId.Japanese, sentence, translation, targetWord, notes, undefined, undefined, furigana);

export const createSpanishCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = ''
): Card => createCard(LanguageId.Spanish, sentence, translation, targetWord, notes);

export const createGermanCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card => createCard(LanguageId.German, sentence, translation, targetWord, notes, targetWordTranslation, targetWordPartOfSpeech);


```

# src/features/dashboard/components/Dashboard.tsx

```typescript
import React, { useMemo } from 'react';
import {
  Activity,
  BookOpen,
  Sparkles,
  Target,
  Circle,
  Clock,
  CheckCircle2,
  Flame,
  History,
  BarChart3,
  CalendarDays
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { subDays, startOfDay, format } from 'date-fns';

import { DeckStats, ReviewHistory, Card as CardType } from '@/types';

import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { getRevlogStats } from '@/db/repositories/statsRepository';
import { getLevelProgress } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getRankForLevel } from '@/components/ui/level-badge';
import { Heatmap } from './Heatmap';
import { RetentionStats } from './RetentionStats';
import { ReviewVolumeChart } from './ReviewVolumeChart';
import { TrueRetentionChart } from './TrueRetentionChart';

interface DashboardProps {
  metrics: {
    total: number;
    new: number;
    learning: number;
    reviewing: number;
    known: number;
  };
  languageXp: { xp: number; level: number };
  stats: DeckStats;
  history: ReviewHistory;
  onStartSession: () => void;
  cards: CardType[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  stats,
  history,
  onStartSession,
  cards,
  languageXp
}) => {
  const settings = useSettingsStore(s => s.settings);
  const { profile } = useProfile();

  const levelData = getLevelProgress(languageXp.xp);
  const rank = getRankForLevel(levelData.level);

  const { data: revlogStats, isLoading: isRevlogLoading } = useQuery({
    queryKey: ['revlogStats', settings.language],
    queryFn: () => getRevlogStats(settings.language),
  });

  const hasNoCards = metrics.total === 0;
  const hasNoActivity = stats.totalReviews === 0;

  const lastSevenDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const count = history[dateKey] || 0;
      return { date, active: count > 0, count };
    });
  }, [history]);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const isStreakAtRisk = stats.streak > 0 && !history[todayKey];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">

      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>{profile?.username || 'User'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {levelData.level}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{rank.title}</p>
                <Progress value={levelData.progressPercent} className="h-2 mt-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  {languageXp.xp.toLocaleString()} XP · {levelData.xpToNextLevel.toLocaleString()} to next
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="p-2 rounded-md bg-muted">
                <p className="text-xs text-muted-foreground">Total XP</p>
                <p className="font-medium">{languageXp.xp.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-md bg-muted">
                <p className="text-xs text-muted-foreground">Points</p>
                <p className="font-medium">{profile?.points?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stats.streak > 0 ? 'bg-primary/10' : 'bg-muted'}`}>
                <Flame className={`h-6 w-6 ${stats.streak > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold">{stats.streak}</span>
                  <span className="text-sm text-muted-foreground">day{stats.streak === 1 ? '' : 's'}</span>
                  {isStreakAtRisk && stats.streak > 0 && (
                    <span className="text-xs text-destructive font-medium">At Risk</span>
                  )}
                </div>
                <div className="flex gap-1">
                  {lastSevenDays.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {day.date.toLocaleDateString('en', { weekday: 'narrow' })}
                      </span>
                      <div className={`w-6 h-6 rounded-sm flex items-center justify-center ${day.active ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {day.active && <span className="text-xs">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study Session Card */}
        <Card>
          <CardContent className="flex flex-col h-full">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Due for Review</p>
            <p className="text-5xl font-bold text-primary mb-2">{stats.due}</p>
            <div className="flex items-center gap-3 text-xs  text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Circle size={8} className="fill-blue-500 text-blue-500" /> {stats.newDue} New
              </span>
              <span className="flex items-center gap-1">
                <Circle size={8} className="fill-green-500 text-green-500" /> {stats.reviewDue} Reviews
              </span>
            </div>
            <Button size="lg" onClick={onStartSession} disabled={stats.due === 0} className="w-full max-w-xs md:mt-auto">
              {stats.due > 0 ? "Start Session" : "All Caught Up"}
            </Button>
            {stats.due === 0 && (
              <p className="mt-4 text-sm text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={14} /> You're all done for now!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Collection Stats */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Collection Stats</h2>
        {hasNoCards ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">Empty Inventory</p>
              <p className="text-xs text-muted-foreground">Add cards to start building your vocabulary.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">New</span>
                  <Circle size={14} className="text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{metrics.new.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Learning</span>
                  <Clock size={14} className="text-orange-500" />
                </div>
                <p className="text-2xl font-bold">{metrics.learning.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Reviewing</span>
                  <Activity size={14} className="text-purple-500" />
                </div>
                <p className="text-2xl font-bold">{metrics.reviewing.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Mastered</span>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                </div>
                <p className="text-2xl font-bold">{metrics.known.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Tabs for Detailed Stats */}
      <section>
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="mb-3">
            <TabsTrigger value="activity"><CalendarDays size={14} className="mr-1.5" /> Activity</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 size={14} className="mr-1.5" /> Analytics</TabsTrigger>
            <TabsTrigger value="health"><Sparkles size={14} className="mr-1.5" /> Deck Health</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  Review Heatmap
                </CardTitle>
                <CardDescription>Visual history of your study habits</CardDescription>
              </CardHeader>
              <CardContent>
                {hasNoActivity ? (
                  <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Activity size={32} className="opacity-20" />
                    <p className="text-sm">Start reviewing to generate activity data</p>
                  </div>
                ) : (
                  <Heatmap history={history} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            {hasNoActivity ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  Complete reviews to unlock analytics.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Review Volume</CardTitle>
                    <CardDescription>Daily card reviews over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      {isRevlogLoading ? (
                        <div className="animate-pulse bg-muted h-full w-full rounded-lg" />
                      ) : (
                        revlogStats && <ReviewVolumeChart data={revlogStats.activity} />
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Retention Rate</CardTitle>
                    <CardDescription>Pass rate vs interval</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      {isRevlogLoading ? (
                        <div className="animate-pulse bg-muted h-full w-full rounded-lg" />
                      ) : (
                        revlogStats && <TrueRetentionChart data={revlogStats.retention} targetRetention={settings.fsrs.request_retention} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  Retention Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RetentionStats cards={cards} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

```

# src/features/dashboard/components/GradeDistributionChart.tsx

```typescript
import React from 'react';
import { PieChart, Pie, Cell, Label } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface GradeDistributionChartProps {
  data: { name: string; value: number; color: string }[];
}

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({ data }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.color,
      };
    });
    return config;
  }, [data]);

  if (total === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] font-mono uppercase text-muted-foreground/40">
        No Data
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Answer Distribution</h3>
      </div>
      
      <div className="flex-1 flex items-center gap-8">
        <div className="h-[160px] w-[160px] shrink-0 relative">
            <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                data={data}
                innerRadius={60}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                stroke="none"
                >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-light tracking-tighter"
                            >
                              {total.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 16}
                              className="fill-muted-foreground text-[9px] font-mono uppercase"
                            >
                              Reviews
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
            </PieChart>
            </ChartContainer>
        </div>

        {/* Custom Legend */}
        <div className="flex flex-col gap-2 flex-1">
            {data.map((item) => (
                <div key={item.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.name}</span>
                    </div>
                    <span className="text-xs font-mono">
                        {Math.round((item.value / total) * 100)}%
                    </span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};


```

# src/features/dashboard/components/Heatmap.tsx

```typescript
import React, { useMemo } from 'react';
import { ReviewHistory } from '@/types';
import { addDays, subDays, startOfDay, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { clsx } from 'clsx';

interface HeatmapProps {
  history: ReviewHistory;
}

export const Heatmap: React.FC<HeatmapProps> = React.memo(({ history }) => {
  const calendarData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = [];

    let startDate = subDays(today, 364);
    const dayOfWeek = startDate.getDay();
    startDate = subDays(startDate, dayOfWeek);

    const totalDays = 53 * 7;

    for (let i = 0; i < totalDays; i++) {
      const d = addDays(startDate, i);
      const dateKey = format(d, 'yyyy-MM-dd');
      days.push({
        date: d,
        dateKey,
        count: history[dateKey] || 0,
        inFuture: d > today
      });
    }
    return days;
  }, [history]);



  const getColorStyle = (count: number): string => {
    if (count === 0) return 'bg-muted/30';
    if (count <= 2) return 'bg-emerald-200 dark:bg-emerald-900';
    if (count <= 5) return 'bg-emerald-400 dark:bg-emerald-700';
    if (count <= 9) return 'bg-emerald-500 dark:bg-emerald-500';
    return 'bg-emerald-600 dark:bg-emerald-400';
  };


  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      return history[dateKey] || 0;
    });

    const weekTotal = last7Days.reduce((sum, count) => sum + count, 0);
    const activeDays = last7Days.filter(count => count > 0).length;

    return { weekTotal, activeDays, last7Days: last7Days.reverse() };
  }, [history]);

  return (
    <TooltipProvider>
      {/* Mobile Summary View */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-light ">
              This Week
            </p>
            <p className="text-2xl font-light text-foreground tabular-nums">
              {stats.weekTotal} <span className="text-sm text-muted-foreground">reviews</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-light ">
              Active Days
            </p>
            <p className="text-2xl font-light text-foreground tabular-nums">
              {stats.activeDays}<span className="text-sm text-muted-foreground">/7</span>
            </p>
          </div>
        </div>

        {/* Mini week view for mobile */}
        <div className="flex gap-1.5 justify-between">
          {stats.last7Days.map((count, i) => {
            const date = subDays(new Date(), 6 - i);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground ">
                  {format(date, 'EEE').charAt(0)}
                </span>
                <div
                  className={clsx(
                    "w-full aspect-square rounded-sm transition-colors",
                    getColorStyle(count)
                  )}
                />
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Full Heatmap */}
      <div className="hidden md:block w-full overflow-x-auto overflow-y-hidden lg:overflow-x-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="inline-block min-w-max py-2 lg:w-full">
          <div className="grid grid-rows-7 grid-flow-col gap-1 lg:gap-1">
            {calendarData.map((day) => (
              <Tooltip key={day.dateKey} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div
                    className={clsx(
                      "w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-3 lg:h-3 rounded-sm transition-all duration-200 hover:scale-110 hover:ring-1 hover:ring-pine-500/50",
                      day.inFuture ? 'opacity-0 pointer-events-none' : getColorStyle(day.count)
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent
                  className="bg-card text-foreground px-4 py-2.5 rounded-xl border border-border"
                >
                  <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 ">
                    {format(day.date, 'MMM d, yyyy')}
                  </div>
                  <div className="text-sm font-light tabular-nums">
                    {day.count} review{day.count === 1 ? '' : 's'}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-muted-foreground ">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-muted/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pine-200 dark:bg-pine-900" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pine-400 dark:bg-pine-700" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pine-500 dark:bg-pine-500" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pine-600 dark:bg-pine-400" />
          </div>
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
});

```

# src/features/dashboard/components/LevelProgressBar.tsx

```typescript
import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LevelProgressBarProps {
  xp: number;
  level: number;
  className?: string;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ xp, level, className }) => {
  const progressData = useMemo(() => {


    const currentLevelStartXP = 100 * Math.pow(level - 1, 2);
    const nextLevelStartXP = 100 * Math.pow(level, 2);

    const xpGainedInLevel = xp - currentLevelStartXP;
    const xpRequiredForLevel = nextLevelStartXP - currentLevelStartXP;

    const percentage = Math.min(100, Math.max(0, (xpGainedInLevel / xpRequiredForLevel) * 100));
    const xpRemaining = nextLevelStartXP - xp;

    return { percentage, xpRemaining, nextLevelStartXP };
  }, [xp, level]);

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      {/* Labels */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">Current Level</span>
          <span className="text-sm font-medium font-sans">{level}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">Next Level</span>
          <span className="text-xs font-sans text-muted-foreground">-{progressData.xpRemaining.toLocaleString()} XP</span>
        </div>
      </div>
      {/* Bar */}
      <Progress value={progressData.percentage} className="h-1 bg-muted" />
    </div>
  );
};


```

# src/features/dashboard/components/RetentionStats.tsx

```typescript
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Card as CardType } from '@/types';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
} from 'recharts';
import { differenceInCalendarDays, parseISO, format, addDays, addMonths, eachMonthOfInterval } from 'date-fns';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface RetentionStatsProps {
  cards: CardType[];
}

export const RetentionStats: React.FC<RetentionStatsProps> = React.memo(({ cards }) => {
  const [forecastRange, setForecastRange] = useState<'7d' | '1m' | '1y'>('7d');

  const forecastData = useMemo(() => {
    const today = new Date();
    let data: { label: string; count: number; fullDate?: Date }[] = [];

    if (forecastRange === '7d') {
      data = Array.from({ length: 7 }).map((_, i) => {
        const date = addDays(today, i);
        return { label: format(date, 'EEE'), count: 0, fullDate: date };
      });
    } else if (forecastRange === '1m') {
      data = Array.from({ length: 30 }).map((_, i) => {
        const date = addDays(today, i);
        return { label: format(date, 'd'), count: 0, fullDate: date };
      });
    } else if (forecastRange === '1y') {
      const months = eachMonthOfInterval({ start: today, end: addMonths(today, 11) });
      data = months.map(date => ({ label: format(date, 'MMM'), count: 0, fullDate: date }));
    }

    cards.forEach(card => {
      if (card.status === 'known' || !card.dueDate) return;
      const dueDate = parseISO(card.dueDate);
      const diffDays = differenceInCalendarDays(dueDate, today);

      if (diffDays < 0) return;

      if (forecastRange === '7d' && diffDays < 7) data[diffDays].count++;
      else if (forecastRange === '1m' && diffDays < 30) data[diffDays].count++;
      else if (forecastRange === '1y') {
        const monthIndex = data.findIndex(d => d.fullDate && d.fullDate.getMonth() === dueDate.getMonth() && d.fullDate.getFullYear() === dueDate.getFullYear());
        if (monthIndex !== -1) data[monthIndex].count++;
      }
    });
    return data;
  }, [cards, forecastRange]);

  const stabilityData = useMemo(() => {
    const buckets = [
      { label: '0-1d', min: 0, max: 1, count: 0 },
      { label: '3d', min: 1, max: 3, count: 0 },
      { label: '1w', min: 3, max: 7, count: 0 },
      { label: '2w', min: 7, max: 14, count: 0 },
      { label: '1m', min: 14, max: 30, count: 0 },
      { label: '3m', min: 30, max: 90, count: 0 },
      { label: '3m+', min: 90, max: Infinity, count: 0 },
    ];

    cards.forEach(card => {
      if (!card.stability) return;
      const s = card.stability;
      const bucket = buckets.find(b => s >= b.min && s < b.max);
      if (bucket) bucket.count++;
    });
    return buckets;
  }, [cards]);

  const forecastConfig = {
    count: {
      label: "Cards",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  const stabilityConfig = {
    count: {
      label: "Cards",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  if (!cards || cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground font-light ">
        No data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Forecast Chart */}
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-base font-medium">Workload Forecast</CardTitle>
          <div className="flex gap-1">
            {(['7d', '1m', '1y'] as const).map((range) => (
              <Button
                key={range}
                variant={forecastRange === range ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setForecastRange(range)}
                className="h-7 px-2 text-xs"
              >
                {range}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ChartContainer config={forecastConfig} className="h-full w-full">
              <BarChart data={forecastData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => value}
                  className="text-xs text-muted-foreground"
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stability Chart */}
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-base font-medium">Memory Stability</CardTitle>
          <CardDescription className="text-xs">Retention Interval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ChartContainer config={stabilityConfig} className="h-full w-full">
              <BarChart data={stabilityData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  className="text-xs text-muted-foreground"
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

```

# src/features/dashboard/components/ReviewVolumeChart.tsx

```typescript
import React from 'react';
import { BarChart, Bar, XAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ReviewVolumeChartProps {
  data: { date: string; count: number; label: string }[];
}

export const ReviewVolumeChart: React.FC<ReviewVolumeChartProps> = ({ data }) => {
  const chartConfig = {
    count: {
      label: "Reviews",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground/50">30 Day Volume</h3>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={2}
              className="text-[10px] font-mono uppercase opacity-50 text-muted-foreground"
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[150px]"
                  formatter={(value, name, item, index, payload) => (
                    <>
                      <div className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 mb-1 text-muted-foreground">
                        {item.payload.date}
                      </div>
                      <div className="text-sm font-normal tabular-nums text-foreground">
                        {value} reviews
                      </div>
                    </>
                  )}
                />
              }
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};


```

# src/features/dashboard/components/TrueRetentionChart.tsx

```typescript
import React from 'react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface TrueRetentionChartProps {
  data: { date: string; rate: number | null }[];
  targetRetention: number;
}

export const TrueRetentionChart: React.FC<TrueRetentionChartProps> = ({ data, targetRetention }) => {
  const targetPercent = targetRetention * 100;

  const chartConfig = {
    rate: {
      label: "Pass Rate",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  const hasData = data.some(d => d.rate !== null);

  if (!hasData) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="flex justify-between items-end mb-8">
          <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50">True Retention (30d)</h3>
          <div className="flex items-center gap-3">
            <div className="w-3 h-px bg-muted-foreground/30" />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/40">Target: {targetPercent}%</span>
          </div>
        </div>
        <div className="flex-1 min-h-[150px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground font-medium">No retention data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50">True Retention (30d)</h3>
        <div className="flex items-center gap-3">
          <div className="w-3 h-px bg-muted-foreground/30" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/40">Target: {targetPercent}%</span>
        </div>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={4}
              className="text-[9px] font-mono uppercase opacity-50 text-muted-foreground"
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-[9px] font-mono uppercase opacity-50 text-muted-foreground"
            />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[150px]"
                  formatter={(value, name, item, index) => (
                    <>
                      <div className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50 mb-1 text-muted-foreground">
                        {item.payload.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-normal tabular-nums text-foreground">
                          {Number(value).toFixed(1)}%
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50 text-muted-foreground">
                          Pass Rate
                        </span>
                      </div>
                    </>
                  )}
                />
              }
            />
            <ReferenceLine y={targetPercent} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" opacity={0.3} strokeWidth={1} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="var(--color-rate)"
              strokeWidth={2}
              dot={{ r: 0 }}
              activeDot={{ r: 4, fill: "var(--color-rate)", strokeWidth: 0 }}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
};


```

# src/features/generator/components/GenerateCardsModal.tsx

```typescript
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Check, BookOpen, Loader2, RotateCcw } from 'lucide-react';
import { aiService, WordType } from '@/lib/ai';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { getLearnedWords } from '@/db/repositories/cardRepository';
import { Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';

const WORD_TYPES: { value: WordType; label: string }[] = [
    { value: 'noun', label: 'Noun' },
    { value: 'verb', label: 'Verb' },
    { value: 'adjective', label: 'Adjective' },
    { value: 'adverb', label: 'Adverb' },
    { value: 'pronoun', label: 'Pronoun' },
    { value: 'preposition', label: 'Preposition' },
    { value: 'conjunction', label: 'Conjunction' },
    { value: 'interjection', label: 'Interjection' },
];

interface GenerateCardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCards: (cards: Card[]) => void;
}

export const GenerateCardsModal: React.FC<GenerateCardsModalProps> = ({ isOpen, onClose, onAddCards }) => {
    const settings = useSettingsStore((s: any) => s.settings);
    const { profile } = useProfile();
    const isMobile = useIsMobile();
    const [step, setStep] = useState<'config' | 'preview'>('config');
    const [loading, setLoading] = useState(false);

    const [instructions, setInstructions] = useState('');
    const [count, setCount] = useState([5]);
    const [useLearnedWords, setUseLearnedWords] = useState(true);
    const [difficultyMode, setDifficultyMode] = useState<'beginner' | 'immersive'>('immersive');
    const [selectedLevel, setSelectedLevel] = useState<string>(profile?.language_level || 'A1');
    const [selectedWordTypes, setSelectedWordTypes] = useState<WordType[]>([]);

    const levelDescriptions: Record<string, string> = {
        'A1': 'Beginner',
        'A2': 'Elementary',
        'B1': 'Intermediate',
        'B2': 'Upper Intermediate',
        'C1': 'Advanced',
        'C2': 'Proficient'
    };

    const [generatedData, setGeneratedData] = useState<any[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    const toggleWordType = (wordType: WordType) => {
        setSelectedWordTypes(prev =>
            prev.includes(wordType)
                ? prev.filter(t => t !== wordType)
                : [...prev, wordType]
        );
    };

    const handleGenerate = async () => {
        if (!instructions) {
            toast.error("Please enter instructions");
            return;
        }
        if (!settings.geminiApiKey) {
            toast.error("Please add your Gemini API Key in Settings > General");
            return;
        }

        setLoading(true);
        try {
            let learnedWords: string[] = [];
            try {
                learnedWords = await getLearnedWords(settings.language);
            } catch (e) {
                console.error("Failed to fetch learned words", e);
            }

            const results = await aiService.generateBatchCards({
                instructions,
                count: count[0],
                language: settings.language,
                apiKey: settings.geminiApiKey,
                learnedWords: useLearnedWords ? learnedWords : undefined,
                proficiencyLevel: selectedLevel,
                difficultyMode,
                wordTypeFilters: selectedWordTypes.length > 0 ? selectedWordTypes : undefined
            });

            const existingWordSet = new Set(learnedWords.map(w => w.toLowerCase()));

            const uniqueResults = results.filter((card: any) => {
                if (!card.targetWord) return true;
                return !existingWordSet.has(card.targetWord.toLowerCase());
            });

            if (uniqueResults.length < results.length) {
                toast.info(`Filtered out ${results.length - uniqueResults.length} duplicate words.`);
            }


            setGeneratedData(uniqueResults);
            setSelectedIndices(new Set(uniqueResults.map((_: any, i: number) => i)));
            setStep('preview');
        } catch (e: any) {
            console.error("Generation error:", e);
            toast.error(e.message || "Failed to generate cards. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelectedIndices(newSet);
    };

    const handleSave = () => {
        const now = Date.now();
        const cardsToSave: Card[] = generatedData
            .filter((_, i) => selectedIndices.has(i))
            .map((item, index) => {
                return {
                    id: uuidv4(),
                    targetSentence: item.targetSentence,
                    nativeTranslation: item.nativeTranslation,
                    targetWord: item.targetWord,
                    targetWordTranslation: item.targetWordTranslation,
                    targetWordPartOfSpeech: item.targetWordPartOfSpeech,
                    notes: item.notes,
                    furigana: item.furigana,
                    language: settings.language,
                    status: 'new',
                    interval: 0,
                    easeFactor: 2.5,
                    dueDate: new Date(now + index * 1000).toISOString(),
                    reps: 0,
                    lapses: 0,
                    tags: ['AI-Gen', 'Custom']
                } as Card;
            });


        onAddCards(cardsToSave);
        toast.success(`Added ${cardsToSave.length} cards to deck`);
        resetAndClose();
    };

    const handleSmartLesson = async () => {
        setLoading(true);
        try {
            let learnedWords: string[] = [];
            try {
                learnedWords = await getLearnedWords(settings.language);
            } catch (e) {
                console.error("Failed to fetch learned words", e);
            }

            let topicInstructions = "";
            let derivedLevel = selectedLevel;

            if (learnedWords.length === 0) {
                const starters = [
                    "Basic Greetings & Introductions",
                    "Ordering Food & Drink",
                    "Numbers & Shopping",
                    "Family & Friends"
                ];
                topicInstructions = starters[Math.floor(Math.random() * starters.length)];
                setDifficultyMode('beginner');
            } else {
                const shuffled = [...learnedWords].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 100);

                topicInstructions = `Create a structured lesson that reviews and expands upon these known words: ${selected.join(', ')}. Create sentences that place these words in new contexts or combine them.`;
            }

            setInstructions(topicInstructions);
            const results = await aiService.generateBatchCards({
                instructions: topicInstructions,
                count: count[0],
                language: settings.language,
                apiKey: settings.geminiApiKey,
                learnedWords: useLearnedWords ? learnedWords : undefined,
                proficiencyLevel: derivedLevel,
                difficultyMode,
                wordTypeFilters: selectedWordTypes.length > 0 ? selectedWordTypes : undefined
            });

            const existingWordSet = new Set(learnedWords.map(w => w.toLowerCase()));

            const uniqueResults = results.filter((card: any) => {
                if (!card.targetWord) return true;
                return !existingWordSet.has(card.targetWord.toLowerCase());
            });

            if (uniqueResults.length < results.length) {
                toast.info(`Filtered out ${results.length - uniqueResults.length} duplicate words.`);
            }

            setGeneratedData(uniqueResults);
            setSelectedIndices(new Set(uniqueResults.map((_: any, i: number) => i)));
            setStep('preview');

        } catch (e: any) {
            console.error("Smart lesson error:", e);
            toast.error(e.message || "Failed to generate smart lesson. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        setStep('config');
        setInstructions('');
        setGeneratedData([]);
        setSelectedWordTypes([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="max-w-4xl p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden">
                {step === 'config' ? (
                    <>
                        <DialogHeader className="px-6 py-4 border-b shrink-0">
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Card Generator
                            </DialogTitle>
                            <DialogDescription>
                                Generate AI-powered flashcards for <strong>{settings.language}</strong> learning.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto">
                            <div className={cn(
                                "grid h-full",
                                isMobile ? "grid-cols-1" : "grid-cols-[280px_1fr]"
                            )}>
                                {/* Sidebar Config */}
                                <div className={cn(
                                    "bg-muted/30 p-5 space-y-5",
                                    !isMobile && "border-r"
                                )}>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Quantity</Label>
                                            <span className="text-sm font-semibold text-primary">{count[0]}</span>
                                        </div>
                                        <Slider
                                            value={count}
                                            onValueChange={setCount}
                                            min={3}
                                            max={50}
                                            step={1}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Proficiency Level</Label>
                                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(levelDescriptions).map(([lvl, desc]) => (
                                                    <SelectItem key={lvl} value={lvl}>
                                                        <span className="font-medium mr-2">{lvl}</span>
                                                        <span className="text-muted-foreground text-xs">{desc}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Learning Path</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant={difficultyMode === 'beginner' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setDifficultyMode('beginner')}
                                                className="h-auto flex-col py-3 gap-1"
                                            >
                                                <span className="text-xs font-semibold">Zero to Hero</span>
                                                <span className="text-[10px] opacity-70">Single words</span>
                                            </Button>
                                            <Button
                                                variant={difficultyMode === 'immersive' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setDifficultyMode('immersive')}
                                                className="h-auto flex-col py-3 gap-1"
                                            >
                                                <span className="text-xs font-semibold">Immersive</span>
                                                <span className="text-[10px] opacity-70">Full sentences</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between gap-3">
                                        <Label htmlFor="learned-words" className="text-sm font-normal leading-tight">
                                            Include Learned Words (i+1)
                                        </Label>
                                        <Switch
                                            id="learned-words"
                                            checked={useLearnedWords}
                                            onCheckedChange={setUseLearnedWords}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Word Types</Label>
                                            {selectedWordTypes.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 text-xs px-1.5"
                                                    onClick={() => setSelectedWordTypes([])}
                                                >
                                                    Clear
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            Leave empty for all types
                                        </p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {WORD_TYPES.map((type) => (
                                                <div
                                                    key={type.value}
                                                    className={cn(
                                                        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                                                        selectedWordTypes.includes(type.value)
                                                            ? "bg-primary/10"
                                                            : "hover:bg-muted/50"
                                                    )}
                                                    onClick={() => toggleWordType(type.value)}
                                                >
                                                    <Checkbox
                                                        id={`word-type-${type.value}`}
                                                        checked={selectedWordTypes.includes(type.value)}
                                                        onCheckedChange={() => toggleWordType(type.value)}
                                                        className="h-3.5 w-3.5"
                                                    />
                                                    <label
                                                        htmlFor={`word-type-${type.value}`}
                                                        className="text-xs cursor-pointer select-none"
                                                    >
                                                        {type.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Input Area */}
                                <div className="p-5 flex flex-col gap-5">
                                    <div className="space-y-3 flex-1">
                                        <div>
                                            <Label htmlFor="instructions" className="text-sm font-semibold">
                                                Topic or Scenario
                                            </Label>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Describe what you want to learn. Be specific about context and vocabulary.
                                            </p>
                                        </div>
                                        <Textarea
                                            id="instructions"
                                            value={instructions}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInstructions(e.target.value)}
                                            placeholder="e.g. I want to learn how to order coffee in a busy cafe, focusing on polite expressions..."
                                            className={cn(
                                                "resize-none text-sm",
                                                isMobile ? "h-24" : "h-32"
                                            )}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={loading || !instructions}
                                            className="w-full"
                                            size="lg"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Generate Cards
                                                </>
                                            )}
                                        </Button>

                                        <div className="relative py-2">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-background px-2 text-muted-foreground">Or</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleSmartLesson}
                                            disabled={loading}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            <BookOpen className="mr-2 h-4 w-4" />
                                            Smart Lesson from Progress
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="px-6 py-4 border-b shrink-0">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <DialogTitle>Review Generated Cards</DialogTitle>
                                    <DialogDescription>
                                        Select the cards you want to add to your deck.
                                    </DialogDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setStep('config')} className="gap-2 shrink-0">
                                    <RotateCcw className="h-4 w-4" />
                                    {!isMobile && "Edit Params"}
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="px-6 py-3 border-b bg-muted/30 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Selected: <span className="text-foreground font-semibold">{selectedIndices.size}</span> of {generatedData.length}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedIndices(new Set(generatedData.map((_, i) => i)))}
                                >
                                    Select All
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedIndices(new Set())}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 max-h-[50vh]">
                            <div className="p-4 space-y-3">
                                {generatedData.map((card, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => toggleSelection(idx)}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3",
                                            selectedIndices.has(idx)
                                                ? "bg-primary/5 border-primary shadow-sm"
                                                : "bg-card border-transparent hover:border-muted-foreground/30"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                                selectedIndices.has(idx)
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-muted-foreground/50"
                                            )}
                                        >
                                            {selectedIndices.has(idx) && <Check className="h-3 w-3" strokeWidth={3} />}
                                        </div>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <p className="font-medium text-foreground leading-snug">{card.targetSentence}</p>
                                            <p className="text-sm text-muted-foreground">{card.nativeTranslation}</p>
                                            <div className="text-xs text-muted-foreground/70 mt-2 flex flex-wrap gap-2 items-center">
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{card.targetWord}</span>
                                                <span className="italic">{card.targetWordTranslation}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0 gap-2 sm:gap-2">
                            <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
                            <Button onClick={handleSave} disabled={selectedIndices.size === 0}>
                                <Check className="mr-2 h-4 w-4" />
                                Save {selectedIndices.size} Cards
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

```

# src/features/generator/services/csvImport.ts

```typescript
import { v4 as uuidv4 } from 'uuid';
import { Card, Language, LanguageId } from '@/types';
import Papa from 'papaparse';

type CsvRow = Record<string, string>;

const normalizeHeader = (header: string) =>
    header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

const pickValue = (row: CsvRow, keys: string[]): string | undefined => {
    for (const key of keys) {
        const value = row[key];
        if (value && value.trim()) {
            return value.trim();
        }
    }
    return undefined;
};

const isLanguage = (value?: string): value is Language =>
    value === LanguageId.Polish || value === LanguageId.Norwegian || value === LanguageId.Japanese || value === LanguageId.Spanish;

const rowToCard = (row: CsvRow, fallbackLanguage: Language): Card | null => {
    const sentence = pickValue(row, ['target_sentence', 'sentence', 'text', 'front', 'prompt']);
    const translation = pickValue(row, ['native_translation', 'translation', 'back', 'answer']);

    if (!sentence || !translation) {
        return null;
    }

    const languageCandidate = pickValue(row, ['language', 'lang'])?.toLowerCase();
    const language = isLanguage(languageCandidate) ? languageCandidate : fallbackLanguage;
    const tagsRaw = pickValue(row, ['tags', 'tag_list', 'labels']);
    const notes = pickValue(row, ['notes', 'context', 'hint']) || '';
    const targetWord = pickValue(row, ['target_word', 'keyword', 'cloze']);
    const furigana = pickValue(row, ['furigana', 'reading', 'ruby']);

    return {
        id: uuidv4(),
        targetSentence: sentence,
        targetWord: targetWord || undefined,
        nativeTranslation: translation,
        notes,
        tags: tagsRaw
            ? tagsRaw
                .split(/[|;,]/)
                .map((tag) => tag.trim())
                .filter(Boolean)
            : undefined,
        furigana: furigana || undefined,
        language,
        status: 'new',
        interval: 0,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        reps: 0,
        lapses: 0,
    };
};

export const parseCardsFromCsv = (payload: string, fallbackLanguage: Language): Card[] => {
    const sanitized = payload.trim();
    if (!sanitized) return [];

    const { data } = Papa.parse<Record<string, string>>(sanitized, {
        header: true,
        skipEmptyLines: true,
        transformHeader: normalizeHeader,
    });

    const cards: Card[] = [];

    for (const row of data) {
        if (Object.values(row).every(val => !val || !val.trim())) continue;

        const card = rowToCard(row, fallbackLanguage);
        if (card) {
            cards.push(card);
        }
    }

    return cards;
};

export const signatureForCard = (sentence: string, language: Language) =>
    `${language}::${sentence.trim().toLowerCase()}`;

```

# src/features/generator/services/deckGeneration.ts

```typescript
import { aiService } from '@/lib/ai';
import { Card, Difficulty, Language } from '@/types';

export interface GenerateInitialDeckOptions {
    language: Language;
    proficiencyLevel: Difficulty;
    apiKey?: string;
}

export async function generateInitialDeck(options: GenerateInitialDeckOptions): Promise<Card[]> {
    if (!options.apiKey) {
        throw new Error('API Key is required for AI deck generation');
    }

    try {
        const totalCards = 50;
        const batchSize = 10;

        const topics = [
            "Casual Greetings & Meeting New Friends (informal)",
            "Ordering Coffee, Pastries & Restaurant Basics",
            "Navigating the City & Public Transport Survival",
            "Talking about Hobbies, Movies & Weekend Plans",
            "Essential Health & Emergency Phrases (Safety First)"
        ];

        const promises = topics.map((topic) =>
            aiService.generateBatchCards({
                language: options.language,
                instructions: `Generate content for ${options.proficiencyLevel} level. Topic: ${topic}. Ensure sentences are practical and varied.`,
                count: batchSize,
                apiKey: options.apiKey!,
            })
        );

        const results = await Promise.all(promises);
        const generatedData = results.flat();

        if (!generatedData || !Array.isArray(generatedData)) {
            throw new Error('Invalid response format from AI service');
        }

        const now = Date.now();
        const cards: Card[] = generatedData.map((card: any, index: number) => ({
            id: crypto.randomUUID(),
            targetSentence: card.targetSentence,
            nativeTranslation: card.nativeTranslation,
            targetWord: card.targetWord,
            targetWordTranslation: card.targetWordTranslation,
            targetWordPartOfSpeech: card.targetWordPartOfSpeech,
            gender: card.gender,
            grammaticalCase: card.grammaticalCase,
            notes: card.notes,
            furigana: card.furigana,
            language: options.language,
            status: 'new' as const,
            interval: 0,
            easeFactor: 2.5,
            dueDate: new Date(now + index * 1000).toISOString(),
            tags: [options.proficiencyLevel, 'Starter', 'AI-Gen'],
        }));

        return cards;
    } catch (error: any) {
        console.error('Failed to generate initial deck:', error);
        throw new Error(error.message || 'Failed to generate deck via AI service');
    }
}

```

# src/features/profile/hooks/useProfile.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, LocalProfile } from '@/db/dexie';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useProfile = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const profileQuery = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const profile = await db.profile.get(user.id);
            return profile || null;
        },
        enabled: !!user?.id,
        staleTime: Infinity,
    });



    const updateUsernameMutation = useMutation({
        mutationFn: async (newUsername: string) => {
            if (!user?.id) throw new Error('No user authenticated');

            await db.profile.update(user.id, {
                username: newUsername,
                updated_at: new Date().toISOString()
            });
            return newUsername;
        },
        onSuccess: (newUsername) => {
            queryClient.setQueryData<LocalProfile | null>(['profile', user?.id], (old) =>
                old ? { ...old, username: newUsername } : null
            );
        },
    });

    const updateLanguageLevelMutation = useMutation({
        mutationFn: async (level: string) => {
            if (!user?.id) throw new Error('No user authenticated');

            await db.profile.update(user.id, {
                language_level: level,
                updated_at: new Date().toISOString()
            });
            return level;
        },
        onSuccess: (level) => {
            queryClient.setQueryData<LocalProfile | null>(['profile', user?.id], (old) =>
                old ? { ...old, language_level: level } : null
            );
            toast.success('Language level updated');
        },
    });

    const markInitialDeckGeneratedMutation = useMutation({
        mutationFn: async (userId: string = user?.id || '') => {
            if (!userId) throw new Error('No user ID available');

            await db.profile.update(userId, {
                initial_deck_generated: true,
                updated_at: new Date().toISOString()
            });
            return userId;
        },
        onSuccess: (_, variablesUserId) => {
            const targetId = variablesUserId || user?.id; queryClient.setQueryData<LocalProfile | null>(['profile', targetId], (old) =>
                old ? { ...old, initial_deck_generated: true } : null
            );
            queryClient.invalidateQueries({ queryKey: ['profile', targetId] });
        },
    });

    return {
        profile: profileQuery.data ?? null,
        loading: profileQuery.isLoading,
        error: profileQuery.error,

        updateUsername: (username: string) => updateUsernameMutation.mutateAsync(username),
        updateLanguageLevel: (level: string) => updateLanguageLevelMutation.mutateAsync(level),
        markInitialDeckGenerated: (userId?: string) => markInitialDeckGeneratedMutation.mutateAsync(userId),
        refreshProfile: () => profileQuery.refetch(),
    };
};

```

# src/features/settings/components/AlgorithmSettings.tsx

```typescript
import React, { useState } from 'react';
import { Wand2, RefreshCw, Target, Sliders, Settings, Download, Upload } from 'lucide-react';
import { UserSettings } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAllReviewLogs } from '@/db/repositories/revlogRepository';
import { optimizeFSRS } from '@/lib/fsrsOptimizer';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { exportRevlogToCSV } from '@/features/settings/logic/optimizer';
import { db } from '@/db/dexie';
import { Textarea } from '@/components/ui/textarea';

interface AlgorithmSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}


export const AlgorithmSettings: React.FC<AlgorithmSettingsProps> = ({
  localSettings,
  setLocalSettings,
}) => {
  const { user } = useAuth();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<{ reviews: number; } | null>(null);
  const [manualWeights, setManualWeights] = useState(localSettings.fsrs.w.join(', '));
  const [showManual, setShowManual] = useState(false);

  const handleExport = async () => {
    try {
      await exportRevlogToCSV(db);
      toast.success("RevLog exported to CSV");
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    }
  };

  const handleWeightsChange = (val: string) => {
    setManualWeights(val);
    const weights = val.split(/[\s,]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (weights.length === 19) {
      setLocalSettings(prev => ({ ...prev, fsrs: { ...prev.fsrs, w: weights } }));
    }
  };

  const handleOptimize = async () => {
    if (!user) return;
    setIsOptimizing(true);
    setProgress(0);
    try {
      const logs = await getAllReviewLogs(localSettings.language);
      if (logs.length < 50) {
        toast.error("Insufficient data (50+ reviews required).");
        setIsOptimizing(false);
        return;
      }
      const currentW = localSettings.fsrs.w || FSRS_DEFAULTS.w;

      const worker = new Worker(new URL('../../../workers/fsrs.worker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (e) => {
        const { type, progress, w, error } = e.data;
        if (type === 'progress') {
          setProgress(progress);
        } else if (type === 'result') {
          setLocalSettings(prev => ({ ...prev, fsrs: { ...prev.fsrs, w } }));
          setReport({ reviews: logs.length });
          toast.success("Optimization complete");
          worker.terminate();
          setIsOptimizing(false);
        } else if (type === 'error') {
          toast.error(`Optimization failed: ${error}`);
          worker.terminate();
          setIsOptimizing(false);
        }
      };

      worker.postMessage({ logs, currentW });
    } catch (e) {
      toast.error("Optimization failed to start");
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Retention Target Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          Retention Target
        </h3>
        <p className="text-sm text-muted-foreground">Target accuracy for scheduled reviews</p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-medium ">
                Target Retention
              </label>
            </div>
            <span className="text-5xl md:text-6xl font-light tabular-nums text-foreground">
              {Math.round(localSettings.fsrs.request_retention * 100)}<span className="text-xl text-muted-foreground/40">%</span>
            </span>
          </div>

          <div className="space-y-4">
            <Slider
              min={0.7} max={0.99} step={0.01}
              value={[localSettings.fsrs.request_retention]}
              onValueChange={([value]) =>
                setLocalSettings((prev) => ({
                  ...prev, fsrs: { ...prev.fsrs, request_retention: value },
                }))
              }
              className="py-3"
            />
            <div className="flex justify-between text-xs  text-muted-foreground/50 uppercase tracking-wider">
              <span>Faster Reviews</span>
              <span>Higher Accuracy</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Optimization Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          Optimization
        </h3>
        <p className="text-sm text-muted-foreground">Personalize algorithm parameters</p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              Analyzes {report ? `${report.reviews} review records` : 'your review history'} to calculate personalized parameters.
            </p>
            {report && (
              <span className="text-xs  uppercase tracking-[0.15em] text-pine-500">Complete</span>
            )}
          </div>

          {isOptimizing ? (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground  mb-1 uppercase tracking-wider">Processing review data</div>
              <Progress
                value={progress}
                className="h-2"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleOptimize}
                variant="secondary"
                className="w-full"
              >
                <Wand2 size={14} strokeWidth={1.5} /> Quick Optimize (In-Browser)
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleExport} variant="outline" className="w-full text-xs">
                  <Download size={12} className="mr-2" /> Export Data
                </Button>
                <Button onClick={() => setShowManual(!showManual)} variant="outline" className="w-full text-xs box-border">
                  <Sliders size={12} className="mr-2" /> Manual Params
                </Button>
              </div>

              {showManual && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider">Parameters (w)</p>
                  <Textarea
                    value={manualWeights}
                    onChange={(e) => handleWeightsChange(e.target.value)}
                    className="font-mono text-xs bg-muted/30 min-h-[80px]"
                    placeholder="0.4, 0.6, 2.4, ..."
                  />
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    Paste the 19 comma-separated weights from the FSRS optimizer output here.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Advanced Settings Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          Advanced
        </h3>
        <p className="text-sm text-muted-foreground">Fine-tune scheduling behavior</p>
      </div>
      <div className="space-y-3">
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium ">
                Maximum Interval (days)
              </label>
            </div>
            <Input
              type="number"
              className="font-mono text-sm bg-transparent border-0 border-b border-border/30 rounded-none px-0 py-2 placeholder:text-muted-foreground/30 focus-visible:border-primary/60 shadow-none focus-visible:ring-0"
              value={localSettings.fsrs.maximum_interval}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev, fsrs: { ...prev.fsrs, maximum_interval: parseInt(e.target.value) || 36500 },
                }))
              }
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground ">Enable Fuzzing</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Prevents clustering of due dates by adding randomness</p>
            </div>
            <Switch
              checked={localSettings.fsrs.enable_fuzzing}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, fsrs: { ...prev.fsrs, enable_fuzzing: checked } }))
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Reset Button */}
      <div className="pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocalSettings(prev => ({ ...prev, fsrs: { ...prev.fsrs, w: FSRS_DEFAULTS.w } }))}
          className="text-xs uppercase tracking-widest text-muted-foreground/40 hover:text-destructive hover:bg-transparent h-auto p-0 flex items-center gap-2"
        >
          <RefreshCw size={11} strokeWidth={1.5} /> Reset to Default Parameters
        </Button>
      </div>
    </div>
  );
};


```

# src/features/settings/components/AudioSettings.tsx

```typescript
import React from 'react';
import { Volume2, Mic, Gauge } from 'lucide-react';
import { UserSettings } from '@/types';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VoiceOption { id: string; name: string; }

interface AudioSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  availableVoices: VoiceOption[];
  onTestAudio: () => void;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({
  localSettings,
  setLocalSettings,
  availableVoices,
  onTestAudio,
}) => {
  const updateTts = (partial: Partial<UserSettings['tts']>) =>
    setLocalSettings((prev) => ({ ...prev, tts: { ...prev.tts, ...partial } }));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Speech Provider Section */}
      <div>
        <h3 className="text-lg font-medium">Speech Provider</h3>
        <p className="text-sm text-muted-foreground">Text-to-speech engine configuration</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={localSettings.tts.provider}
              onValueChange={(value) => updateTts({ provider: value as any, voiceURI: null })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: 'browser', label: 'Browser Native' },
                  { value: 'google', label: 'Google Cloud TTS' },
                  { value: 'azure', label: 'Microsoft Azure' },
                ].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {localSettings.tts.provider !== 'browser' && (
            <div className="pt-4 space-y-4 border-t mt-4">
              <div className="space-y-2">
                <Label>API Credentials</Label>
                <Input
                  type="password"
                  placeholder={localSettings.tts.provider === 'google' ? "Google Cloud API key" : "Azure subscription key"}
                  value={localSettings.tts.provider === 'google' ? localSettings.tts.googleApiKey : localSettings.tts.azureApiKey}
                  onChange={(e) => updateTts(localSettings.tts.provider === 'google' ? { googleApiKey: e.target.value } : { azureApiKey: e.target.value })}
                  className="font-mono"
                />
              </div>
              {localSettings.tts.provider === 'azure' && (
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input
                    placeholder="e.g., eastus, westeurope"
                    value={localSettings.tts.azureRegion}
                    onChange={(e) => updateTts({ azureRegion: e.target.value })}
                    className="font-mono"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Voice Selection Section */}
      <div>
        <h3 className="text-lg font-medium">Voice Selection</h3>
        <p className="text-sm text-muted-foreground">Choose and test your preferred voice</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Voice</Label>
              <Select
                value={localSettings.tts.voiceURI || 'default'}
                onValueChange={(value) => updateTts({ voiceURI: value === 'default' ? null : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">System Default</SelectItem>
                  {availableVoices.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={onTestAudio}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Test Voice
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Playback Settings */}
      <div>
        <h3 className="text-lg font-medium">Playback</h3>
        <p className="text-sm text-muted-foreground">Audio speed and volume controls</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Speed</CardTitle>
            <CardDescription>Adjust playback rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-light">{localSettings.tts.rate.toFixed(1)}x</span>
            </div>
            <Slider
              min={0.5} max={2} step={0.1}
              value={[localSettings.tts.rate]}
              onValueChange={([v]) => updateTts({ rate: v })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume</CardTitle>
            <CardDescription>Adjust output volume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-light">{Math.round(localSettings.tts.volume * 100)}%</span>
            </div>
            <Slider
              min={0} max={1} step={0.1}
              value={[localSettings.tts.volume]}
              onValueChange={([v]) => updateTts({ volume: v })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

```

# src/features/settings/components/DataSettings.tsx

```typescript
import React, { RefObject } from 'react';
import { Download, Upload, Cloud, Check, Database, HardDrive, RotateCcw, Key } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { SyncthingSettings } from './SyncthingSettings';
import { Switch } from '@/components/ui/switch';

interface DataSettingsProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  csvInputRef: RefObject<HTMLInputElement>;
  onRestoreBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
  jsonInputRef: RefObject<HTMLInputElement>;
  isRestoring: boolean;
  onSyncToCloud: () => void;
  isSyncingToCloud: boolean;
  syncComplete: boolean;
  onSyncthingSave?: () => void;
  onSyncthingLoad?: () => void;
  isSyncthingSaving?: boolean;
  isSyncthingLoading?: boolean;
  lastSyncthingSync?: string | null;
  includeApiKeys: boolean;
  onIncludeApiKeysChange: (checked: boolean) => void;
  importApiKeys: boolean;
  onImportApiKeysChange: (checked: boolean) => void;
}

export const DataSettings: React.FC<DataSettingsProps> = ({
  onExport,
  onImport,
  csvInputRef,
  onRestoreBackup,
  jsonInputRef,
  isRestoring,
  onSyncToCloud,
  isSyncingToCloud,
  syncComplete,
  onSyncthingSave,
  onSyncthingLoad,
  isSyncthingSaving,
  isSyncthingLoading,
  lastSyncthingSync,
  includeApiKeys,
  onIncludeApiKeysChange,
  importApiKeys,
  onImportApiKeysChange,
}) => (
  <div className="space-y-6 max-w-2xl">

    {/* Import & Export Section */}
    <div className="mb-6">
      <h3 className="text-lg font-medium">Import & Export</h3>
      <p className="text-sm text-muted-foreground">Backup and restore your data</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button
        variant="outline"
        className="h-auto flex flex-col items-center text-center p-6 space-y-2 hover:bg-muted/50 transition-colors"
        onClick={onExport}
      >
        <Download className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="font-medium text-foreground">Export Backup</span>
        <span className="text-sm text-muted-foreground font-normal">Download complete data archive</span>
      </Button>

      <Button
        variant="outline"
        className={`h-auto flex flex-col items-center text-center p-6 space-y-2 hover:bg-muted/50 transition-colors ${isRestoring ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => !isRestoring && jsonInputRef.current?.click()}
        disabled={isRestoring}
      >
        <RotateCcw className={`h-8 w-8 text-muted-foreground mb-2 ${isRestoring ? 'animate-spin' : ''}`} />
        <span className="font-medium text-foreground">{isRestoring ? 'Restoring...' : 'Restore Backup'}</span>
        <span className="text-sm text-muted-foreground font-normal">Import from JSON backup file</span>
      </Button>
    </div>

    {/* Import Cards Section */}
    <Button
      variant="outline"
      className="w-full h-auto flex items-center justify-start gap-4 p-4 hover:bg-muted/50 transition-colors"
      onClick={() => csvInputRef.current?.click()}
    >
      <Upload className="h-5 w-5 text-muted-foreground" />
      <div className="text-left">
        <div className="font-medium text-foreground">Import Cards</div>
        <div className="text-sm text-muted-foreground font-normal">Add flashcards from CSV file (without replacing existing)</div>
      </div>
    </Button>

    <Separator className="my-6" />

    {/* API Key Options Section */}
    <div className="mb-6">
      <h3 className="text-lg font-medium">API Key Options</h3>
      <p className="text-sm text-muted-foreground">Control how API keys are handled</p>
    </div>
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <h4 className="font-medium">Include API Keys in Export</h4>
          <p className="text-sm text-muted-foreground">Include your API keys when exporting backup files</p>
        </div>
        <Switch
          checked={includeApiKeys}
          onCheckedChange={onIncludeApiKeysChange}
        />
      </div>
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <h4 className="font-medium">Import API Keys from Backup</h4>
          <p className="text-sm text-muted-foreground">Restore API keys when importing backup files</p>
        </div>
        <Switch
          checked={importApiKeys}
          onCheckedChange={onImportApiKeysChange}
        />
      </div>
    </div>

    <Separator className="my-6" />

    {/* Cloud Storage Section */}
    <div className="mb-6">
      <h3 className="text-lg font-medium">Cloud Storage</h3>
      <p className="text-sm text-muted-foreground">Sync data across devices</p>
    </div>
    <Card className={syncComplete ? "border-green-500/50" : ""}>
      <CardContent className="flex items-center gap-4 py-4">
        {syncComplete ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <Cloud className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="flex-1">
          <h4 className="font-medium">
            {syncComplete ? "Synchronized" : "Sync to Cloud"}
          </h4>
          <p className="text-sm text-muted-foreground">
            {isSyncingToCloud
              ? "Uploading data..."
              : syncComplete
                ? "Your data is backed up"
                : "Migrate local database to cloud"
            }
          </p>
        </div>
        {!syncComplete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncToCloud}
            disabled={isSyncingToCloud}
          >
            {isSyncingToCloud ? "Syncing..." : "Sync"}
          </Button>
        )}
      </CardContent>
    </Card>

    <Separator className="my-6" />

    {/* Syncthing Sync Section */}
    {onSyncthingSave && onSyncthingLoad && (
      <SyncthingSettings
        onSave={onSyncthingSave}
        onLoad={onSyncthingLoad}
        isSaving={isSyncthingSaving || false}
        isLoading={isSyncthingLoading || false}
        lastSync={lastSyncthingSync || null}
      />
    )}

    <input type="file" ref={csvInputRef} accept=".csv,.txt" className="hidden" onChange={onImport} />
    <input type="file" ref={jsonInputRef} accept=".json" className="hidden" onChange={onRestoreBackup} />

    {/* Help Text */}
    <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
      <p><span className="font-semibold text-foreground">Restore Backup:</span> Replaces all data with a previous JSON backup.</p>
      <p><span className="font-semibold text-foreground">Import Cards:</span> Adds cards from CSV without replacing existing data.</p>
    </div>
  </div>
);

```

# src/features/settings/components/FloatingSyncButton.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { Save, Check, Loader2 } from 'lucide-react';
import { useSyncthingSync } from '@/features/settings/hooks/useSyncthingSync';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingSyncButtonProps {
    className?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingSyncButton: React.FC<FloatingSyncButtonProps> = ({
    className,
    position = 'bottom-right'
}) => {
    const { saveToSyncFile, isSaving, lastSync } = useSyncthingSync();
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = async () => {
        const success = await saveToSyncFile();
        if (success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }
    };

    const positionClasses = {
        'bottom-right': 'bottom-20 right-6',
        'bottom-left': 'bottom-6 left-6',
        'top-right': 'top-6 right-6',
        'top-left': 'top-6 left-6',
    };

    return (
        <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="ghost"
            className={cn(
                'fixed z-50 flex items-center gap-2 px-4 py-6 h-auto',
                'bg-card/95 backdrop-blur-sm border border-border/50',
                'hover:border-primary/50 hover:bg-card transition-all duration-200',
                'shadow-lg shadow-black/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'group',
                positionClasses[position],
                className
            )}
            title={lastSync ? `Last synced: ${new Date(lastSync).toLocaleString()}` : 'Save changes to sync file'}
        >
            {isSaving ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm  text-muted-foreground">Saving...</span>
                </>
            ) : showSuccess ? (
                <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm  text-green-500">Saved!</span>
                </>
            ) : (
                <>
                    <Save className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm  text-muted-foreground group-hover:text-foreground transition-colors">
                        Save Changes
                    </span>
                </>
            )}
        </Button>
    );
};

```

# src/features/settings/components/GeneralSettings.tsx

```typescript
import React from 'react';
import { User, Globe, Sparkles, Settings } from 'lucide-react';
import { LANGUAGE_NAMES } from '@/constants';
import { UserSettings } from '@/types';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface GeneralSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  username: string;
  setUsername: (username: string) => void;
  languageLevel: string;
  onUpdateLevel: (level: string) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  localSettings,
  setLocalSettings,
  username,
  setUsername,
  languageLevel,
  onUpdateLevel
}) => {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Section */}
      <div>
        <h3 className="text-lg font-medium">Identity</h3>
        <p className="text-sm text-muted-foreground">Your public profile information</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Displayed on global leaderboards and achievements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Display Name</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your display name"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Language Section */}
      <div>
        <h3 className="text-lg font-medium">Language</h3>
        <p className="text-sm text-muted-foreground">Active course configuration</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Course</CardTitle>
            <CardDescription>Select the language you are currently learning.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={localSettings.language}
              onValueChange={(value) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  language: value as UserSettings['language'],
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGE_NAMES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proficiency Level</CardTitle>
            <CardDescription>Controls the complexity of AI-generated content.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={languageLevel || 'A1'}
              onValueChange={onUpdateLevel}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: 'A1', label: 'A1 - Beginner' },
                  { value: 'A2', label: 'A2 - Elementary' },
                  { value: 'B1', label: 'B1 - Intermediate' },
                  { value: 'C1', label: 'C1 - Advanced' },
                ].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme Accent</CardTitle>
            <CardDescription>Customize the accent color for this language.</CardDescription>
          </CardHeader>
          <CardContent>
            <ColorPicker
              label=""
              value={localSettings.languageColors?.[localSettings.language] || '0 0% 0%'}
              onChange={(newColor) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  languageColors: {
                    ...(prev.languageColors || {}),
                    [prev.language]: newColor,
                  } as any,
                }))
              }
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* API Section */}
      <div>
        <h3 className="text-lg font-medium">AI Integration</h3>
        <p className="text-sm text-muted-foreground">Gemini API configuration</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gemini API Key</CardTitle>
          <CardDescription>Powers sentence generation and linguistic analysis features.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            value={localSettings.geminiApiKey || ''}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
            placeholder="Enter your API key"
            className="font-mono"
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Behavior Toggles */}
      <div>
        <h3 className="text-lg font-medium">Behavior</h3>
        <p className="text-sm text-muted-foreground">Study session preferences</p>
      </div>
      <div className="space-y-4">
        {[
          { label: 'Automatic Audio', desc: 'Play pronunciation when card is revealed', key: 'autoPlayAudio' },
          { label: 'Listening Mode', desc: 'Hide text until audio completes', key: 'blindMode' },
          { label: 'Show Translation', desc: 'Display native language meaning', key: 'showTranslationAfterFlip' }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">{item.label}</Label>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <Switch
              checked={(localSettings as any)[item.key]}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, [item.key]: checked }))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

```

# src/features/settings/components/SettingsLayout.tsx

```typescript
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Volume2, Target, Sliders, Database, Skull } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const SettingsLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const tabs = [
        { path: '/settings/general', label: 'General', icon: Settings },
        { path: '/settings/audio', label: 'Audio', icon: Volume2 },
        { path: '/settings/study', label: 'Limits', icon: Target },
        { path: '/settings/fsrs', label: 'FSRS', icon: Sliders },
        { path: '/settings/data', label: 'Data', icon: Database },
        { path: '/settings/danger', label: 'Danger', icon: Skull },
    ];

    // Determine the current tab value based on the path
    // We match if the current pathname starts with the tab path
    // This handles sub-routes if any, defaulting to the exact match.
    // For simplicity given the flat structure:
    const currentTab = tabs.find(tab => location.pathname.startsWith(tab.path))?.path || tabs[0].path;

    return (
        <div className="container max-w-4xl py-6 lg:py-10 space-y-6">
            <div>
                <h3 className="text-lg font-medium">Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            <Separator />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <div className="flex-1 lg:max-w-full">
                    <Tabs
                        value={currentTab}
                        onValueChange={(value) => navigate(value)}
                        className="w-full space-y-6"
                    >
                        <div className="relative overflow-x-auto pb-2">
                            <TabsList>
                                {tabs.map((tab) => (
                                    <TabsTrigger
                                        key={tab.path}
                                        value={tab.path}
                                    >
                                        <div className="flex items-center gap-2">
                                            <tab.icon className="h-4 w-4" />
                                            <span>{tab.label}</span>
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                        <Outlet />
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

```

# src/features/settings/components/SettingsSync.tsx

```typescript
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { migrateLocalSettingsToDatabase, getFullSettings, updateUserSettings } from '@/db/repositories/settingsRepository';
import { toast } from 'sonner';

export const SettingsSync: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const settings = useSettingsStore(s => s.settings);
    const setSettingsLoading = useSettingsStore(s => s.setSettingsLoading);
    const setSettings = useSettingsStore(s => s.setSettings);

    useEffect(() => {
        const loadSettingsFromDb = async () => {
            if (authLoading) return;
            
            const userId = user?.id || 'local-user';

            setSettingsLoading(true);
            try {
                await migrateLocalSettingsToDatabase(userId);

                const dbSettings = await getFullSettings(userId);
                if (dbSettings) {
                    setSettings(prev => ({
                        ...prev,
                        ...dbSettings,
                        fsrs: { ...prev.fsrs, ...(dbSettings.fsrs || {}) },
                        tts: { ...prev.tts, ...(dbSettings.tts || {}) },
                        languageColors: { ...prev.languageColors, ...(dbSettings.languageColors || {}) },
                        dailyNewLimits: { ...prev.dailyNewLimits, ...(dbSettings.dailyNewLimits || {}) },
                        dailyReviewLimits: { ...prev.dailyReviewLimits, ...(dbSettings.dailyReviewLimits || {}) },
                    }));
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setSettingsLoading(false);
            }
        };

        loadSettingsFromDb();
    }, [user, authLoading, setSettings, setSettingsLoading]);

    useEffect(() => {
        const saveSettingsToDb = async () => {
            const userId = user?.id || 'local-user';

            try {
                await updateUserSettings(userId, settings);
            } catch (e) {
                console.error('Failed to save settings to DB', e);
            }
        };

        const timeoutId = setTimeout(saveSettingsToDb, 1000); return () => clearTimeout(timeoutId);
    }, [settings, user]);

    return null;
};

```

# src/features/settings/components/StudySettings.tsx

```typescript
import React from 'react';
import { Target, ListOrdered, ToggleLeft, Clock } from 'lucide-react';
import { UserSettings } from '@/types';
import { Input } from '@/components/ui/input';
import { LANGUAGE_NAMES } from '@/constants';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StudySettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const StudySettings: React.FC<StudySettingsProps> = ({ localSettings, setLocalSettings }) => {
  const currentLangName = LANGUAGE_NAMES[localSettings.language];
  const currentDailyNew = localSettings.dailyNewLimits?.[localSettings.language] ?? 0;
  const currentDailyReview = localSettings.dailyReviewLimits?.[localSettings.language] ?? 0;
  const [stepsInput, setStepsInput] = React.useState(localSettings.learningSteps?.join(' ') || '1 10');

  const handleStepsChange = (val: string) => {
    setStepsInput(val);
    const steps = val.split(/[\s,]+/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
    if (steps.length > 0) {
      setLocalSettings(prev => ({ ...prev, learningSteps: steps }));
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Info Banner */}
      <Card className="border-primary/20">
        <CardContent className="flex items-center gap-3 p-4">
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Daily study configuration for <span className="text-foreground font-medium">{currentLangName}</span>. Limits reset at 4:00 AM.
          </p>
        </CardContent>
      </Card>

      {/* Daily Limits Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          Daily Limits
        </h3>
        <p className="text-sm text-muted-foreground">Maximum cards per day</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="space-y-4 text-center p-6">
            <div className="flex items-center justify-center gap-2">
              <label className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-medium ">
                New Cards
              </label>
            </div>
            <Input
              type="number"
              value={currentDailyNew}
              className="text-5xl md:text-6xl font-light h-auto py-2 border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/60 tabular-nums bg-transparent transition-colors text-center shadow-none"
              onChange={(event) => {
                const val = parseInt(event.target.value, 10) || 0;
                setLocalSettings(prev => ({
                  ...prev,
                  dailyNewLimits: { ...prev.dailyNewLimits, [prev.language]: val }
                }));
              }}
            />
            <p className="text-xs text-muted-foreground/60 font-light">Unseen vocabulary</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 text-center p-6">
            <div className="flex items-center justify-center gap-2">
              <label className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-medium ">
                Review Cards
              </label>
            </div>
            <Input
              type="number"
              value={currentDailyReview}
              className="text-5xl md:text-6xl font-light h-auto py-2 border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/60 tabular-nums bg-transparent transition-colors text-center shadow-none"
              onChange={(event) => {
                const val = parseInt(event.target.value, 10) || 0;
                setLocalSettings(prev => ({
                  ...prev,
                  dailyReviewLimits: { ...prev.dailyReviewLimits, [prev.language]: val }
                }));
              }}
            />
            <p className="text-xs text-muted-foreground/60 font-light">Due for review</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Study Preferences Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <ToggleLeft className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          Study Preferences
        </h3>
        <p className="text-sm text-muted-foreground">Session behavior options</p>
      </div>
      <div className="space-y-3">
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.5} />
                <span className="text-sm font-medium text-foreground ">Learning Steps</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-6">Minutes between reviews (e.g. "1 10")</p>
            </div>
            <Input
              type="text"
              value={stepsInput}
              className="w-32 bg-transparent border-0 border-b border-border/30 text-sm  focus:outline-none focus:border-primary/60 transition-colors py-1 px-1 text-right text-foreground font-light shadow-none focus-visible:ring-0 rounded-none h-auto"
              onChange={(e) => handleStepsChange(e.target.value)}
              placeholder="1 10"
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ListOrdered className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.5} />
                <span className="text-sm font-medium text-foreground ">Card Order</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-6">Choose presentation priority</p>
            </div>
            <Select
              value={localSettings.cardOrder || 'newFirst'}
              onValueChange={(value) => setLocalSettings(prev => ({ ...prev, cardOrder: value as any }))}
            >
              <SelectTrigger className="w-[140px] border-0 border-b border-border/30 rounded-none shadow-none focus:ring-0 px-2 h-8">
                <SelectValue placeholder="Select order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newFirst">New First</SelectItem>
                <SelectItem value="reviewFirst">Review First</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground ">Binary Rating</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Simplified pass/fail grading reduces decision fatigue</p>
            </div>
            <Switch
              checked={localSettings.binaryRatingMode}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, binaryRatingMode: checked }))
              }
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground ">Full Sentence Front</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Show the full sentence on the front of the card instead of just the target word</p>
            </div>
            <Switch
              checked={localSettings.showWholeSentenceOnFront}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, showWholeSentenceOnFront: checked }))
              }
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground ">Skip Learning Wait</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Continue reviewing other due cards instead of waiting for learning steps to cool down</p>
            </div>
            <Switch
              checked={localSettings.ignoreLearningStepsWhenNoCards}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, ignoreLearningStepsWhenNoCards: checked }))
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


```

# src/features/settings/components/SyncthingSettings.tsx

```typescript
import React from 'react';
import { Save, Download, FolderSync, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SyncthingSettingsProps {
    onSave: () => void;
    onLoad: () => void;
    isSaving: boolean;
    isLoading: boolean;
    lastSync: string | null;
}

export const SyncthingSettings: React.FC<SyncthingSettingsProps> = ({
    onSave,
    onLoad,
    isSaving,
    isLoading,
    lastSync,
}) => {
    const formatLastSync = (timestamp: string | null) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <FolderSync className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    Syncthing Sync
                </h3>
                <p className="text-sm text-muted-foreground">Sync data between devices using a shared file</p>
            </div>

            {/* Last Sync Status */}
            <Card className="border-border/30">
                <CardContent className="flex items-center gap-3 p-4">
                    <Clock className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.5} />
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground/60 font-light">Last synced</p>
                        <p className="text-sm text-foreground">{formatLastSync(lastSync)}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Sync Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Save Changes Button */}
                <Button
                    variant="outline"
                    className={`h-auto flex flex-col items-center text-center space-y-3 py-6 hover:bg-muted/50 transition-colors ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={onSave}
                    disabled={isSaving}
                >
                    <div className="w-12 h-12 bg-card flex items-center justify-center rounded-full border border-border/30 group-hover:border-primary/40 transition-colors">
                        <Save className={`w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors ${isSaving ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </p>
                        <p className="text-xs text-muted-foreground/60 font-normal">
                            Write to sync file for Syncthing
                        </p>
                    </div>
                </Button>

                {/* Load from Sync File Button */}
                <Button
                    variant="outline"
                    className={`h-auto flex flex-col items-center text-center space-y-3 py-6 hover:bg-muted/50 transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={onLoad}
                    disabled={isLoading}
                >
                    <div className="w-12 h-12 bg-card flex items-center justify-center rounded-full border border-border/30 group-hover:border-primary/40 transition-colors">
                        <Download className={`w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                            {isLoading ? 'Loading...' : 'Load from File'}
                        </p>
                        <p className="text-xs text-muted-foreground/60 font-normal">
                            Import data from sync file
                        </p>
                    </div>
                </Button>
            </div>

            {/* Instructions */}
            <Card className="border-border/20">
                <CardContent className="flex items-start gap-3 p-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-2 shrink-0" />
                    <div className="text-xs text-muted-foreground/50 font-light leading-relaxed space-y-2">
                        <p><strong className="text-muted-foreground/70">How it works:</strong></p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Set up Syncthing to sync a folder between your devices</li>
                            <li>Click "Save Changes" to write your data to the sync file</li>
                            <li>Syncthing will automatically sync the file to other devices</li>
                            <li>On the other device, click "Load from File" to import</li>
                        </ol>
                        <p className="mt-2">
                            <strong className="text-muted-foreground/70">Note:</strong> On mobile, the file is saved to the Documents folder. Make sure Syncthing has access to it.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

```

# src/features/settings/hooks/useAccountManagement.ts

```typescript
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { db } from '@/db/dexie';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { LanguageId } from '@/types';
import {
    deleteCardsByLanguage,
    saveAllCards,
} from '@/db/repositories/cardRepository';
import { clearHistory } from '@/db/repositories/historyRepository';
import { POLISH_BEGINNER_DECK } from '@/assets/starter-decks/polish';
import { NORWEGIAN_BEGINNER_DECK } from '@/assets/starter-decks/norwegian';
import { JAPANESE_BEGINNER_DECK } from '@/assets/starter-decks/japanese';
import { SPANISH_BEGINNER_DECK } from '@/assets/starter-decks/spanish';

export const useAccountManagement = () => {
    const settings = useSettingsStore(s => s.settings);
    const queryClient = useQueryClient();
    const [confirmResetDeck, setConfirmResetDeck] = useState(false);
    const [confirmResetAccount, setConfirmResetAccount] = useState(false);

    const handleResetDeck = async () => {
        if (!confirmResetDeck) {
            setConfirmResetDeck(true);
            return;
        }
        try {
            await deleteCardsByLanguage(settings.language);

            await clearHistory(settings.language);

            const rawDeck =
                settings.language === LanguageId.Norwegian ? NORWEGIAN_BEGINNER_DECK :
                    (settings.language === LanguageId.Japanese ? JAPANESE_BEGINNER_DECK :
                        (settings.language === LanguageId.Spanish ? SPANISH_BEGINNER_DECK : POLISH_BEGINNER_DECK));
            const deck = rawDeck.map(c => ({ ...c, id: uuidv4(), dueDate: new Date().toISOString() }));
            await saveAllCards(deck);

            toast.success("Deck reset successfully");
            queryClient.clear();
            setTimeout(() => window.location.reload(), 500);
        } catch (e) {
            console.error(e);
            toast.error("Failed to reset deck");
        }
    };

    const handleResetAccount = async () => {
        if (!confirmResetAccount) {
            setConfirmResetAccount(true);
            return;
        }

        try {
            await db.cards.clear();
            await db.revlog.clear();
            await db.history.clear();
            await db.profile.clear();
            await db.settings.clear();
            await db.aggregated_stats.clear();

            toast.success("Account reset successfully. Restarting...");
            queryClient.clear();
            setTimeout(() => window.location.reload(), 1500);

        } catch (error: any) {
            console.error("Account reset failed", error);
            toast.error(`Reset failed: ${error.message}`);
        }
    };

    return {
        handleResetDeck,
        handleResetAccount,
        confirmResetDeck,
        setConfirmResetDeck,
        confirmResetAccount,
        setConfirmResetAccount
    };
};

```

# src/features/settings/hooks/useCloudSync.ts

```typescript
import { toast } from 'sonner';

export const useCloudSync = () => {
    const handleSyncToCloud = async () => {
        toast.info('This is a local-only app. Your data is stored on this device.');
    };

    return {
        handleSyncToCloud,
        isSyncingToCloud: false,
        syncComplete: false
    };
};

```

# src/features/settings/hooks/useSyncthingSync.ts

```typescript
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
    saveSyncFile,
    loadSyncFile,
    importSyncData,
    checkSyncFile,
    getLastSyncTime,
    setLastSyncTime,
    SyncData
} from '@/lib/sync/syncService';

export const useSyncthingSync = () => {
    const settings = useSettingsStore(s => s.settings);
    const updateSettings = useSettingsStore(s => s.updateSettings);
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(getLastSyncTime());

    const saveToSyncFile = useCallback(async () => {
        setIsSaving(true);
        try {
            const result = await saveSyncFile(settings);

            if (result.success) {
                const now = new Date().toISOString();
                setLastSyncTime(now);
                setLastSync(now);
                toast.success('Changes saved to sync file');
                return true;
            } else {
                toast.error(result.error || 'Failed to save sync file');
                return false;
            }
        } catch (error: any) {
            console.error('[Sync] Save error:', error);
            toast.error(`Save failed: ${error.message}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [settings]);

    const loadFromSyncFile = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await loadSyncFile();

            if (!result.success) {
                toast.error(result.error || 'Failed to load sync file');
                return false;
            }

            if (!result.data) {
                toast.error('No data found in sync file');
                return false;
            }

            const syncData = result.data;
            const confirmed = window.confirm(
                `Load data from sync file?\n\n` +
                `Last synced: ${new Date(syncData.lastSynced).toLocaleString()}\n` +
                `Device: ${syncData.deviceId?.slice(0, 8)}...\n` +
                `Cards: ${syncData.cards.length}\n\n` +
                `This will replace your current data. Continue?`
            );

            if (!confirmed) {
                return false;
            }

            const importResult = await importSyncData(syncData, updateSettings);

            if (importResult.success) {
                const now = new Date().toISOString();
                setLastSyncTime(now);
                setLastSync(now);
                toast.success(`Loaded ${syncData.cards.length} cards from sync file`);

                queryClient.invalidateQueries();

                setTimeout(() => window.location.reload(), 1000);
                return true;
            } else {
                toast.error(importResult.error || 'Failed to import sync data');
                return false;
            }
        } catch (error: any) {
            console.error('[Sync] Load error:', error);
            toast.error(`Load failed: ${error.message}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [updateSettings, queryClient]);

    const checkSyncStatus = useCallback(async () => {
        try {
            const result = await checkSyncFile();
            return result;
        } catch (error) {
            console.error('[Sync] Check error:', error);
            return { exists: false };
        }
    }, []);

    return {
        saveToSyncFile,
        loadFromSyncFile,
        checkSyncStatus,
        isSaving,
        isLoading,
        lastSync
    };
};

```

# src/features/settings/logic/optimizer.ts

```typescript
import { LinguaFlowDB } from '@/db/dexie';
import { State } from 'ts-fsrs';

export const exportRevlogToCSV = async (db: LinguaFlowDB): Promise<void> => {
    const revlogs = await db.revlog.toArray();

    const header = ['card_id', 'review_time', 'review_rating', 'review_state', 'review_duration'].join(',');

    const rows = revlogs.map(log => {


        const duration = 0;

        return [
            log.card_id,
            new Date(log.created_at).getTime(), log.grade,
            log.state,
            duration
        ].join(',');
    });

    const csvContent = [header, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `revlog_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

```

# src/features/settings/routes/SettingsRoute.tsx

```typescript

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDeckActions } from '@/contexts/DeckActionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { Card as CardModel, UserSettings, Language } from '@/types';
import { ttsService, VoiceOption } from '@/lib/tts';
import {
    saveAllCards,
    getCardSignatures,
    getCards,
    clearAllCards,
} from '@/db/repositories/cardRepository';
import { getHistory, saveFullHistory, clearHistory } from '@/db/repositories/historyRepository';
import { db } from '@/db/dexie';
import { parseCardsFromCsv, signatureForCard } from '@/features/generator/services/csvImport';
import { useCloudSync } from '@/features/settings/hooks/useCloudSync';
import { useAccountManagement } from '@/features/settings/hooks/useAccountManagement';
import { useSyncthingSync } from '@/features/settings/hooks/useSyncthingSync';

import { SettingsLayout } from '../components/SettingsLayout';
import { GeneralSettings } from '../components/GeneralSettings';
import { AudioSettings } from '../components/AudioSettings';
import { StudySettings } from '../components/StudySettings';
import { AlgorithmSettings } from '../components/AlgorithmSettings';
import { DataSettings } from '../components/DataSettings';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ChevronLeft, LogOut, Settings, User, Globe, Moon, Volume2, Mic, Target, Database, Github, Wand2, ToggleLeft, Activity, Trash2, Check, Skull, AlertCircle } from 'lucide-react';

const GeneralSettingsPage = () => {
    const { settings, setSettings, updateSettings, saveApiKeys } = useSettingsStore();
    const { profile, updateUsername, updateLanguageLevel } = useProfile();
    const { user } = useAuth();


    const handleSetUsername = async (newUsername: string) => {
        try {
            await updateUsername(newUsername);
            toast.success("Username updated");
        } catch (error) {
        }
    };



    useEffect(() => {
        const timeout = setTimeout(() => {
            if (settings.geminiApiKey || settings.tts.googleApiKey || settings.tts.azureApiKey) {
                saveApiKeys(user?.id || 'local-user', {
                    geminiApiKey: settings.geminiApiKey,
                    googleTtsApiKey: settings.tts.googleApiKey,
                    azureTtsApiKey: settings.tts.azureApiKey,
                    azureRegion: settings.tts.azureRegion,
                }).catch(console.error);
            }
        }, 2000);
        return () => clearTimeout(timeout);
    }, [settings.geminiApiKey, settings.tts.googleApiKey, settings.tts.azureApiKey, settings.tts.azureRegion, saveApiKeys, user?.id]);


    return (
        <GeneralSettings
            localSettings={settings}
            setLocalSettings={setSettings}
            username={profile?.username || ''}
            setUsername={handleSetUsername} languageLevel={profile?.language_level || 'A1'}
            onUpdateLevel={(l) => updateLanguageLevel(l).then(() => toast.success("Level updated"))}
        />
    );
};

const GeneralSettingsPageWithUsername = () => {
    const { settings, setSettings, saveApiKeys } = useSettingsStore();
    const { profile, updateUsername, updateLanguageLevel } = useProfile();
    const { user } = useAuth();
    const [localUsername, setLocalUsername] = useState(profile?.username || '');

    useEffect(() => {
        setLocalUsername(profile?.username || '');
    }, [profile?.username]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (user?.id) {
                saveApiKeys(user.id, {
                    geminiApiKey: settings.geminiApiKey,
                    googleTtsApiKey: settings.tts.googleApiKey,
                    azureTtsApiKey: settings.tts.azureApiKey,
                    azureRegion: settings.tts.azureRegion,
                });
            }
        }, 1000);
        return () => clearTimeout(timeout);
    }, [settings.geminiApiKey, settings.tts, saveApiKeys, user?.id]);

    const handleUsernameBlur = () => {
        if (localUsername !== profile?.username) {
            updateUsername(localUsername)
                .then(() => toast.success("Username updated"))
                .catch(() => setLocalUsername(profile?.username || ''));
        }
    };

    return (
        <GeneralSettings
            localSettings={settings}
            setLocalSettings={setSettings}
            username={localUsername}
            setUsername={setLocalUsername}
            languageLevel={profile?.language_level || 'A1'}
            onUpdateLevel={(l) => updateLanguageLevel(l).then(() => toast.success("Level updated"))}
        />
    );
};

const useDebouncedUsername = (localUsername: string, updateUsername: (name: string) => Promise<void>, currentUsername?: string) => {
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (localUsername && localUsername !== currentUsername) {
                updateUsername(localUsername).then(() => toast.success("Username updated", { id: 'username-update' }));
            }
        }, 1000);
        return () => clearTimeout(timeout);
    }, [localUsername, updateUsername, currentUsername]);
};


const GeneralSettingsFinal = () => {
    const { settings, setSettings } = useSettingsStore();
    const { profile, updateUsername, updateLanguageLevel } = useProfile();
    const [localUsername, setLocalUsername] = useState(profile?.username || '');

    useEffect(() => {
        if (profile?.username) setLocalUsername(profile.username);
    }, [profile?.username]);

    useDebouncedUsername(localUsername, async (name) => { await updateUsername(name); }, profile?.username);

    return (
        <GeneralSettings
            localSettings={settings}
            setLocalSettings={setSettings}
            username={localUsername}
            setUsername={setLocalUsername}
            languageLevel={profile?.language_level || 'A1'}
            onUpdateLevel={updateLanguageLevel}
        />
    );
};


const AudioSettingsPage = () => {
    const { settings, setSettings } = useSettingsStore();
    const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);

    useEffect(() => {
        const loadVoices = async () => {
            const voices = await ttsService.getAvailableVoices(settings.language, settings.tts);
            setAvailableVoices(voices);
        };
        loadVoices();
    }, [settings.language, settings.tts.provider, settings.tts.googleApiKey, settings.tts.azureApiKey]);

    const handleTestAudio = () => {
        const testText = {
            polish: "Cześć, to jest test.",
            norwegian: "Hei, dette er en test.",
            japanese: "こんにちは、テストです。",
            spanish: "Hola, esto es una prueba.",
            german: "Hallo, das ist ein Test."
        };
        ttsService.speak(testText[settings.language] || "Test audio", settings.language, settings.tts);
    };

    return (
        <AudioSettings
            localSettings={settings}
            setLocalSettings={setSettings}
            availableVoices={availableVoices}
            onTestAudio={handleTestAudio}
        />
    );
};

const StudySettingsPage = () => {
    const { settings, setSettings } = useSettingsStore();
    return <StudySettings localSettings={settings} setLocalSettings={setSettings} />;
};

const AlgorithmSettingsPage = () => {
    const { settings, setSettings } = useSettingsStore();
    return <AlgorithmSettings localSettings={settings} setLocalSettings={setSettings} />;
};

const DataSettingsPage = () => {
    const { settings, setSettings } = useSettingsStore();
    const { user } = useAuth();
    const { refreshDeckData } = useDeckActions();

    const csvInputRef = useRef<HTMLInputElement>(null);
    const jsonInputRef = useRef<HTMLInputElement>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [includeApiKeys, setIncludeApiKeys] = useState(false);
    const [importApiKeys, setImportApiKeys] = useState(false);

    const { handleSyncToCloud, isSyncingToCloud, syncComplete } = useCloudSync();
    const {
        saveToSyncFile,
        loadFromSyncFile,
        isSaving: isSyncthingSaving,
        isLoading: isSyncthingLoading,
        lastSync: lastSyncthingSync
    } = useSyncthingSync();

    const handleExport = async () => {
        try {
            const cards = await getCards();
            const history = await getHistory();
            const revlog = await db.revlog.toArray();

            const safeSettings = {
                ...settings,
                tts: {
                    ...settings.tts,
                    googleApiKey: includeApiKeys ? settings.tts.googleApiKey : '',
                    azureApiKey: includeApiKeys ? settings.tts.azureApiKey : ''
                },
                geminiApiKey: includeApiKeys ? settings.geminiApiKey : ''
            };

            const exportData = {
                version: 2,
                date: new Date().toISOString(),
                cards,
                history,
                revlog,
                settings: safeSettings
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup - ${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success("Export complete.");
        } catch (e) {
            toast.error("Export failed.");
        }
    };

    const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsRestoring(true);
        try {
            const text = await file.text();
            let data: any;

            try {
                data = JSON.parse(text);
            } catch {
                toast.error("Invalid backup file.");
                return;
            }

            if (!data.cards || !Array.isArray(data.cards)) {
                toast.error("Invalid backup: missing cards.");
                return;
            }

            if (!confirm(`Replace current data with backup from ${data.date}?\nCards: ${data.cards.length} `)) {
                return;
            }

            await clearAllCards();
            await clearHistory();
            await db.revlog.clear();
            await db.aggregated_stats.clear();

            if (data.cards.length > 0) await saveAllCards(data.cards);

            if (data.history && typeof data.history === 'object') {
                const languages = new Set(data.cards.map((c: any) => c.language).filter(Boolean));
                const primaryLanguage = languages.size > 0 ? Array.from(languages)[0] as Language : settings.language;
                await saveFullHistory(data.history, primaryLanguage);
            }

            if (data.revlog) await db.revlog.bulkPut(data.revlog);

            if (data.settings) {
                const restoredSettings: Partial<UserSettings> = {
                    ...data.settings,
                    geminiApiKey: importApiKeys && data.settings.geminiApiKey ? data.settings.geminiApiKey : settings.geminiApiKey,
                    tts: {
                        ...data.settings.tts,
                        googleApiKey: importApiKeys && data.settings.tts?.googleApiKey ? data.settings.tts.googleApiKey : settings.tts.googleApiKey,
                        azureApiKey: importApiKeys && data.settings.tts?.azureApiKey ? data.settings.tts.azureApiKey : settings.tts.azureApiKey,
                    } as UserSettings['tts'],
                };


                setSettings((prev) => ({
                    ...prev,
                    ...restoredSettings,
                    tts: { ...prev.tts, ...(restoredSettings.tts || {}) },
                    fsrs: { ...prev.fsrs, ...(restoredSettings.fsrs || {}) },
                }));
            }

            const { recalculateAllStats } = await import('@/db/repositories/aggregatedStatsRepository');
            await recalculateAllStats();

            refreshDeckData();
            toast.success(`Restored ${data.cards.length} cards.`);
        } catch (error) {
            console.error('Backup restore failed:', error);
            toast.error("Failed to restore backup.");
        } finally {
            setIsRestoring(false);
            event.target.value = '';
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const parsedCards = parseCardsFromCsv(text, settings.language);

            if (parsedCards.length === 0) {
                toast.error('No valid rows found.');
                return;
            }

            const existingSignatures = await getCardSignatures(settings.language);
            const seen = new Set(existingSignatures.map((card) => signatureForCard(card.target_sentence, settings.language)));

            const newCards = parsedCards.filter((card) => {
                const signature = signatureForCard(card.targetSentence, (card.language || settings.language) as Language);
                if (seen.has(signature)) return false;
                seen.add(signature);
                return true;
            });

            if (!newCards.length) {
                toast.info('All rows already exist.');
                return;
            }

            await saveAllCards(newCards);
            refreshDeckData();
            toast.success(`Imported ${newCards.length} cards.`);
        } catch (error) {
            console.error('CSV import failed', error);
            toast.error('Import failed.');
        } finally {
            event.target.value = '';
        }
    };

    return (
        <DataSettings
            onExport={handleExport}
            onImport={handleImport}
            csvInputRef={csvInputRef}
            onRestoreBackup={handleRestoreBackup}
            jsonInputRef={jsonInputRef}
            isRestoring={isRestoring}
            onSyncToCloud={handleSyncToCloud}
            isSyncingToCloud={isSyncingToCloud}
            syncComplete={syncComplete}
            onSyncthingSave={saveToSyncFile}
            onSyncthingLoad={loadFromSyncFile}
            isSyncthingSaving={isSyncthingSaving}
            isSyncthingLoading={isSyncthingLoading}
            lastSyncthingSync={lastSyncthingSync}
            includeApiKeys={includeApiKeys}
            onIncludeApiKeysChange={setIncludeApiKeys}
            importApiKeys={importApiKeys}
            onImportApiKeysChange={setImportApiKeys}
        />
    );
};

const DangerSettingsPage = () => {
    const { settings } = useSettingsStore();
    const { handleResetDeck, handleResetAccount, confirmResetDeck, confirmResetAccount } = useAccountManagement();

    return (
        <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <h2 className="text-lg font-medium text-foreground tracking-tight ">Danger Zone</h2>
                <span className="flex-1 h-px bg-linear-to-r from-destructive/30 via-border/30 to-transparent" />
            </div>

            <Card className="border-primary/30 hover:border-primary/50 transition-colors p-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-full">
                            <AlertCircle className="text-primary" size={18} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <h4 className="text-sm font-medium text-foreground  tracking-wide">Reset Current Deck</h4>
                            <p className="text-xs text-muted-foreground font-light leading-relaxed">
                                Delete all cards, history, and progress for <span className="text-foreground">{settings.language}</span>. Restores beginner course.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleResetDeck}
                        variant={confirmResetDeck ? 'default' : 'secondary'}
                        className={cn("w-full",
                            confirmResetDeck && "bg-primary hover:bg-orange-600"
                        )}
                    >
                        {confirmResetDeck ? "Confirm Reset" : "Reset Deck"}
                    </Button>
                </div>
            </Card>

            <Separator className="my-8" />

            <Card className="border-destructive/30 hover:border-destructive/50 transition-colors p-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                            <Trash2 className="w-5 h-5 text-destructive" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className=" font-medium text-foreground">Delete Account</h3>
                            <p className="text-xs text-muted-foreground/60 font-light max-w-[280px]">Permanently remove all data</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleResetAccount}
                        variant={confirmResetAccount ? 'destructive' : 'secondary'}
                        className={cn("w-full",
                            confirmResetAccount && "bg-destructive hover:bg-destructive/90"
                        )}
                    >
                        {confirmResetAccount ? "Confirm Complete Reset" : "Reset Everything"}
                    </Button>
                </div>
            </Card >
        </div >
    );
};

export const SettingsRoute: React.FC = () => {
    return (
        <Routes>
            <Route element={<SettingsLayout />}>
                <Route index element={<Navigate to="general" replace />} />
                <Route path="general" element={<GeneralSettingsFinal />} />
                <Route path="audio" element={<AudioSettingsPage />} />
                <Route path="study" element={<StudySettingsPage />} />
                <Route path="fsrs" element={<AlgorithmSettingsPage />} />
                <Route path="data" element={<DataSettingsPage />} />
                <Route path="danger" element={<DangerSettingsPage />} />
            </Route>
        </Routes>
    );
};

```

# src/features/study/components/AnalysisModal.tsx

```typescript
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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

```

# src/features/study/components/CramModal.tsx

```typescript
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { getTags } from "@/db/repositories/cardRepository";

interface CramModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CramModal = ({ isOpen, onClose }: CramModalProps) => {
    const settings = useSettingsStore(s => s.settings);
    const [selectedTag, setSelectedTag] = useState<string>("all");
    const [limit, setLimit] = useState([50]);
    const navigate = useNavigate();

    const { data: tags = [] } = useQuery({
        queryKey: ['tags', settings.language],
        queryFn: () => getTags(settings.language),
        enabled: isOpen,
    });

    const handleStart = () => {
        const params = new URLSearchParams();
        params.set("mode", "cram");
        if (selectedTag && selectedTag !== "all") params.set("tag", selectedTag);
        params.set("limit", limit[0].toString());
        navigate(`/study?${params.toString()}`);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-w-md p-0 gap-0 bg-background border border-border  overflow-hidden">
                <div className="p-6 space-y-6">
                    <div className="space-y-1">
                        <DialogTitle className="text-lg font-semibold tracking-tight">Cram Session</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Review cards without affecting your long-term statistics.
                        </DialogDescription>
                    </div>

                    <div className="space-y-6 py-2">
                        <div className="space-y-3">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filter by Tag</label>
                            <Select value={selectedTag} onValueChange={setSelectedTag}>
                                <SelectTrigger className="w-full h-10 px-3 bg-secondary/30 border-transparent hover:bg-secondary/50 transition-colors focus:ring-0 focus:ring-offset-0">
                                    <SelectValue placeholder="All Cards" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Cards</SelectItem>
                                    {tags.map((t: string) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Card Limit</label>
                                <span className="text-sm font-mono font-medium bg-secondary px-2 py-0.5 rounded text-foreground">
                                    {limit[0]} cards
                                </span>
                            </div>
                            <Slider
                                min={10} max={200} step={10}
                                value={limit}
                                onValueChange={setLimit}
                                className="py-2"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase">
                                <span>10</span>
                                <span>200</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-secondary/20 border-t border-border flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStart}
                        className="gap-2"
                    >
                        Start Session <ArrowRight size={14} />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

```

# src/features/study/components/Flashcard.tsx

```typescript
import React, { useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, Language, LanguageId } from '@/types';
import { escapeRegExp, parseFurigana, cn, findInflectedWordInSentence } from '@/lib/utils';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCardText } from '@/features/collection/hooks/useCardText';
import { Mic, Volume2 } from 'lucide-react';
import { FuriganaRenderer } from '@/components/ui/furigana-renderer';
import { useTextSelection } from '@/features/study/hooks/useTextSelection';
import { AnalysisModal } from '@/features/study/components/AnalysisModal';
import { SelectionMenu } from '@/features/study/components/SelectionMenu';
import { useFlashcardAudio } from '@/features/study/hooks/useFlashcardAudio';
import { useAIAnalysis } from '@/features/study/hooks/useAIAnalysis';
import { useCardInteraction } from '@/features/study/hooks/useCardInteraction';
import { Button } from '@/components/ui/button';

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  autoPlayAudio?: boolean;
  blindMode?: boolean;
  showTranslation?: boolean;
  language?: Language;
  onAddCard?: (card: Card) => void;
}

export const Flashcard = React.memo<FlashcardProps>(({
  card,
  isFlipped,
  autoPlayAudio = false,
  blindMode = false,
  showTranslation = true,
  language = LanguageId.Polish,
  onAddCard
}) => {
  const settings = useSettingsStore(s => s.settings);
  const { displayedTranslation, isGaslit, processText } = useCardText(card);
  const { selection, handleMouseUp, clearSelection } = useTextSelection();

  useEffect(() => {
    clearSelection();
  }, [card.id, clearSelection]);

  const { isRevealed, setIsRevealed, handleReveal, handleKeyDown } = useCardInteraction({
    cardId: card.id,
    blindMode,
    isFlipped
  });

  const { speak, playSlow } = useFlashcardAudio({
    card,
    language,
    settings,
    isFlipped,
    autoPlayAudio
  });

  const {
    isAnalyzing,
    analysisResult,
    isAnalysisOpen,
    setIsAnalysisOpen,
    isGeneratingCard,
    handleAnalyze,
    handleGenerateCard
  } = useAIAnalysis({
    card,
    language,
    apiKey: settings.geminiApiKey,
    selection,
    clearSelection,
    onAddCard
  });

  const displayedSentence = processText(card.targetSentence);

  const fontSizeClass = useMemo(() => {
    const len = displayedSentence.length;
    if (len < 6) return "text-5xl md:text-7xl font-normal tracking-tight";
    if (len < 15) return "text-4xl md:text-6xl font-normal tracking-tight";
    if (len < 30) return "text-3xl md:text-5xl font-light";
    if (len < 60) return "text-2xl md:text-4xl font-light";
    return "text-xl md:text-3xl font-light";
  }, [displayedSentence]);

  const RenderedSentence = useMemo(() => {
    const baseClasses = cn(
      "text-center text-balance select-text leading-[1.3] text-foreground font-light",
      fontSizeClass
    );

    if (!isRevealed) {
      return (
        <div
          onClick={handleReveal}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Reveal card content"
          className="cursor-pointer group flex flex-col items-center gap-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {blindMode && (
            <Button
              variant="outline"
              size="icon"
              className="h-20 w-20 rounded-xl"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); speak(); }}
            >
              <Mic size={28} strokeWidth={1} className="text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
          )}
          <p className={cn(baseClasses, "blur-3xl opacity-5 group-hover:opacity-10 transition-all duration-500")}>
            {(card.targetWord && !settings.showWholeSentenceOnFront) ? processText(card.targetWord) : displayedSentence}
          </p>
        </div>
      );
    }

    if (!isFlipped && card.targetWord && !settings.showWholeSentenceOnFront) {
      if (language === LanguageId.Japanese) {
        return (
          <FuriganaRenderer
            text={card.targetWord}
            className={baseClasses}
            processText={processText}
          />
        );
      }
      return <p className={baseClasses}>{processText(card.targetWord)}</p>;
    }

    const hasFuriganaInDedicatedField = card.furigana && /\[.+?\]/.test(card.furigana);
    const hasFuriganaInSentence = card.targetSentence && /\[.+?\]/.test(card.targetSentence);

    let furiganaSource: string | undefined;
    if (hasFuriganaInDedicatedField) {
      const furiganaPlainText = parseFurigana(card.furigana!).map(s => s.text).join('');
      const sentencePlainText = card.targetSentence || '';
      if (furiganaPlainText.length >= sentencePlainText.length * 0.5) {
        furiganaSource = card.furigana;
      }
    }
    if (!furiganaSource && hasFuriganaInSentence) {
      furiganaSource = card.targetSentence;
    }
    if (!furiganaSource) {
      furiganaSource = card.targetSentence;
    }

    if (language === LanguageId.Japanese && furiganaSource) {
      const segments = parseFurigana(furiganaSource);
      const hasFurigana = segments.some(s => s.furigana);

      if (hasFurigana) {
        const targetWordPlain = card.targetWord
          ? parseFurigana(card.targetWord).map(s => s.text).join('')
          : null;

        const segmentTexts = segments.map(s => s.text);
        const fullText = segmentTexts.join('');
        const targetIndices = new Set<number>();

        if (targetWordPlain) {
          let targetStart = fullText.indexOf(targetWordPlain);
          let matchedWordLength = targetWordPlain.length;

          if (targetStart === -1) {
            const matchedWord = findInflectedWordInSentence(targetWordPlain, fullText);
            if (matchedWord) {
              targetStart = fullText.indexOf(matchedWord);
              matchedWordLength = matchedWord.length;
            }
          }

          if (targetStart !== -1) {
            const targetEnd = targetStart + matchedWordLength;
            let charIndex = 0;
            for (let i = 0; i < segments.length; i++) {
              const segmentStart = charIndex;
              const segmentEnd = charIndex + segments[i].text.length;
              if (segmentStart < targetEnd && segmentEnd > targetStart) {
                targetIndices.add(i);
              }
              charIndex = segmentEnd;
            }
          }
        }

        return (
          <div className={cn(baseClasses, "leading-[1.6]")}>
            {segments.map((segment, i) => {
              const isTarget = targetIndices.has(i);
              if (segment.furigana) {
                return (
                  <ruby key={i} className="group/ruby" style={{ rubyAlign: 'center' }}>
                    <span className={isTarget ? "text-primary/90" : ""}>{processText(segment.text)}</span>
                    <rt className="text-[0.5em] text-muted-foreground/70 select-none opacity-0 group-hover/ruby:opacity-100 transition-opacity duration-500 font-sans font-light tracking-wide text-center" style={{ textAlign: 'center' }}>
                      {processText(segment.furigana)}
                    </rt>
                  </ruby>
                );
              }
              return <span key={i} className={isTarget ? "text-primary/90" : ""}>{processText(segment.text)}</span>;
            })}
          </div>
        );
      }
    }

    if (card.targetWord) {
      const targetWordPlain = parseFurigana(card.targetWord).map(s => s.text).join('');

      const matchedWord = findInflectedWordInSentence(targetWordPlain, displayedSentence);

      if (matchedWord) {
        const wordBoundaryRegex = new RegExp(`(\\b${escapeRegExp(matchedWord)}\\b)`, 'gi');
        const parts = displayedSentence.split(wordBoundaryRegex);
        return (
          <p className={baseClasses}>
            {parts.map((part, i) =>
              part.toLowerCase() === matchedWord.toLowerCase()
                ? <span key={i} className="text-primary/90 font-bold">{processText(part)}</span>
                : <span key={i}>{processText(part)}</span>
            )}
          </p>
        );
      }

      return <p className={baseClasses}>{displayedSentence}</p>;
    }

    return <p className={baseClasses}>{displayedSentence}</p>;
  }, [displayedSentence, card.targetWord, card.furigana, isRevealed, language, fontSizeClass, blindMode, speak, isFlipped, card.targetSentence, processText, settings.showWholeSentenceOnFront, handleReveal, handleKeyDown]);

  const containerClasses = cn(
    "relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full"
  );

  return (
    <>
      <div className={containerClasses} onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>


        {/* Main content */}
        <div className={cn(
          "w-full px-8 md:px-16 flex flex-col items-center z-10 transition-all duration-700 ease-out",
          isFlipped && "-translate-y-[80%]"
        )}>
          {RenderedSentence}

          {isRevealed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={speak}
              className="mt-6 text-muted-foreground/40 hover:text-primary/70"
            >
              <Volume2 size={24} strokeWidth={1.5} className={cn("transition-all duration-300", playSlow && "text-primary")} />
            </Button>
          )}
        </div>

        {/* Translation reveal */}
        {isFlipped && (
          <div className="absolute top-1/2 left-0 right-0 bottom-4 text-center flex flex-col items-center gap-3 z-0 pointer-events-none overflow-y-auto">



            {showTranslation && (
              <div className="relative group pointer-events-auto px-8 md:px-16 shrink-0 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {card.targetWord && (
                  <div className="flex flex-col items-center gap-0.5 mb-1">
                    <div className="flex items-center gap-2">
                      <FuriganaRenderer
                        text={card.targetWord}
                        className="text-xl md:text-2xl font-light text-primary/90"
                        processText={processText}
                      />
                    </div>
                    {card.targetWordTranslation && (
                      <span className="text-base text-muted-foreground/80 font-light italic">{card.targetWordTranslation}</span>
                    )}
                  </div>
                )}

                <div className="max-w-3xl">
                  <p className={cn(
                    "text-base md:text-xl text-foreground/70 font-light italic text-center leading-relaxed text-balance transition-colors duration-300",
                    isGaslit ? "text-destructive/70" : "group-hover:text-foreground/85"
                  )}>
                    {processText(displayedTranslation)}
                  </p>
                </div>
                {isGaslit && (
                  <Badge variant="destructive" className="absolute -top-6 -right-8 opacity-80">
                    Suspicious
                  </Badge>
                )}
              </div>
            )}

            {card.notes && (
              <div className="mt-2 pointer-events-auto shrink-0 px-6">
                <FuriganaRenderer
                  text={card.notes}
                  className="text-xs  font-light text-foreground text-center tracking-wide leading-relaxed block"
                  processText={processText}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {selection && (
        <SelectionMenu
          top={selection.top}
          left={selection.left}
          onAnalyze={handleAnalyze}
          onGenerateCard={onAddCard ? handleGenerateCard : undefined}
          isAnalyzing={isAnalyzing}
          isGeneratingCard={isGeneratingCard}
        />
      )}

      <AnalysisModal
        isOpen={isAnalysisOpen}
        onClose={setIsAnalysisOpen}
        result={analysisResult}
      />
    </>
  );
});

```

# src/features/study/components/SelectionMenu.tsx

```typescript
import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { ButtonLoader } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';

interface SelectionMenuProps {
    top: number;
    left: number;
    onAnalyze: () => void;
    onGenerateCard?: () => void;
    isAnalyzing: boolean;
    isGeneratingCard: boolean;
}

export const SelectionMenu: React.FC<SelectionMenuProps> = ({
    top,
    left,
    onAnalyze,
    onGenerateCard,
    isAnalyzing,
    isGeneratingCard
}) => {
    return (
        <div
            className="fixed z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-300 flex gap-1"
            style={{ top, left }}
            onMouseDown={(e) => e.preventDefault()}
        >
            <Button
                variant="outline"
                size="sm"
                onClick={onAnalyze}
                disabled={isAnalyzing || isGeneratingCard}
                className="bg-card shadow-sm gap-2"
            >
                {isAnalyzing ? <ButtonLoader /> : <Sparkles size={14} className="text-primary" />}
                <span>Analyze</span>
            </Button>

            {onGenerateCard && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onGenerateCard}
                    disabled={isAnalyzing || isGeneratingCard}
                    className="bg-card shadow-sm gap-2"
                >
                    {isGeneratingCard ? <ButtonLoader /> : <Plus size={14} className="text-primary" />}
                    <span>Create Card</span>
                </Button>
            )}
        </div>
    );
};

```

# src/features/study/components/StudyCardArea.tsx

```typescript
import React from 'react';
import { Card, Language } from '@/types';
import { Flashcard } from './Flashcard';
import { StudyFeedback } from './StudyFeedback';
import { XpFeedback } from '../hooks/useXpSession';


interface StudyCardAreaProps {
    feedback: XpFeedback | null;
    currentCard: Card;
    isFlipped: boolean;
    autoPlayAudio: boolean;
    blindMode: boolean;
    showTranslation: boolean;
    language: Language;
    onAddCard?: (card: Card) => void;
}

export const StudyCardArea: React.FC<StudyCardAreaProps> = React.memo(({
    feedback,
    currentCard,
    isFlipped,
    autoPlayAudio,
    blindMode,
    showTranslation,
    language,
    onAddCard,
}) => {
    return (
        <main className="flex-1 mx-2  relative flex flex-col items-center justify-center py-8 overflow-hidden">
            <StudyFeedback feedback={feedback} />

            <Flashcard
                card={currentCard}
                isFlipped={isFlipped}
                autoPlayAudio={autoPlayAudio}
                blindMode={blindMode}
                showTranslation={showTranslation}
                language={language}
                onAddCard={onAddCard}
            />
        </main>
    );
});

```

# src/features/study/components/StudyFeedback.tsx

```typescript
import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import clsx from 'clsx';
import { XpFeedback } from '../hooks/useXpSession';

export const StudyFeedback = React.memo(({ feedback }: { feedback: XpFeedback | null }) => {
  const [visible, setVisible] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<XpFeedback | null>(null);

  useEffect(() => {
    if (feedback) {
      setCurrentFeedback(feedback);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (!currentFeedback) return null;

  return (
    <div
      key={currentFeedback.id}
      className={clsx(
        "absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-500 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}
    >
      {/* Feedback panel */}
      <div className={clsx(
        "relative flex items-center gap-3 px-4 py-2 rounded-md border shadow-sm bg-background",
        currentFeedback.isBonus
          ? "border-primary/20 text-primary"
          : "border-border text-foreground"
      )}>
        <Zap size={14} className={currentFeedback.isBonus ? "fill-primary" : "fill-none"} />
        <span className="text-sm font-medium">
          {currentFeedback.message}
        </span>
      </div>
    </div>
  );
});


```

# src/features/study/components/StudyFooter.tsx

```typescript
import React from 'react';
import { Grade } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Eye } from 'lucide-react';

interface StudyFooterProps {
    isFlipped: boolean;
    setIsFlipped: (flipped: boolean) => void;
    isProcessing: boolean;
    binaryRatingMode: boolean;
    onGrade: (grade: Grade) => void;
    intervals?: Record<Grade, string>;
}

export const StudyFooter: React.FC<StudyFooterProps> = React.memo(({
    isFlipped,
    setIsFlipped,
    isProcessing,
    binaryRatingMode,
    onGrade,
    intervals,
}) => {
    return (
        <footer className="relative shrink-0 pb-[env(safe-area-inset-bottom)] bg-linear-to-t from-muted/30 to-background border-t border-border/30">
            <div className="min-h-20 md:min-h-24 h-auto w-full max-w-3xl mx-auto py-4 px-4 md:px-6 flex flex-col">
                {!isFlipped ? (
                    <Button
                        onClick={() => setIsFlipped(true)}
                        disabled={isProcessing}
                        variant="default"
                        className="w-full flex-1 text-base md:text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        <Eye size={18} className="mr-2" />
                        Show Answer
                        <kbd className="ml-3 px-2 py-0.5 text-[10px] font-medium bg-primary-foreground/20 rounded border border-primary-foreground/10 max-md:hidden">
                            SPACE
                        </kbd>
                    </Button>
                ) : (
                    binaryRatingMode ? (
                        <div className="grid grid-cols-2 w-full gap-3 flex-1">
                            <AnswerButton
                                label="Again"
                                shortcut="1"
                                grade="Again"
                                onClick={() => onGrade('Again')}
                                disabled={isProcessing}
                                interval={intervals?.Again}
                            />
                            <AnswerButton
                                label="Good"
                                shortcut="Space"
                                grade="Good"
                                onClick={() => onGrade('Good')}
                                disabled={isProcessing}
                                interval={intervals?.Good}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 w-full gap-2 md:gap-3 flex-1">
                            <AnswerButton
                                label="Again"
                                shortcut="1"
                                grade="Again"
                                onClick={() => onGrade('Again')}
                                disabled={isProcessing}
                                interval={intervals?.Again}
                            />
                            <AnswerButton
                                label="Hard"
                                shortcut="2"
                                grade="Hard"
                                onClick={() => onGrade('Hard')}
                                disabled={isProcessing}
                                interval={intervals?.Hard}
                            />
                            <AnswerButton
                                label="Good"
                                shortcut="3"
                                grade="Good"
                                onClick={() => onGrade('Good')}
                                disabled={isProcessing}
                                interval={intervals?.Good}
                            />
                            <AnswerButton
                                label="Easy"
                                shortcut="4"
                                grade="Easy"
                                onClick={() => onGrade('Easy')}
                                disabled={isProcessing}
                                interval={intervals?.Easy}
                            />
                        </div>
                    )
                )}
            </div>
        </footer>
    );
});

const gradeStyles: Record<Grade, { bg: string; hover: string; text: string }> = {
    Again: {
        bg: 'bg-red-500/10 border-red-800/20',
        hover: 'hover:bg-red-500/20 hover:border-red-500/30',
        text: 'text-red-700 dark:text-red-400',
    },
    Hard: {
        bg: 'bg-amber-500/10 border-amber-800/20',
        hover: 'hover:bg-amber-500/20 hover:border-amber-500/30',
        text: 'text-amber-700 dark:text-amber-400',
    },
    Good: {
        bg: 'bg-green-500/10 border-green-800/20',
        hover: 'hover:bg-green-500/20 hover:border-green-500/30',
        text: 'text-green-700 dark:text-green-400',
    },
    Easy: {
        bg: 'bg-emerald-500/10 border-emerald-800/20',
        hover: 'hover:bg-emerald-500/20 hover:border-emerald-500/30',
        text: 'text-emerald-700 dark:text-emerald-400',
    },
};

const AnswerButton = React.memo(({ label, shortcut, grade, className, onClick, disabled, interval }: {
    label: string;
    shortcut: string;
    grade: Grade;
    className?: string;
    onClick: () => void;
    disabled: boolean;
    interval?: string;
}) => {
    const style = gradeStyles[grade];

    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            variant="outline"
            className={cn(
                "h-full flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-all",
                "hover:scale-[1.02] active:scale-[0.98]",
                style.bg,
                style.hover,
                style.text,
                className
            )}
        >
            <span className="text-sm md:text-base font-bold">{label}</span>
            {interval && (
                <span className="text-[10px] md:text-xs font-medium opacity-60">
                    {interval}
                </span>
            )}
            <kbd className="text-[9px] font-medium opacity-40 bg-foreground/5 px-1.5 py-0.5 rounded mt-0.5 max-md:hidden">
                {shortcut}
            </kbd>
        </Button>
    );
});

```

# src/features/study/components/StudyHeader.tsx

```typescript
import React from 'react';
import { Zap, TrendingUp, Pencil, Trash2, Archive, Undo2, X, Bookmark, Sparkles, MoreVertical } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import clsx from 'clsx';
import { cn } from '@/lib/utils';

interface StudyHeaderProps {
    counts: { unseen: number; learning: number; lapse: number; mature: number };
    currentStatus: { label: string; className: string } | null;
    sessionXp: number;
    multiplierInfo: { value: number; label: string };
    isProcessing: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onArchive: () => void;
    onUndo: () => void;
    onExit: () => void;
    canUndo: boolean;
    isBookmarked?: boolean;
    onBookmark: (pressed: boolean) => void;
}

const QueueBadge = ({ label, count, color }: { label: string; count: number; color: 'blue' | 'amber' | 'red' | 'emerald' }) => {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    };

    const dotClasses = {
        blue: 'bg-blue-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500',
        emerald: 'bg-emerald-500',
    };

    return (
        <Badge variant="outline" className={cn("gap-1.5 px-2.5 py-1 border transition-all hover:scale-105", colorClasses[color])}>
            <span className={cn("size-1.5 rounded-full animate-pulse", dotClasses[color])} />
            <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider">{label}</span>
            <span className="text-xs font-bold tabular-nums">{count}</span>
        </Badge>
    );
};

const ActionButton = ({ icon: Icon, label, onClick, disabled, variant = 'ghost', className }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'ghost' | 'outline';
    className?: string;
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button variant={variant} size="icon" onClick={onClick} disabled={disabled} className={cn("size-8 rounded-lg", className)}>
                <Icon size={15} strokeWidth={1.5} />
            </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
            {label}
        </TooltipContent>
    </Tooltip>
);

export const StudyHeader: React.FC<StudyHeaderProps> = React.memo(({
    counts,
    currentStatus,
    sessionXp,
    multiplierInfo,
    isProcessing,
    onEdit,
    onDelete,
    onArchive,
    onUndo,
    onExit,
    canUndo,
    isBookmarked,
    onBookmark,
}) => {
    return (
        <TooltipProvider delayDuration={300}>
            <header className="relative h-14 md:h-16 px-3 md:px-5 flex justify-between items-center select-none shrink-0 pt-[env(safe-area-inset-top)] gap-3 bg-linear-to-b from-background to-background/80 backdrop-blur-sm border-b border-border/30">

                {/* Queue statistics */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <QueueBadge label="New" count={counts.unseen} color="blue" />
                    <QueueBadge label="Learn" count={counts.learning} color="amber" />
                    <QueueBadge label="Lapse" count={counts.lapse} color="red" />
                    <QueueBadge label="Review" count={counts.mature} color="emerald" />

                    {currentStatus && (
                        <>
                            <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                            <Badge variant="outline" className={cn("px-2.5 py-1 border transition-all animate-in fade-in zoom-in duration-300", currentStatus.className)}>
                                <span className="text-[10px] font-bold tracking-wider">{currentStatus.label}</span>
                            </Badge>
                        </>
                    )}
                </div>

                {/* XP display - centered */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 ">
                        <div className="relative">
                            <Zap size={14} strokeWidth={2.5} className="text-primary fill-primary/20" />
                        </div>
                        <span className="text-sm font-semibold tracking-wide tabular-nums text-foreground">
                            {sessionXp.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary/70">XP</span>

                        {multiplierInfo.value > 1.0 && (
                            <>
                                <Separator orientation="vertical" className="h-4 mx-1" />
                                <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                                    <span>×{multiplierInfo.value.toFixed(1)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-0.5">
                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-0.5">
                        <ActionButton
                            icon={Pencil}
                            label="Edit Card (E)"
                            onClick={onEdit}
                            disabled={isProcessing}
                        />
                        <ActionButton
                            icon={Trash2}
                            label="Delete Card"
                            onClick={onDelete}
                            disabled={isProcessing}
                            className="hover:text-destructive hover:bg-destructive/10"
                        />
                        <ActionButton
                            icon={Archive}
                            label="Mark as Known"
                            onClick={onArchive}
                            disabled={isProcessing}
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Toggle
                                    pressed={isBookmarked}
                                    onPressedChange={onBookmark}
                                    aria-label="Toggle bookmark"
                                    size="sm"
                                    className="size-8 rounded-lg data-[state=on]:bg-amber-500/15 hover:data-[state=on]:bg-amber-500/25 data-[state=on]:text-amber-600 dark:data-[state=on]:text-amber-400"
                                >
                                    <Bookmark size={15} strokeWidth={isBookmarked ? 2.5 : 1.5} className={clsx("transition-all", isBookmarked && "fill-current")} />
                                </Toggle>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                {isBookmarked ? 'Remove Bookmark' : 'Bookmark Card'}
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Mobile Dropdown */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                                    <MoreVertical size={15} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onEdit} disabled={isProcessing}>
                                    <Pencil className="mr-2 size-4" />
                                    <span>Edit Card</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onBookmark(!isBookmarked)} disabled={isProcessing}>
                                    <Bookmark className={cn("mr-2 size-4", isBookmarked && "fill-current")} />
                                    <span>{isBookmarked ? 'Remove Bookmark' : 'Bookmark Name'}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onArchive} disabled={isProcessing}>
                                    <Archive className="mr-2 size-4" />
                                    <span>Mark as Known</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onDelete} disabled={isProcessing} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 size-4" />
                                    <span>Delete Card</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {canUndo && (
                        <ActionButton
                            icon={Undo2}
                            label="Undo (Z)"
                            onClick={onUndo}
                            className="text-muted-foreground hover:text-foreground"
                        />
                    )}

                    <Separator orientation="vertical" className="h-5 mx-1.5" />

                    <ActionButton
                        icon={X}
                        label="Exit Session (Esc)"
                        onClick={onExit}
                        className="hover:bg-destructive/10 hover:text-destructive"
                    />
                </div>
            </header>
        </TooltipProvider>
    );
});



```

# src/features/study/components/StudySession.tsx

```typescript
import React, { useMemo, useCallback, useState } from 'react';
import { Card, Grade } from '@/types';
import { Progress } from '@/components/ui/progress';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useStudySession } from '../hooks/useStudySession';
import { useXpSession } from '../hooks/useXpSession';
import { CardXpPayload, CardRating } from '@/core/gamification/xp';
import { AddCardModal } from '@/features/collection/components/AddCardModal';
import { StudyHeader } from './StudyHeader';
import { StudyFooter } from './StudyFooter';
import { StudyCardArea } from './StudyCardArea';
import { StudySessionSummary } from './StudySessionSummary';
import { StudySessionWaiting } from './StudySessionWaiting';
import { useStudyShortcuts } from '../hooks/useStudyShortcuts';
import { useReviewIntervals } from '../hooks/useReviewIntervals';

const gradeToRatingMap: Record<Grade, CardRating> = {
  Again: 'again',
  Hard: 'hard',
  Good: 'good',
  Easy: 'easy',
};

const mapGradeToRating = (grade: Grade): CardRating => gradeToRatingMap[grade];

const getQueueCounts = (cards: Card[]) => {
  return cards.reduce(
    (acc, card) => {
      const state = card.state;
      if (state === 0 || (state === undefined && card.status === 'new')) acc.unseen++;
      else if (state === 1 || (state === undefined && card.status === 'learning')) acc.learning++;
      else if (state === 3) acc.lapse++;
      else acc.mature++;
      return acc;
    },
    { unseen: 0, learning: 0, lapse: 0, mature: 0 }
  );
};

interface StudySessionProps {
  dueCards: Card[];
  reserveCards?: Card[];
  onUpdateCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
  onRecordReview: (oldCard: Card, newCard: Card, grade: Grade, xpPayload?: CardXpPayload) => void;
  onExit: () => void;
  onComplete?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isCramMode?: boolean;
  dailyStreak: number;
  onAddCard?: (card: Card) => void;
}

export const StudySession: React.FC<StudySessionProps> = React.memo(({
  dueCards,
  reserveCards = [],
  onUpdateCard,
  onDeleteCard,
  onRecordReview,
  onExit,
  onComplete,
  onUndo,
  canUndo,
  isCramMode = false,
  dailyStreak,
  onAddCard,
}) => {
  const settings = useSettingsStore(s => s.settings);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { sessionXp, sessionStreak, multiplierInfo, feedback, processCardResult, subtractXp } = useXpSession(dailyStreak, isCramMode);

  const lastXpEarnedRef = React.useRef<number>(0);

  const enhancedRecordReview = useCallback((card: Card, updatedCard: Card, grade: Grade) => {
    const rating = mapGradeToRating(grade);
    const xpResult = processCardResult(rating);
    lastXpEarnedRef.current = xpResult.totalXp;
    const payload: CardXpPayload = {
      ...xpResult,
      rating,
      streakAfter: rating === 'again' ? 0 : sessionStreak + 1,
      isCramMode,
      dailyStreak,
      multiplierLabel: multiplierInfo.label
    };
    onRecordReview(card, updatedCard, grade, payload);
  }, [onRecordReview, processCardResult, sessionStreak, isCramMode, dailyStreak, multiplierInfo]);

  const handleUndoWithXp = useCallback(() => {
    if (onUndo && lastXpEarnedRef.current > 0) {
      subtractXp(lastXpEarnedRef.current);
      lastXpEarnedRef.current = 0;
    }
    onUndo?.();
  }, [onUndo, subtractXp]);

  const {
    sessionCards,
    currentCard,
    currentIndex,
    isFlipped,
    setIsFlipped,
    sessionComplete,
    handleGrade,
    handleMarkKnown,
    handleUndo,
    progress,
    isProcessing,
    isWaiting,
    removeCardFromSession,
    updateCardInSession,
  } = useStudySession({
    dueCards,
    reserveCards,
    settings,
    onUpdateCard,
    onRecordReview: enhancedRecordReview,
    canUndo,
    onUndo: handleUndoWithXp,
  });

  const handleBookmark = useCallback((pressed: boolean) => {
    if (!currentCard) return;
    const updatedCard = { ...currentCard, isBookmarked: pressed };
    onUpdateCard(updatedCard);
    updateCardInSession(updatedCard);
  }, [currentCard, onUpdateCard, updateCardInSession]);

  const handleDelete = useCallback(async () => {
    if (!currentCard) return;
    if (confirm('Are you sure you want to delete this card?')) {
      setIsDeleting(true);
      try {
        await onDeleteCard(currentCard.id);
        removeCardFromSession(currentCard.id);
      } catch (error) {
        console.error("Failed to delete card", error);
      } finally {
        setIsDeleting(false);
      }
    }
  }, [currentCard, removeCardFromSession, onDeleteCard]);

  const counts = useMemo(() => getQueueCounts(sessionCards.slice(currentIndex)), [sessionCards, currentIndex]);

  const currentStatus = useMemo(() => {
    if (!currentCard) return null;
    if (isCramMode) return { label: 'CRAM', className: 'text-chart-5 border-chart-5/20 bg-chart-5/10' };

    const s = currentCard.state;

    if (s === 0 || (s === undefined && currentCard.status === 'new')) {
      return { label: 'NEW', className: 'text-chart-1 border-chart-1/20 bg-chart-1/10' };
    }
    if (s === 1 || (s === undefined && currentCard.status === 'learning')) {
      return { label: 'LRN', className: 'text-chart-2 border-chart-2/20 bg-chart-2/10' };
    }
    if (s === 3) {
      return { label: 'LAPSE', className: 'text-destructive border-destructive/20 bg-destructive/10' };
    }
    return { label: 'REV', className: 'text-chart-3 border-chart-3/20 bg-chart-3/10' };
  }, [currentCard, isCramMode]);

  const intervals = useReviewIntervals(currentCard, settings);

  useStudyShortcuts({
    currentCardId: currentCard?.id,
    sessionComplete,
    isFlipped,
    setIsFlipped,
    isProcessing,
    handleGrade,
    handleUndo: handleUndo,
    onExit,
    canUndo: !!canUndo,
    settings,
  });

  if (isWaiting) {
    return <StudySessionWaiting onExit={onExit} />;
  }

  if (sessionComplete) {
    return (
      <StudySessionSummary
        cardsReviewed={currentIndex}
        sessionXp={sessionXp}
        sessionStreak={sessionStreak}
        onComplete={onComplete}
        onExit={onExit}
      />
    );
  }

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">

      <div className="relative h-2 w-full bg-card border-b border-primary/10 overflow-hidden">
        <Progress value={progress} className="h-full w-full rounded-none" />
      </div>

      <StudyHeader
        counts={counts}
        currentStatus={currentStatus}
        sessionXp={sessionXp}
        multiplierInfo={multiplierInfo}
        isProcessing={isProcessing || isDeleting}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={handleDelete}
        onArchive={handleMarkKnown}
        onUndo={handleUndo}
        onExit={onExit}
        canUndo={!!canUndo}
        isBookmarked={currentCard?.isBookmarked}
        onBookmark={handleBookmark}
      />

      <StudyCardArea
        feedback={feedback}
        currentCard={currentCard}
        isFlipped={isFlipped}
        autoPlayAudio={settings.autoPlayAudio || settings.blindMode}
        blindMode={settings.blindMode}
        showTranslation={settings.showTranslationAfterFlip}
        language={settings.language}
        onAddCard={onAddCard}
      />

      <StudyFooter
        isFlipped={isFlipped}
        setIsFlipped={setIsFlipped}
        isProcessing={isProcessing}
        binaryRatingMode={settings.binaryRatingMode}
        onGrade={handleGrade}
        intervals={intervals}
      />

      <AddCardModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onAdd={(updatedCard) => {
          onUpdateCard(updatedCard);
          setIsEditModalOpen(false);
        }}
        initialCard={currentCard}
      />
    </div>
  );
});


```

# src/features/study/components/StudySessionSummary.tsx

```typescript
import React from 'react';
import { Target, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface StudySessionSummaryProps {
    cardsReviewed: number;
    sessionXp: number;
    sessionStreak: number;
    onComplete?: () => void;
    onExit: () => void;
}

export const StudySessionSummary: React.FC<StudySessionSummaryProps> = ({
    cardsReviewed,
    sessionXp,
    sessionStreak,
    onComplete,
    onExit,
}) => {
    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-500 p-4">
            <div className="text-center space-y-8 max-w-lg w-full">
                <div className="space-y-4">
                    <h2 className="text-4xl font-light tracking-tight text-foreground">Session Complete</h2>
                    <p className="text-muted-foreground">Great job! Here is your summary.</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="flex flex-col items-center gap-2 p-6">
                            <Target size={20} className="text-muted-foreground" strokeWidth={1.5} />
                            <span className="text-3xl font-semibold tabular-nums">{cardsReviewed}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Cards</span>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex flex-col items-center gap-2 p-6">
                            <Zap size={20} className="text-primary" strokeWidth={1.5} />
                            <span className="text-3xl font-semibold text-primary tabular-nums">+{sessionXp}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">XP Earned</span>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex flex-col items-center gap-2 p-6">
                            <Sparkles size={20} className="text-muted-foreground" strokeWidth={1.5} />
                            <span className="text-3xl font-semibold tabular-nums">{sessionStreak}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Streak</span>
                        </CardContent>
                    </Card>
                </div>

                <Button
                    size="lg"
                    onClick={() => onComplete ? onComplete() : onExit()}
                    className="w-full sm:w-auto min-w-[200px]"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};

```

# src/features/study/components/StudySessionWaiting.tsx

```typescript
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

```

# src/features/study/hooks/useAIAnalysis.ts

```typescript
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '@/lib/ai';
import { getCardByTargetWord } from '@/db/repositories/cardRepository';
import { db } from '@/db/dexie';
import { parseFurigana } from '@/lib/utils';
import { Card, Language, LanguageId } from '@/types';

interface UseAIAnalysisProps {
    card: Card;
    language: Language;
    apiKey?: string;
    selection: { text: string } | null;
    clearSelection: () => void;
    onAddCard?: (card: Card) => void;
}

export function useAIAnalysis({
    card,
    language,
    apiKey,
    selection,
    clearSelection,
    onAddCard
}: UseAIAnalysisProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        originalText: string;
        definition: string;
        partOfSpeech: string;
        contextMeaning: string
    } | null>(null);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [isGeneratingCard, setIsGeneratingCard] = useState(false);

    useEffect(() => {
        setAnalysisResult(null);
        setIsAnalysisOpen(false);
    }, [card.id]);

    const handleAnalyze = async () => {
        if (!selection) return;
        if (!apiKey) {
            toast.error("API Key required.");
            clearSelection();
            return;
        }
        setIsAnalyzing(true);
        try {
            const result = await aiService.analyzeWord(selection.text, card.targetSentence, language, apiKey);
            setAnalysisResult({ ...result, originalText: selection.text });
            setIsAnalysisOpen(true);
            clearSelection();
        } catch (e) {
            toast.error("Analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateCard = async () => {
        if (!selection) return;
        if (!apiKey) {
            toast.error("API Key required.");
            clearSelection();
            return;
        }
        if (!onAddCard) {
            toast.error("Cannot add card from here.");
            clearSelection();
            return;
        }
        setIsGeneratingCard(true);
        try {
            const lemma = await aiService.lemmatizeWord(selection.text, language, apiKey);

            const existingCard = await getCardByTargetWord(lemma, language);
            if (existingCard) {
                const isPrioritizable = existingCard.status === 'new';
                toast.error(`Card already exists for "${lemma}"`, {
                    action: isPrioritizable ? {
                        label: 'Prioritize',
                        onClick: async () => {
                            try {
                                await db.cards.where('id').equals(existingCard.id).modify({ dueDate: new Date(0).toISOString() });
                                toast.success(`"${lemma}" moved to top of queue`);
                            } catch (e) {
                                toast.error('Failed to prioritize card');
                            }
                        }
                    } : undefined,
                    duration: 5000
                });
                clearSelection();
                setIsGeneratingCard(false);
                return;
            }

            const result = await aiService.generateSentenceForWord(lemma, language, apiKey);

            let targetSentence = result.targetSentence;
            if (language === LanguageId.Japanese && result.furigana) {
                targetSentence = parseFurigana(result.furigana).map(s => s.text).join("");
            }

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(4, 0, 0, 1);
            const newCard: Card = {
                id: uuidv4(),
                targetSentence,
                targetWord: lemma,
                targetWordTranslation: result.targetWordTranslation,
                targetWordPartOfSpeech: result.targetWordPartOfSpeech,
                nativeTranslation: result.nativeTranslation,
                notes: result.notes,
                furigana: result.furigana,
                language,
                status: 'new',
                interval: 0,
                easeFactor: 2.5,
                dueDate: tomorrow.toISOString(),
                reps: 0,
                lapses: 0,
                tags: ['AI-Gen', 'From-Study']
            };

            onAddCard(newCard);
            toast.success(`Card created for "${lemma}" — scheduled for tomorrow`);
            clearSelection();
        } catch (e) {
            toast.error("Failed to generate card.");
        } finally {
            setIsGeneratingCard(false);
        }
    };

    return {
        isAnalyzing,
        analysisResult,
        isAnalysisOpen,
        setIsAnalysisOpen,
        isGeneratingCard,
        handleAnalyze,
        handleGenerateCard
    };
}

```

# src/features/study/hooks/useCardInteraction.ts

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseCardInteractionProps {
    cardId: string;
    blindMode: boolean;
    isFlipped: boolean;
}

export function useCardInteraction({
    cardId,
    blindMode,
    isFlipped
}: UseCardInteractionProps) {
    const [isRevealed, setIsRevealed] = useState(!blindMode);

    useEffect(() => {
        setIsRevealed(!blindMode);
    }, [cardId, blindMode]);

    useEffect(() => {
        if (isFlipped) setIsRevealed(true);
    }, [isFlipped]);

    const handleReveal = useCallback(() => {
        setIsRevealed(true);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsRevealed(true);
        }
    }, []);

    return {
        isRevealed,
        setIsRevealed,
        handleReveal,
        handleKeyDown
    };
}

```

# src/features/study/hooks/useFlashcardAudio.ts

```typescript
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ttsService } from '@/lib/tts';
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
        const effectiveRate = playSlowRef.current ? Math.max(0.25, settings.tts.rate * 0.6) : settings.tts.rate;
        const effectiveSettings = { ...settings.tts, rate: effectiveRate };
        const plainText = getPlainTextForTTS(card.targetSentence);

        ttsService.speak(plainText, language, effectiveSettings).catch(err => {
            console.error('TTS speak error:', err);
        });
        setPlaySlow(prev => !prev);
    }, [card.targetSentence, language, settings.tts, getPlainTextForTTS]);

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

```

# src/features/study/hooks/useReviewIntervals.ts

```typescript
import { useMemo } from 'react';
import { Card, UserSettings, Grade } from '@/types';
import { calculateNextReview } from '@/core/srs/scheduler';
import { formatInterval } from '@/utils/formatInterval';
import { parseISO, differenceInMilliseconds } from 'date-fns';

export const useReviewIntervals = (
    card: Card | undefined,
    settings: UserSettings
): Record<Grade, string> => {
    return useMemo(() => {
        if (!card) {
            return { Again: '', Hard: '', Good: '', Easy: '' };
        }

        const now = new Date();
        const calculate = (grade: Grade) => {
            try {
                const next = calculateNextReview(card, grade, settings.fsrs, settings.learningSteps);
                const due = parseISO(next.dueDate);
                if (isNaN(due.getTime())) {
                    console.warn('[useReviewIntervals] Invalid dueDate from calculateNextReview:', next.dueDate);
                    return '<1m';
                }
                const diff = differenceInMilliseconds(due, now);
                return formatInterval(Math.max(0, diff));
            } catch (error) {
                console.error('[useReviewIntervals] Error calculating interval:', error);
                return '<1m';
            }
        };

        return {
            Again: calculate('Again'),
            Hard: calculate('Hard'),
            Good: calculate('Good'),
            Easy: calculate('Easy'),
        };
    }, [card, settings.fsrs, settings.learningSteps]);
};

```

# src/features/study/hooks/useStudySession.ts

```typescript
import { useCallback, useEffect, useReducer, useMemo } from 'react';
import { Card, Grade, UserSettings } from '@/types';
import { calculateNextReview, isCardDue } from '@/core/srs/scheduler';
import { isNewCard } from '@/services/studyLimits';
import { sortCards } from "@/core/srs/cardSorter";

interface UseStudySessionParams {
  dueCards: Card[];
  reserveCards?: Card[];
  settings: UserSettings;
  onUpdateCard: (card: Card) => void;
  onRecordReview: (card: Card, updatedCard: Card, grade: Grade) => void;
  canUndo?: boolean;
  onUndo?: () => void;
}

type SessionStatus = 'IDLE' | 'WAITING' | 'FLIPPED' | 'PROCESSING' | 'COMPLETE';

interface SessionState {
  status: SessionStatus;
  cards: Card[];
  reserveCards: Card[];
  currentIndex: number;
  history: { addedCardId: string | null }[];
  tick: number;
}

type Action =
  | { type: 'INIT'; cards: Card[]; reserve: Card[] }
  | { type: 'FLIP' }
  | { type: 'START_PROCESSING' }
  | { type: 'GRADE_SUCCESS'; status?: SessionStatus; updatedCard?: Card | null; addedCardId?: string | null; isLast?: boolean }
  | { type: 'GRADE_FAILURE' }
  | { type: 'UNDO'; }
  | { type: 'TICK' }
  | { type: 'REMOVE_CARD'; cardId: string; newCardFromReserve?: Card | null }
  | { type: 'CHECK_WAITING'; now: Date; ignoreLearningSteps: boolean }
  | { type: 'UPDATE_CARD'; card: Card };

const getInitialStatus = (cards: Card[]): SessionStatus => {
  return cards.length > 0 ? 'IDLE' : 'COMPLETE';
};

const reducer = (state: SessionState, action: Action): SessionState => {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        cards: action.cards,
        reserveCards: action.reserve,
        currentIndex: 0,
        status: getInitialStatus(action.cards),
        history: [],
      };

    case 'FLIP':
      if (state.status !== 'IDLE') return state;
      return { ...state, status: 'FLIPPED' };

    case 'START_PROCESSING':
      if (state.status !== 'FLIPPED' && state.status !== 'IDLE') return state;
      return { ...state, status: 'PROCESSING' };

    case 'GRADE_SUCCESS': {
      const { updatedCard, addedCardId, isLast } = action;
      let newCards = [...state.cards];
      let newIndex = state.currentIndex;
      let newHistory = [...state.history, { addedCardId: addedCardId ?? null }];

      if (updatedCard) {
        if (updatedCard.status === 'learning') {
          if (isLast) {
            newCards[state.currentIndex] = updatedCard;
            return {
              ...state,
              cards: newCards,
              status: 'IDLE',
              history: newHistory
            };
          } else {
            newCards.push(updatedCard);
          }
        }
      } else if (addedCardId) {
      }

      if (newIndex < newCards.length - 1) {
        return {
          ...state,
          cards: newCards,
          currentIndex: newIndex + 1,
          status: 'IDLE',
          history: newHistory
        };
      } else {
        return {
          ...state,
          cards: newCards,
          currentIndex: newIndex,
          status: 'COMPLETE',
          history: newHistory
        };
      }
    }

    case 'GRADE_FAILURE':
      return { ...state, status: state.history.length > 0 ? 'FLIPPED' : 'IDLE' };

    case 'UNDO':
      if (state.status === 'PROCESSING') return state;
      if (state.history.length === 0 && state.currentIndex === 0 && !state.status.match(/COMPLETE/)) return state;

      const history = state.history;
      const lastAction = history[history.length - 1];
      const newHistory = history.slice(0, -1);

      let undoCards = [...state.cards];
      if (lastAction?.addedCardId) {
        const lastCard = undoCards[undoCards.length - 1];
        if (lastCard && lastCard.id === lastAction.addedCardId) {
          undoCards.pop();
        }
      }

      const prevIndex = Math.max(0, state.currentIndex - 1);

      return {
        ...state,
        cards: undoCards,
        currentIndex: prevIndex,
        status: 'FLIPPED',
        history: newHistory,
      };

    case 'CHECK_WAITING': {
      if (state.status === 'PROCESSING' || state.status === 'FLIPPED') return state;

      const current = state.cards[state.currentIndex];
      if (!current) {
        if (state.cards.length === 0) return { ...state, status: 'COMPLETE' };
        return state;
      }

      if (isCardDue(current, action.now)) {
        return { ...state, status: 'IDLE' };
      }

      const nextDueIndex = state.cards.findIndex((c, i) => i > state.currentIndex && isCardDue(c, action.now));
      if (nextDueIndex !== -1) {
        const newCards = [...state.cards];
        const [card] = newCards.splice(nextDueIndex, 1);
        newCards.splice(state.currentIndex, 0, card);
        return { ...state, cards: newCards, status: 'IDLE' };
      }

      if (action.ignoreLearningSteps) {
        return { ...state, status: 'IDLE' };
      }

      return { ...state, status: 'WAITING' };
    }

    case 'TICK':
      return { ...state, tick: state.tick + 1 };

    case 'REMOVE_CARD': {
      const { cardId, newCardFromReserve } = action;
      const index = state.cards.findIndex(c => c.id === cardId);
      if (index === -1) return state;

      let newCards = state.cards.filter(c => c.id !== cardId);
      let newReserve = [...state.reserveCards];

      if (newCardFromReserve) {
        newCards.push(newCardFromReserve);
        newReserve = newReserve.filter(c => c.id !== newCardFromReserve.id);
      }

      let newStatus = state.status;
      let newIndex = state.currentIndex;

      if (index < newIndex) {
        newIndex = Math.max(0, newIndex - 1);
      } else if (index === newIndex) {
        newStatus = 'IDLE';
        if (newIndex >= newCards.length) {
          newIndex = Math.max(0, newCards.length - 1);
        }
      }

      if (newCards.length === 0) newStatus = 'COMPLETE';

      return {
        ...state,
        cards: newCards,
        reserveCards: newReserve,
        currentIndex: newIndex,
        status: newStatus,
      };
    }

    case 'UPDATE_CARD': {
      const { card } = action;
      const newCards = state.cards.map(c => c.id === card.id ? card : c);
      return { ...state, cards: newCards };
    }

    default:
      return state;
  }
};

export const useStudySession = ({
  dueCards,
  reserveCards: initialReserve = [],
  settings,
  onUpdateCard,
  onRecordReview,
  canUndo,
  onUndo,
}: UseStudySessionParams) => {
  const [state, dispatch] = useReducer(reducer, {
    status: 'COMPLETE',
    cards: dueCards,
    reserveCards: initialReserve,
    currentIndex: 0,
    history: [],
    tick: 0,
  }, (initial) => ({
    ...initial,
    status: getInitialStatus(initial.cards)
  }));

  useEffect(() => {
    if (dueCards.length > 0) {
      const order = settings.cardOrder || 'newFirst';
      const sortedCards = sortCards(dueCards, order);

      dispatch({ type: 'INIT', cards: sortedCards, reserve: initialReserve });
    }
  }, [dueCards, initialReserve, settings.cardOrder]);

  useEffect(() => {
    if (state.status === 'IDLE' || state.status === 'WAITING') {
      const now = new Date();
      dispatch({ type: 'CHECK_WAITING', now, ignoreLearningSteps: !!settings.ignoreLearningStepsWhenNoCards });
    }

    if (state.status === 'WAITING') {
      const timer = setTimeout(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.status, state.currentIndex, state.cards, settings.ignoreLearningStepsWhenNoCards, state.tick]);

  const currentCard = state.cards[state.currentIndex];

  const handleGrade = useCallback(async (grade: Grade) => {
    if (state.status !== 'FLIPPED') return;

    dispatch({ type: 'START_PROCESSING' });

    try {
      const updatedCard = calculateNextReview(currentCard, grade, settings.fsrs, settings.learningSteps);
      await onRecordReview(currentCard, updatedCard, grade);

      const isLast = state.currentIndex === state.cards.length - 1;
      const addedCardId = updatedCard.status === 'learning' && !isLast ? updatedCard.id : null;

      dispatch({ type: 'GRADE_SUCCESS', updatedCard, addedCardId, isLast });
    } catch (e) {
      console.error("Grade failed", e);
      dispatch({ type: 'GRADE_FAILURE' });
    }
  }, [state.status, state.currentIndex, state.cards, currentCard, settings.fsrs, onRecordReview]);

  const handleMarkKnown = useCallback(async () => {
    if (state.status === 'PROCESSING') return;

    dispatch({ type: 'START_PROCESSING' });

    try {
      const wasNew = isNewCard(currentCard);
      const updatedCard: Card = { ...currentCard, status: 'known' };

      await onUpdateCard(updatedCard);

      let addedCardId: string | null = null;
      let newCardFromReserve: Card | null = null;

      if (wasNew && state.reserveCards.length > 0) {
        newCardFromReserve = state.reserveCards[0];
      }




      if (newCardFromReserve) {
        addedCardId = newCardFromReserve.id;
      }





      dispatch({ type: 'REMOVE_CARD', cardId: currentCard.id, newCardFromReserve });



    } catch (e) {
      console.error("Mark Known failed", e);
      dispatch({ type: 'GRADE_FAILURE' });
    }

  }, [state.status, currentCard, state.reserveCards, onUpdateCard]);


  const handleUndo = useCallback(() => {
    if (state.status === 'PROCESSING' || !canUndo || !onUndo) return;
    onUndo();
    dispatch({ type: 'UNDO' });
  }, [state.status, canUndo, onUndo]);

  const removeCardFromSession = useCallback((cardId: string) => {
    const card = state.cards.find(c => c.id === cardId);
    let newCardFromReserve: Card | null = null;
    if (card && isNewCard(card) && state.reserveCards.length > 0) {
      newCardFromReserve = state.reserveCards[0];
    }
    dispatch({ type: 'REMOVE_CARD', cardId, newCardFromReserve });
  }, [state.cards, state.reserveCards]);

  const updateCardInSession = useCallback((card: Card) => {
    dispatch({ type: 'UPDATE_CARD', card });
  }, []);

  const setIsFlipped = (flipped: boolean) => {
    if (flipped) dispatch({ type: 'FLIP' });
  };

  const isCurrentCardDue = useMemo(() => {
    if (!currentCard) return false;
    return isCardDue(currentCard, new Date());
  }, [currentCard]);

  return {
    sessionCards: state.cards,
    currentCard,
    currentIndex: state.currentIndex,
    isFlipped: state.status === 'FLIPPED',
    sessionComplete: state.status === 'COMPLETE',
    isProcessing: state.status === 'PROCESSING',
    isWaiting: state.status === 'WAITING',
    handleGrade,
    handleMarkKnown,
    handleUndo,
    progress: state.cards.length ? (state.currentIndex / state.cards.length) * 100 : 0,
    removeCardFromSession,
    updateCardInSession,
    setIsFlipped
  };
};

```

# src/features/study/hooks/useStudyShortcuts.ts

```typescript
import { useEffect } from 'react';
import { Grade, UserSettings } from '@/types';

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
    settings: UserSettings;
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
    settings,
}: UseStudyShortcutsProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!currentCardId && !sessionComplete) return;

            if (!isFlipped && !sessionComplete && (e.code === 'Space' || e.code === 'Enter')) {
                e.preventDefault();
                setIsFlipped(true);
            }
            else if (isFlipped && !sessionComplete && !isProcessing) {
                if (settings.binaryRatingMode) {
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
        settings.binaryRatingMode,
    ]);
};

```

# src/features/study/hooks/useTextSelection.ts

```typescript
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

```

# src/features/study/hooks/useXpSession.ts

```typescript
import { useState, useCallback } from 'react';
import { CardRating, calculateCardXp, XpCalculationResult, getDailyStreakMultiplier } from '@/core/gamification/xp';

export interface XpFeedback {
  id: number;
  message: string;
  isBonus: boolean;
  amount: number;
}

export const useXpSession = (dailyStreak: number, isCramMode: boolean) => {
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [feedback, setFeedback] = useState<XpFeedback | null>(null);

  const multiplierInfo = getDailyStreakMultiplier(dailyStreak);

  const processCardResult = useCallback((rating: CardRating): XpCalculationResult => {
    // Calculate what the XP would be
    const result = calculateCardXp(rating, sessionStreak, dailyStreak, isCramMode);
    
    // Update state
    setSessionXp(prev => prev + result.totalXp);
    
    if (rating === 'again') {
        setSessionStreak(0);
    } else {
        setSessionStreak(prev => prev + 1);
    }

    // Generate feedback if applicable (e.g. > 0 xp)
    if (result.totalXp > 0) {
        setFeedback({
            id: Date.now(),
            message: `+${result.totalXp} XP`,
            isBonus: result.multiplier > 1,
            amount: result.totalXp
        });
    }

    return result;
  }, [sessionStreak, dailyStreak, isCramMode]);

  const subtractXp = useCallback((amount: number) => {
    setSessionXp(prev => Math.max(0, prev - amount));
    // We might also want to revert streak? But it's complex to know previous streak. 
    // Usually undo just reverts the last action.
    // For now, let's just revert XP.
    // Ideally the consumer handles streak reversion if they have state, 
    // but here we just expose what was asked.
  }, []);

  return {
    sessionXp,
    sessionStreak,
    multiplierInfo,
    feedback,
    processCardResult,
    subtractXp
  };
};

```

# src/hooks/use-mobile.ts

```typescript
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}


```

# src/hooks/useChartColors.ts

```typescript
import { useMemo } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/contexts/ThemeContext';

const getCssVarValue = (name: string) => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

const normalizeColor = (value: string, fallback: string) => {
  if (!value) return fallback;
  const candidate = value.trim();
  if (!candidate) return fallback;

  if (/^(#|rgb|hsl|oklch|var)/i.test(candidate)) return candidate;

  if (candidate.includes(' ')) return `hsl(${candidate})`;
  return candidate;
};

export const useChartColors = () => {
  const { theme } = useTheme();
  const settings = useSettingsStore(s => s.settings);

  return useMemo(() => {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

    return {
      primary: normalizeColor(getCssVarValue('--primary'), '#3b82f6'),
      background: normalizeColor(getCssVarValue('--background'), '#ffffff'),
      foreground: normalizeColor(getCssVarValue('--foreground'), '#000000'),
      muted: normalizeColor(getCssVarValue('--muted'), '#e5e7eb'),
      mutedForeground: normalizeColor(getCssVarValue('--muted-foreground'), '#6b7280'),
      border: normalizeColor(getCssVarValue('--border'), '#d1d5db'),
      isDark: theme === 'dark' || (theme === 'system' && prefersDark),
    };
  }, [theme, settings.language, settings.languageColors]);
};

```

# src/hooks/usePlatformSetup.ts

```typescript
import { useEffect } from 'react';

export const usePlatformSetup = () => {
    useEffect(() => {
        // Web-only platform setup
    }, []);
};

```

# src/lib/ai/gemini.ts

```typescript
import { LanguageId } from '@/types';
import { parseAIJSON } from '../../utils/jsonParser';

interface GeminiRequestBody {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    responseMimeType?: string;
    responseSchema?: GeminiResponseSchema;
    temperature?: number;
  };
}

interface GeminiSchemaProperty {
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'OBJECT' | 'ARRAY';
  enum?: string[];
  description?: string;
}

interface GeminiResponseSchema {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'NUMBER' | 'BOOLEAN';
  properties?: Record<string, GeminiSchemaProperty>;
  items?: GeminiResponseSchema;
  required?: string[];
}

interface GeneratedCardData {
  targetSentence: string;
  nativeTranslation: string;
  targetWord: string;
  targetWordTranslation: string;
  targetWordPartOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun';
  grammaticalCase?: string;
  gender?: string;
  notes: string;
  furigana?: string;
}

export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection';

interface BatchGenerationOptions {
  instructions: string;
  count: number;
  language: typeof LanguageId[keyof typeof LanguageId];
  learnedWords?: string[];
  proficiencyLevel?: string;
  difficultyMode?: 'beginner' | 'immersive';
  wordTypeFilters?: WordType[];
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

async function callGemini(prompt: string, apiKey: string, responseSchema?: GeminiResponseSchema, retries = 3): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please add it in Settings.');
  }

  const body: GeminiRequestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  if (responseSchema) {
    body.generationConfig = {
      responseMimeType: 'application/json',
      responseSchema
    };
  }

  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
           const text = await response.text(); // Get text for error detail
           throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${text}`);
        }
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini API Error:", errorData);
        throw new Error(errorData.error?.message || 'AI Service failed. Check your API key.');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No response from AI');
      }
      return text;

    } catch (e: any) {
      console.warn(`Gemini attempt ${i + 1} failed:`, e);
      lastError = e;
      if (i < retries - 1) {
        // Exponential backoff: 1s, 2s, 4s...
        const waitTime = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error("Failed to call Gemini after multiple attempts");
}

export const aiService = {
  async lemmatizeWord(word: string, language: typeof LanguageId[keyof typeof LanguageId] = LanguageId.Polish, apiKey: string): Promise<string> {
    const langName = language === LanguageId.Norwegian ? 'Norwegian' : (language === LanguageId.Japanese ? 'Japanese' : (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));

    const responseSchema: GeminiResponseSchema = {
      type: 'OBJECT',
      properties: {
        lemma: { type: 'STRING' }
      },
      required: ['lemma']
    };

    const prompt = `
      Role: Expert ${langName} linguist.
      Task: Convert the ${langName} word "${word}" to its dictionary/base form (lemma).
      
      Rules:
      - For verbs: return the infinitive form
      - For nouns: return the nominative singular form
      - For adjectives: return the masculine nominative singular form (or base form for languages without gender)
      - For adverbs: return the base form
      - If already in base form, return as-is
      - Return ONLY the lemma, nothing else
      
      Output: { "lemma": "the base form" }
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      const parsed = parseAIJSON<{ lemma: string }>(result);
      return parsed.lemma || word;
    } catch (e) {
      console.error("Failed to parse lemmatize response", e);
      return word;
    }
  },

  async translateText(text: string, language: typeof LanguageId[keyof typeof LanguageId] = LanguageId.Polish, apiKey: string): Promise<string> {
    const langName = language === LanguageId.Norwegian ? 'Norwegian' : (language === LanguageId.Japanese ? 'Japanese' : (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));
    const prompt = `
      Role: Expert Translator.
      Task: Translate the following ${langName} text to English.
      Constraint: Provide ONLY the direct English translation. No detailed explanations, no markdown, no conversational filler.
      
      Text: "${text}"
    `;
    return await callGemini(prompt, apiKey);
  },

  async analyzeWord(word: string, contextSentence: string, language: typeof LanguageId[keyof typeof LanguageId] = LanguageId.Polish, apiKey: string): Promise<{
    definition: string;
    partOfSpeech: string;
    contextMeaning: string;
  }> {
    const langName = language === LanguageId.Norwegian ? 'Norwegian' : (language === LanguageId.Japanese ? 'Japanese' : (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));

    const responseSchema: GeminiResponseSchema = {
      type: 'OBJECT',
      properties: {
        definition: { type: 'STRING' },
        partOfSpeech: { type: 'STRING' },
        contextMeaning: { type: 'STRING' }
      },
      required: ['definition', 'partOfSpeech', 'contextMeaning']
    };

    const prompt = `
      Role: Expert Language Tutor.
      Task: Analyze the ${langName} word "${word}" in the context of the sentence: "${contextSentence}".
      
      Requirements:
      - definition: A concise, context-relevant English definition (max 10 words).
      - partOfSpeech: The part of speech (noun, verb, adjective, etc.) AND the specific grammatical form/case used in the sentence if applicable.
      - contextMeaning: The specific nuance or meaning of the word *exactly* as it is used in this sentence.
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      return parseAIJSON(result);
    } catch (e) {
      console.error("Failed to parse AI response", e, "\nRaw:", result);
      return {
        definition: "Failed to analyze",
        partOfSpeech: "Unknown",
        contextMeaning: "Could not retrieve context"
      };
    }
  },

  async generateSentenceForWord(targetWord: string, language: typeof LanguageId[keyof typeof LanguageId] = LanguageId.Polish, apiKey: string): Promise<{
    targetSentence: string;
    nativeTranslation: string;
    targetWordTranslation: string;
    targetWordPartOfSpeech: string;
    notes: string;
    furigana?: string;
  }> {
    const langName = language === LanguageId.Norwegian ? 'Norwegian' : (language === LanguageId.Japanese ? 'Japanese' : (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));

    const responseSchema: GeminiResponseSchema = {
      type: 'OBJECT',
      properties: {
        targetSentence: { type: 'STRING' },
        nativeTranslation: { type: 'STRING' },
        targetWordTranslation: { type: 'STRING' },
        targetWordPartOfSpeech: {
          type: 'STRING',
          enum: ["noun", "verb", "adjective", "adverb", "pronoun"]
        },
        notes: { type: 'STRING' },
        ...(language === LanguageId.Japanese ? { furigana: { type: 'STRING' } } : {})
      },
      required: ['targetSentence', 'nativeTranslation', 'targetWordTranslation', 'targetWordPartOfSpeech', 'notes']
    };

    let prompt = `
      Role: Native Speaker & Language Teacher.
      Task: Generate a practical, natural ${langName} sentence using the word "${targetWord}".
      
      Guidelines:
      - The sentence must be colloquially natural but grammatically correct.
      - Useful for a learner (A2/B1 level).
      - Context should make the meaning of "${targetWord}" clear.
      
      Fields:
      - targetSentence: A natural ${langName} sentence containing "${targetWord}".
      - nativeTranslation: Natural English translation.
      - targetWordTranslation: English translation of "${targetWord}".
      - targetWordPartOfSpeech: Exactly one of: "noun", "verb", "adjective", "adverb", "pronoun".
      - notes: A brief, helpful grammar note about how the word is functioning in this specific sentence (e.g. case usage, conjugation). Max 2 sentences.
    `;

    if (language === LanguageId.Japanese) {
      prompt += `
      - furigana: The FULL targetSentence with furigana in the format "Kanji[reading]" for ALL Kanji. 
        Example: "私[わたし]は 日本語[にほんご]を 勉強[べんきょう]しています。" (Ensure the brackets are correct).
      `;
    }

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      return parseAIJSON(result);
    } catch (e) {
      console.error("Failed to parse AI response", e, "\nRaw:", result);
      throw new Error("Failed to generate sentence for word");
    }
  },

  async generateCardContent(sentence: string, language: typeof LanguageId[keyof typeof LanguageId] = LanguageId.Polish, apiKey: string): Promise<{
    translation: string;
    targetWord?: string;
    targetWordTranslation?: string;
    targetWordPartOfSpeech?: string;
    notes: string;
    furigana?: string;
  }> {
    const langName = language === LanguageId.Norwegian ? 'Norwegian' : (language === LanguageId.Japanese ? 'Japanese' : (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));

    const responseSchema: GeminiResponseSchema = {
      type: 'OBJECT',
      properties: {
        translation: { type: 'STRING' },
        targetWord: { type: 'STRING' },
        targetWordTranslation: { type: 'STRING' },
        targetWordPartOfSpeech: {
          type: 'STRING',
          enum: ["noun", "verb", "adjective", "adverb", "pronoun"]
        },
        notes: { type: 'STRING' },
        ...(language === LanguageId.Japanese ? { furigana: { type: 'STRING' } } : {})
      },
      required: ['translation', 'targetWord', 'targetWordTranslation', 'targetWordPartOfSpeech', 'notes']
    };

    let prompt = `
      Role: Expert Language Teacher.
      Task: Create a high-quality flashcard from this ${langName} sentence: "${sentence}".
      
      Fields:
      - translation: Natural, idiomatic English translation.
      - targetWord: The single most important vocabulary word in the sentence (lemma form if possible, or the word as is if more appropriate for beginners).
      - targetWordTranslation: English translation of the target word.
      - targetWordPartOfSpeech: One of: noun, verb, adjective, adverb, pronoun.
      - notes: Concise grammar explanation (max 2 sentences). specific to this sentence's structure or the target word's usage.
    `;

    if (language === LanguageId.Japanese) {
      prompt += `
      - furigana: The FULL sentence with furigana in format "Kanji[reading]" for ALL Kanji. 
        Example: "私[わたし]は 日本語[にほんご]を 勉強[べんきょう]しています。"
      `;
    }

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      return parseAIJSON(result);
    } catch (e) {
      console.error("Failed to parse AI response", e, "\nRaw:", result);
      return {
        translation: "",
        notes: ""
      };
    }
  },

  async generateBatchCards({
    instructions,
    count,
    language,
    apiKey,
    learnedWords,
    proficiencyLevel = 'A1',
    difficultyMode = 'immersive',
    wordTypeFilters
  }: BatchGenerationOptions & { apiKey: string }): Promise<GeneratedCardData[]> {
    const langName = language === LanguageId.Norwegian ? 'Norwegian' : (language === LanguageId.Japanese ? 'Japanese' : (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));

    const hasLearnedWords = learnedWords && learnedWords.length > 0;

    let progressionRules = '';

    if (difficultyMode === 'beginner') {
      if (hasLearnedWords) {
        progressionRules = `
        CRITICAL PROGRESSION RULES (Continued Learning):
        This is a SEQUENTIAL LESSON extending the user's existing knowledge.

        User ALREADY KNOWS: ${learnedWords!.length} words.
        
        1.  **NO SINGLE WORDS**: Do NOT generate cards with just 1 word.
        2.  **Contextual Learning**: Combine [Known Word] + [NEW Word].
        3.  **Progression**:
            - Cards 1-${Math.ceil(count/2)}: Simple phrases using *mostly* known words + 1 NEW word.
            - Cards ${Math.ceil(count/2) + 1}-${count}: Complete simple sentences.
        
        INTERNAL STATE REQUIREMENT:
        - Track "Introduced Vocabulary".
        - **Constraint**: A card should NOT contain more than 1 unknown word (a word that is NOT in "LearnedWords" and NOT in "Introduced Vocabulary").
        `;
      } else {
        progressionRules = `
        CRITICAL PROGRESSION RULES (Zero-to-Hero):
        This is a SEQUENTIAL LESSON. Card N must build upon Cards 1...(N-1).

        1.  **Card 1-2**: Foundation. ABSOLUTE BASICS. 1-2 words max.
        2.  **Card 3-${Math.ceil(count/2)}**: Simple combinations. Reuse words from Cards 1-2.
        3.  **Card ${Math.ceil(count/2) + 1}-${count}**: Basic sentences. STRICTLY REUSE specific vocabulary from previous cards + introduce ONLY 1 new word per card.
        
        INTERNAL STATE REQUIREMENT:
        - Track the "Introduced Vocabulary" list internally as you generate.
        `;
      }
    } else {
      // Immersive Mode
      const iPlusOneRule = hasLearnedWords 
        ? `- **Comprehensible Input**: Prioritize using words from "Known Vocabulary" to construct the sentence, ensuring the context is understood, while teaching the NEW "targetWord".`
        : '';

      progressionRules = `
        CRITICAL: Each card MUST contain a COMPLETE, NATURAL SENTENCE.
        - The sentence must demonstrate vivid, real usage of the target vocabulary word.
        - NEVER return just the word alone — always wrap it in a meaningful context.
        ${iPlusOneRule}
        - Sentence complexity should match ${proficiencyLevel} level.
        - Variety: Mix statements, questions, and imperatives.
        - **DIVERSITY REQUIREMENT**: Generate ${count} DISTINCT target words. 
        - **CONSTRAINT**: Do NOT use the same "targetWord" more than once in this batch.
        `;
    }

    // Shuffle and limit learned words to provide a good random sample without overflowing context
    const shuffledLearnedWords = learnedWords ? [...learnedWords].sort(() => 0.5 - Math.random()).slice(0, 1000) : [];

    const knownWordsContext = hasLearnedWords
      ? `
        KNOWN VOCABULARY (User knows ${learnedWords!.length} words, showing ${shuffledLearnedWords.length} sample):
        [${shuffledLearnedWords.join(", ")}]
        
        Use these known words to provide context. The "targetWord" MUST be a NEW word not in this list.
        `
      : "User has NO prior vocabulary. Start from scratch.";

    const allWordTypes: WordType[] = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection'];
    const wordTypesForSchema = wordTypeFilters && wordTypeFilters.length > 0 ? wordTypeFilters : allWordTypes;

    const cardSchemaProperties: Record<string, GeminiSchemaProperty> = {
      targetSentence: { 
        type: "STRING",
        description: `A natural ${langName} sentence utilizing the target word.`
      },
      nativeTranslation: { 
        type: "STRING",
        description: "Natural English translation."
      },
      targetWord: { 
        type: "STRING",
        description: "The main word being taught (lemma form preferred)."
      },
      targetWordTranslation: { type: "STRING" },
      targetWordPartOfSpeech: {
        type: "STRING",
        enum: wordTypesForSchema
      },
      grammaticalCase: { type: "STRING" },
      gender: { type: "STRING" },
      notes: { 
        type: "STRING",
        description: "Brief grammar note (max 2 sentences)."
      }
    };

    const requiredFields = ["targetSentence", "nativeTranslation", "targetWord", "targetWordTranslation", "targetWordPartOfSpeech", "notes"];

    if (language === LanguageId.Japanese) {
      cardSchemaProperties.furigana = {
        type: "STRING",
        description: "The FULL targetSentence with kanji readings in Kanji[reading] format for ALL kanji characters"
      };
      requiredFields.push("furigana");
    }

    const cardSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: cardSchemaProperties,
      required: requiredFields
    };

    const responseSchema: GeminiResponseSchema = {
      type: "ARRAY",
      items: cardSchema
    };

    const prompt = `
      Role: Expert ${langName} curriculum designer.
      Task: Generate a set of ${count} high-quality flashcards.
      Topic: "${instructions}"
      
      ${progressionRules}
      
      ${wordTypeFilters && wordTypeFilters.length > 0 ? `
      WORD TYPE CONSTRAINT:
      - The "targetWord" in EACH card MUST be one of: ${wordTypeFilters.join(', ')}.
      ` : ''}
      
      Style Guidelines:
      - Tone: Natural, friendly, helpful.
      - **Vocabulary Strategy**: 
          - Repeats of *learned* words is encouraged for context.
          - **Target Words**: MUST BE UNIQUE.
      - Content: Tangible, visual, and concrete concepts first.
      
      ${knownWordsContext}
      
      IMPORTANT: Generate exactly ${count} cards.
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);

    try {
      const parsed = parseAIJSON<GeneratedCardData[]>(result);
      if (!Array.isArray(parsed)) {
        console.warn("Gemini did not return an array:", parsed);
        return [];
      }
      
      const validCards = parsed.filter(c => {
        const hasRequiredFields = c.targetSentence && c.targetWord && c.nativeTranslation;
        const matchesType = !wordTypeFilters || wordTypeFilters.length === 0 || (c.targetWordPartOfSpeech && wordTypeFilters.includes(c.targetWordPartOfSpeech as WordType));
        return hasRequiredFields && matchesType;
      });

      // Deduplicate strategy: Ensure strictly unique targetWords (case-insensitive)
      const seenWords = new Set<string>();
      const uniqueCards: GeneratedCardData[] = [];

      for (const card of validCards) {
        const normalizedWord = card.targetWord.trim().toLowerCase();
        if (!seenWords.has(normalizedWord)) {
          seenWords.add(normalizedWord);
          uniqueCards.push(card);
        }
      }

      return uniqueCards;
    } catch (e) {
      console.error("Failed to parse AI batch response", e, "\nRaw:", result);
      throw new Error("Failed to generate valid cards");
    }
  }
};

```

# src/lib/ai/index.ts

```typescript
export * from './gemini';

```

# src/lib/fsrsOptimizer.ts

```typescript
import { ReviewLog } from '@/types';
import { computeCardLoss } from './fsrsShared';


export const optimizeFSRS = async (
  allLogs: ReviewLog[],
  currentW: number[],
  onProgress: (progress: number) => void
): Promise<number[]> => {


  const cardHistory: Record<string, ReviewLog[]> = {};
  allLogs.forEach(log => {
    if (!cardHistory[log.card_id]) cardHistory[log.card_id] = [];
    cardHistory[log.card_id].push(log);
  });

  const cardGroups = Object.values(cardHistory);

  if (cardGroups.length < 5) {
    throw new Error("Insufficient history (need 5+ cards with reviews)");
  }

  let w = [...currentW];
  const learningRate = 0.002;
  const iterations = 500;
  const batchSize = Math.min(cardGroups.length, 64);



  const targetIndices = [0, 1, 2, 3, 8, 9, 10, 11, 12];

  for (let iter = 0; iter < iterations; iter++) {
    const gradients = new Array(19).fill(0);
    let totalLoss = 0;


    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      batch.push(cardGroups[Math.floor(Math.random() * cardGroups.length)]);
    }


    const h = 0.0001;


    for (const logs of batch) {
      totalLoss += computeCardLoss(logs, w);
    }


    for (const idx of targetIndices) {
      const wPlus = [...w];
      wPlus[idx] += h;

      let lossPlus = 0;
      for (const logs of batch) {
        lossPlus += computeCardLoss(logs, wPlus);
      }

      gradients[idx] = (lossPlus - totalLoss) / h;
    }


    for (const idx of targetIndices) {
      w[idx] -= learningRate * gradients[idx];
      if (w[idx] < 0.01) w[idx] = 0.01;
    }

    if (iter % 20 === 0) {
      onProgress((iter / iterations) * 100);
      await new Promise(r => setTimeout(r, 0));
    }
  }

  onProgress(100);
  return w;
};


```

# src/lib/fsrsShared.ts

```typescript
import { ReviewLog } from '@/types';

export const DECAY = -0.6;
export const FACTOR = 0.9 ** (1 / DECAY) - 1;

export const getRetrievability = (elapsedDays: number, stability: number): number => {
    if (stability <= 0) return 0;
    return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
};

export const nextStability = (s: number, d: number, r: number, rating: number, w: number[]): number => {
    if (rating === 1) {
        return w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r));
    }
    const hardPenalty = rating === 2 ? w[15] : 1;
    const easyBonus = rating === 4 ? w[16] : 1;
    return s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1) * hardPenalty * easyBonus);
};

export const nextDifficulty = (d: number, rating: number, w: number[]): number => {
    const nextD = d - w[6] * (rating - 3);
    return Math.min(10, Math.max(1, nextD * (1 - w[7]) + w[4] * w[7]));
};

export const computeCardLoss = (logs: ReviewLog[], w: number[]): number => {
    let loss = 0;
    let s = w[0];
    let d = w[4];

    for (const log of logs) {
        const { grade, elapsed_days, state } = log;

        if (state === 0 || state === 1) {
            s = w[grade - 1];
            d = w[4] - w[5] * (grade - 3);
            d = Math.max(1, Math.min(10, d));
            continue;
        }

        const r = getRetrievability(elapsed_days, s);
        const y = grade > 1 ? 1 : 0;
        const p = Math.max(0.0001, Math.min(0.9999, r));

        loss -= (y * Math.log(p) + (1 - y) * Math.log(1 - p));

        if (grade === 1) {
            s = nextStability(s, d, r, 1, w);
            d = nextDifficulty(d, 1, w);
        } else {
            s = nextStability(s, d, r, grade, w);
            d = nextDifficulty(d, grade, w);
        }
    }

    return loss;
};

```

# src/lib/memeUtils.ts

```typescript
export const uwuify = (text: string) => {
  return text
    .replace(/r/g, 'w')
    .replace(/R/g, 'W')
    .replace(/l/g, 'w')
    .replace(/L/g, 'W')
    .replace(/ma/g, 'mwa')
    .replace(/mo/g, 'mwo')
    .replace(/\./g, ' UwU.')
    .replace(/!/g, ' >w<');
};

export const FAKE_ANSWERS = [
  'A type of small cheese',
  'The capital of Peru',
  "It means 'To Explode'",
  'Mathematical equation',
  'Just a random noise',
  'Something forbidden',
  'Approximately 42',
  "I don't know either",
  'Your mom',
  'Bitcoin',
];

```

# src/lib/sync/index.ts

```typescript
export {
    exportSyncData,
    saveSyncFile,
    loadSyncFile,
    checkSyncFile,
    importSyncData,
    getSyncFilePath,
    setSyncFilePath,
    getLastSyncTime,
    setLastSyncTime,
    clearSyncFileHandle,
    type SyncData
} from './syncService';

```

# src/lib/sync/syncService.ts

```typescript
import { db } from '@/db/dexie';
import { getCards, saveAllCards, clearAllCards } from '@/db/repositories/cardRepository';
import { getHistory, saveFullHistory, clearHistory } from '@/db/repositories/historyRepository';
import { getFullSettings, getSystemSetting, setSystemSetting } from '@/db/repositories/settingsRepository';
import { UserSettings, Card } from '@/types';

export interface SyncData {
    version: number;
    lastSynced: string;
    deviceId: string;
    cards: Card[];
    history: Record<string, number>;
    revlog: Array<{
        id: string;
        card_id: string;
        grade: number;
        state: number;
        elapsed_days: number;
        scheduled_days: number;
        stability: number;
        difficulty: number;
        created_at: string;
    }>;
    settings: Partial<UserSettings>;
    profile: {
        id: string;
        username?: string;
        xp: number;
        points: number;
        level: number;
        language_level?: string;
        initial_deck_generated?: boolean;
        created_at: string;
        updated_at: string;
    } | null;
    aggregatedStats: Array<{
        id: string;
        language: string;
        metric: string;
        value: number;
        updated_at: string;
    }>;
}

const SYNC_FILENAME = 'linguaflow-sync.json';

let cachedFileHandle: FileSystemFileHandle | null = null;

const getDeviceId = async (): Promise<string> => {
    const storageKey = 'deviceId';
    let deviceId = await getSystemSetting<string>(storageKey);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        await setSystemSetting(storageKey, deviceId);
    }
    return deviceId;
};

export const getSyncFilePath = async (): Promise<string> => {
    const customPath = await getSystemSetting<string>('syncPath');
    return customPath || SYNC_FILENAME;
};

export const setSyncFilePath = async (path: string): Promise<void> => {
    await setSystemSetting('syncPath', path);
};

export const clearSyncFileHandle = (): void => {
    cachedFileHandle = null;
};

export const exportSyncData = async (settings: Partial<UserSettings>): Promise<SyncData> => {
    const cards = await getCards();
    const history = await getHistory();
    const revlog = await db.revlog.toArray();
    const profiles = await db.profile.toArray();
    const aggregatedStats = await db.aggregated_stats.toArray();

    const safeSettings: Partial<UserSettings> = {
        ...settings,
        geminiApiKey: ''
    };

    if (settings.tts) {
        safeSettings.tts = {
            ...settings.tts,
            googleApiKey: '',
            azureApiKey: ''
        };
    }

    // Export profile without username (username is device-specific)
    const profileForExport = profiles.length > 0 ? {
        ...profiles[0],
        username: undefined,  // Don't export username
    } : null;

    return {
        version: 3,
        lastSynced: new Date().toISOString(),
        deviceId: await getDeviceId(),
        cards,
        history,
        revlog,
        settings: safeSettings,
        profile: profileForExport,
        aggregatedStats
    };
};

export const saveSyncFile = async (settings: Partial<UserSettings>): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
        const syncData = await exportSyncData(settings);
        const jsonContent = JSON.stringify(syncData, null, 2);
        const filename = await getSyncFilePath();

        if ('showSaveFilePicker' in window) {
            try {
                let handle = cachedFileHandle;

                if (handle) {
                    const permission = await (handle as any).queryPermission({ mode: 'readwrite' });
                    if (permission !== 'granted') {
                        const requestResult = await (handle as any).requestPermission({ mode: 'readwrite' });
                        if (requestResult !== 'granted') {
                            handle = null;
                        }
                    }
                }

                if (!handle) {
                    handle = await (window as any).showSaveFilePicker({
                        suggestedName: filename,
                        types: [{
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });
                    cachedFileHandle = handle;
                }

                const writable = await handle!.createWritable();
                await writable.write(jsonContent);
                await writable.close();
                return { success: true, path: handle!.name };
            } catch (e: any) {
                if (e.name === 'AbortError') {
                    return { success: false, error: 'Save cancelled' };
                }
                if (cachedFileHandle) {
                    cachedFileHandle = null;
                    return saveSyncFile(settings);
                }
                throw e;
            }
        } else {
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return { success: true, path: filename };
        }
    } catch (error: any) {
        console.error('[Sync] Save failed:', error);
        return { success: false, error: error.message };
    }
};

export const loadSyncFile = async (): Promise<{ success: boolean; data?: SyncData; error?: string }> => {
    try {
        if ('showOpenFilePicker' in window) {
            try {
                const [handle] = await (window as any).showOpenFilePicker({
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                const file = await handle.getFile();
                const text = await file.text();
                const data = JSON.parse(text) as SyncData;
                return { success: true, data };
            } catch (e: any) {
                if (e.name === 'AbortError') {
                    return { success: false, error: 'Load cancelled' };
                }
                throw e;
            }
        } else {
            // Fallback for browsers that don't support File System Access API
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json,.json';
                input.style.display = 'none';
                document.body.appendChild(input);

                const cleanup = () => {
                    if (document.body.contains(input)) {
                        document.body.removeChild(input);
                    }
                };

                input.onchange = async (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        try {
                            const text = await file.text();
                            const data = JSON.parse(text) as SyncData;
                            resolve({ success: true, data });
                        } catch (error: any) {
                            resolve({ success: false, error: error.message });
                        }
                    } else {
                        resolve({ success: false, error: 'No file selected' });
                    }
                    cleanup();
                };

                // Handle cancellation (supported in modern browsers)
                input.addEventListener('cancel', () => {
                    resolve({ success: false, error: 'Load cancelled' });
                    cleanup();
                });

                input.click();
            });
        }
    } catch (error: any) {
        console.error('[Sync] Load failed:', error);
        return { success: false, error: error.message };
    }
};

export const checkSyncFile = async (): Promise<{ exists: boolean; lastSynced?: string; deviceId?: string }> => {
    // Web platform cannot check for sync file existence without user interaction
    return { exists: false };
};

export const importSyncData = async (
    data: SyncData,
    updateSettings: (settings: Partial<UserSettings>) => void
): Promise<{ success: boolean; error?: string }> => {
    try {
        if (!data.cards || !Array.isArray(data.cards)) {
            return { success: false, error: 'Invalid sync data: missing cards' };
        }

        // Get existing profile before clearing to preserve id and username
        const existingProfiles = await db.profile.toArray();
        const existingProfile = existingProfiles.length > 0 ? existingProfiles[0] : null;

        await clearAllCards();
        await clearHistory();
        await db.revlog.clear();
        await db.aggregated_stats.clear();
        // Don't clear profile - we'll merge instead

        if (data.cards.length > 0) {
            await saveAllCards(data.cards);
        }

        if (data.history && typeof data.history === 'object') {
            const languages = new Set(data.cards.map(c => c.language).filter(Boolean));
            const primaryLanguage = languages.size > 0 ? [...languages][0] : 'polish';
            await saveFullHistory(data.history, primaryLanguage);
        }

        if (data.revlog && Array.isArray(data.revlog) && data.revlog.length > 0) {
            await db.revlog.bulkPut(data.revlog);
        }

        // Merge imported profile with existing profile, preserving id and username
        if (data.profile && existingProfile) {
            const mergedProfile = {
                ...data.profile,
                id: existingProfile.id,  // Keep existing id
                username: existingProfile.username,  // Keep existing username
            };
            await db.profile.put(mergedProfile);
        } else if (existingProfile) {
            // If no profile in import data, keep existing profile
            // (profile already exists, nothing to do)
        }

        if (data.aggregatedStats && Array.isArray(data.aggregatedStats)) {
            await db.aggregated_stats.bulkPut(data.aggregatedStats);
        }

        if (data.settings) {


            const restoredProfile = data.profile; let preservedKeys: Partial<UserSettings> | UserSettings['tts'] = {};
            if (restoredProfile) {
                const existingSettings = await getFullSettings(restoredProfile.id);
                if (existingSettings) {
                    preservedKeys = {
                        geminiApiKey: existingSettings.geminiApiKey,
                        tts: {
                            provider: existingSettings.tts?.provider || 'browser',
                            googleApiKey: existingSettings.googleTtsApiKey || existingSettings.tts?.googleApiKey,
                            azureApiKey: existingSettings.azureTtsApiKey || existingSettings.tts?.azureApiKey,
                        } as any
                    };
                }
            }

            const restoredSettings: Partial<UserSettings> = {
                ...data.settings,
                geminiApiKey: preservedKeys.geminiApiKey || '',
                tts: {
                    ...(data.settings.tts || {}),
                    googleApiKey: (preservedKeys.tts as any)?.googleApiKey || '',
                    azureApiKey: (preservedKeys.tts as any)?.azureApiKey || '',
                } as UserSettings['tts'],
            };
            updateSettings(restoredSettings);
        }

        return { success: true };
    } catch (error: any) {
        console.error('[Sync] Import failed:', error);
        return { success: false, error: error.message };
    }
};

export const getLastSyncTime = async (): Promise<string | null> => {
    return await getSystemSetting<string>('lastSync') || null;
};

export const setLastSyncTime = async (time: string): Promise<void> => {
    await setSystemSetting('lastSync', time);
};

```

# src/lib/tts/index.ts

```typescript
import { Language, TTSSettings, TTSProvider } from "@/types";
import { toast } from 'sonner';

const LANG_CODE_MAP: Record<Language, string[]> = {
    polish: ['pl-PL', 'pl'],
    norwegian: ['nb-NO', 'no-NO', 'no'],
    japanese: ['ja-JP', 'ja'],
    spanish: ['es-ES', 'es-MX', 'es'],
    german: ['de-DE', 'de-AT', 'de-CH', 'de']
};

export interface VoiceOption {
    id: string;
    name: string;
    lang: string;
    provider: TTSProvider;
    gender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

class TTSService {
    private browserVoices: SpeechSynthesisVoice[] = [];
    private audioContext: AudioContext | null = null;
    private currentSource: AudioBufferSourceNode | null = null;
    private currentOperationId = 0;
    private abortController: AbortController | null = null;
    private resumeInterval: ReturnType<typeof setInterval> | null = null;

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
            this.audioContext.close().catch(() => { });
            this.audioContext = null;
        }
    }

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

        if (settings.provider === 'google' && settings.googleApiKey) {
            try {
                const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${settings.googleApiKey}`);
                const data = await response.json();

                if (data.voices) {
                    return data.voices
                        .filter((v: any) =>
                            v.languageCodes.some((code: string) =>
                                validCodes.some(validCode => code.toLowerCase().startsWith(validCode.toLowerCase()))
                            )
                        )
                        .map((v: any) => ({
                            id: v.name,
                            name: `${v.name} (${v.ssmlGender})`,
                            lang: v.languageCodes[0],
                            provider: 'google',
                            gender: v.ssmlGender
                        }));
                }
            } catch (e) {
                console.error("Failed to fetch Google voices", e);
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
        } else if (settings.provider === 'azure') {
            await this.speakAzure(text, language, settings, opId);
        } else if (settings.provider === 'google') {
            await this.speakGoogle(text, language, settings, opId);
        }
    }

    private async speakBrowser(text: string, language: Language, settings: TTSSettings) {
        if (!('speechSynthesis' in window)) return;

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

        utterance.onstart = () => {
            this.resumeInterval = setInterval(() => {
                if (!window.speechSynthesis.speaking) {
                    if (this.resumeInterval) {
                        clearInterval(this.resumeInterval);
                        this.resumeInterval = null;
                    }
                } else if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
            }, 10000);
        };

        utterance.onend = () => {
            if (this.resumeInterval) {
                clearInterval(this.resumeInterval);
                this.resumeInterval = null;
            }
        };

        utterance.onerror = (event) => {
            if (this.resumeInterval) {
                clearInterval(this.resumeInterval);
                this.resumeInterval = null;
            }
            if (event.error !== 'interrupted') {
                console.error("Speech synthesis error:", event.error);
            }
        };

        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 50);
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
            toast.error('Azure TTS failed. Check your API key and region.');
        }
    }

    private async speakGoogle(text: string, language: Language, settings: TTSSettings, opId: number) {
        if (!settings.googleApiKey) return;

        try {
            const requestBody = {
                input: { text },
                voice: {
                    languageCode: LANG_CODE_MAP[language][0],
                    name: settings.voiceURI && settings.voiceURI !== 'default' ? settings.voiceURI : undefined
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: settings.rate,
                    pitch: (settings.pitch - 1) * 20, volumeGainDb: (settings.volume - 1) * 10
                }
            };

            const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${settings.googleApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                signal: this.abortController?.signal,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || response.statusText);
            }
            if (this.currentOperationId !== opId) return;

            const data = await response.json();

            const binaryString = window.atob(data.audioContent);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            this.playAudioBuffer(bytes.buffer, opId);

        } catch (e: any) {
            if (e?.name === 'AbortError') return;
            console.error("Google TTS error", e);
            toast.error(`Google TTS failed: ${e.message}`);
        }
    }

    private getAudioContext(): AudioContext {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    private async playAudioBuffer(buffer: ArrayBuffer, opId: number) {
        try {
            const ctx = this.getAudioContext();

            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const decodedBuffer = await ctx.decodeAudioData(buffer.slice(0));
            if (this.currentOperationId !== opId) return;

            if (this.currentSource) {
                try { this.currentSource.stop(); } catch { }
            }

            this.currentSource = ctx.createBufferSource();
            this.currentSource.buffer = decodedBuffer;
            this.currentSource.connect(ctx.destination);

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

        if (this.resumeInterval) {
            clearInterval(this.resumeInterval);
            this.resumeInterval = null;
        }

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (this.currentSource) {
            try { this.currentSource.stop(); } catch { }
            this.currentSource = null;
        }
    }
}

export const ttsService = new TTSService();

```

# src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getLevelProgress(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelStartXP = 100 * Math.pow(level - 1, 2);
  const nextLevelStartXP = 100 * Math.pow(level, 2);
  const xpGainedInLevel = xp - currentLevelStartXP;
  const xpRequiredForLevel = nextLevelStartXP - currentLevelStartXP;
  const progressPercent = Math.min(100, Math.max(0, (xpGainedInLevel / xpRequiredForLevel) * 100));
  const xpToNextLevel = nextLevelStartXP - xp;

  return { level, progressPercent, xpToNextLevel };
}

export function parseFurigana(text: string): FuriganaSegment[] {
  const regex = /([^\s\[\]]+)\[([^\]]+)\]/g;
  const segments: FuriganaSegment[] = [];
  let lastIndex = 0;
  let match;


  const punctuationRegex = /^([、。！？「」『』（）\(\),.!?:;""''—\-–]+)(.*)/;

  while ((match = regex.exec(text)) !== null) {

    if (match.index > lastIndex) {
      const betweenText = text.slice(lastIndex, match.index);

      betweenText.split(/(\s+)/).forEach(part => {
        if (part) {
          segments.push({ text: part });
        }
      });
    }

    let kanjiText = match[1];
    const furigana = match[2];

    while (true) {

      const punctuationMatch = kanjiText.match(punctuationRegex);
      if (punctuationMatch && punctuationMatch[2]) {
        segments.push({ text: punctuationMatch[1] });
        kanjiText = punctuationMatch[2];
        continue;
      }



      const kanaRegex = /^([\u3040-\u30ff]+)(.*)/;
      const kanaMatch = kanjiText.match(kanaRegex);

      if (kanaMatch && kanaMatch[2]) {


        segments.push({ text: kanaMatch[1] });
        kanjiText = kanaMatch[2];
        continue;
      }

      break;
    }

    segments.push({ text: kanjiText, furigana: furigana });

    lastIndex = regex.lastIndex;
  }


  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    remainingText.split(/(\s+)/).forEach(part => {
      if (part) {
        segments.push({ text: part });
      }
    });
  }

  return segments;
}

export function findInflectedWordInSentence(
  targetWord: string,
  sentence: string
): string | null {
  if (!targetWord || !sentence) return null;

  const targetLower = targetWord.toLowerCase();

  const words = sentence.match(/[\p{L}]+/gu) || [];

  const exactMatch = words.find(w => w.toLowerCase() === targetLower);
  if (exactMatch) return exactMatch;

  const minStemLength = targetWord.length <= 4 ? 2 : Math.min(4, Math.ceil(targetWord.length * 0.5));

  let bestMatch: string | null = null;
  let bestMatchScore = 0;

  for (const word of words) {
    const wordLower = word.toLowerCase();

    let sharedLength = 0;
    const maxLength = Math.min(targetLower.length, wordLower.length);

    for (let i = 0; i < maxLength; i++) {
      if (targetLower[i] === wordLower[i]) {
        sharedLength++;
      } else {
        break;
      }
    }

    if (sharedLength >= minStemLength) {
      const lengthDiff = Math.abs(targetWord.length - word.length);
      const score = sharedLength * 10 - lengthDiff;

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = word;
      }
    }
  }

  return bestMatch;
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2,
    r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin;
  let h = 0,
    s = 0,
    l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return { h, s, l };
}
```

# src/main.tsx

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

```

# src/reproduce_issue.ts

```typescript

import { addMinutes, differenceInMilliseconds, parseISO } from 'date-fns';

const runTests = () => {

    try {
        const d = addMinutes(new Date(), NaN);
    } catch (e) {
    }

    try {
        const invalidDate = new Date("invalid");
        const diff = differenceInMilliseconds(invalidDate, new Date());
    } catch (e) {
    }

    try {
        const d = parseISO("invalid-date-string");
        const diff = differenceInMilliseconds(d, new Date());
    } catch (e) {
    }
};

runTests();

```

# src/router.tsx

```typescript
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load all route components for better code splitting
const DashboardRoute = lazy(() => import('@/routes/DashboardRoute').then(m => ({ default: m.DashboardRoute })));
const StudyRoute = lazy(() => import('@/routes/StudyRoute').then(m => ({ default: m.StudyRoute })));
const CardsRoute = lazy(() => import('@/routes/CardsRoute').then(m => ({ default: m.CardsRoute })));
const SettingsRoute = lazy(() => import('@/features/settings/routes/SettingsRoute').then(m => ({ default: m.SettingsRoute })));

const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-4 w-4 border border-foreground/20 border-t-foreground" />
      <span className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">Loading</span>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => (
  <Suspense fallback={<RouteLoadingFallback />}>
    <Routes>
      <Route path="/" element={<DashboardRoute />} />
      <Route path="/study" element={<StudyRoute />} />
      <Route path="/cards" element={<CardsRoute />} />
      <Route path="/settings/*" element={<SettingsRoute />} />
    </Routes>
  </Suspense>
);

```

# src/routes/CardsRoute.tsx

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Plus, Sparkles, BookOpen, Zap, Trash2, Filter, Bookmark, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useDeckStats } from '@/features/collection/hooks/useDeckStats';
import { Card } from '@/types';
import { AddCardModal } from '@/features/collection/components/AddCardModal';
import { GenerateCardsModal } from '@/features/generator/components/GenerateCardsModal';
import { CardHistoryModal } from '@/features/collection/components/CardHistoryModal';
import { CardList } from '@/features/collection/components/CardList';
import { useCardOperations } from '@/features/collection/hooks/useCardOperations';
import { useCardsQuery, CardFilters } from '@/features/collection/hooks/useCardsQuery';

import { cn } from '@/lib/utils';

export const CardsRoute: React.FC = () => {
  const { stats } = useDeckStats();
  const { addCard, addCardsBatch, updateCard, deleteCard, deleteCardsBatch, prioritizeCards } = useCardOperations();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<CardFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 50;

  const { data, isLoading } = useCardsQuery(page, pageSize, debouncedSearch, filters);
  const cards = data?.data || [];
  const totalCount = data?.count || 0;

  const activeFilterCount = (filters.status && filters.status !== 'all' ? 1 : 0) +
    (filters.bookmarked ? 1 : 0) +
    (filters.leech ? 1 : 0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  }, [page, debouncedSearch, filters]);

  const clearFilters = () => {
    setFilters({});
  };

  const handleEditCard = (card: Card) => {
    setSelectedCard(card);
    setIsAddModalOpen(true);
  };

  const handleViewHistory = (card: Card) => {
    setSelectedCard(card);
    setIsHistoryModalOpen(true);
  };

  const handleToggleSelect = useCallback((id: string, index: number, isShift: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isShift && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const idsInRange = cards.slice(start, end + 1).map(c => c.id);
        const shouldSelect = !prev.has(id);
        idsInRange.forEach(rangeId => shouldSelect ? next.add(rangeId) : next.delete(rangeId));
      } else {
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setLastSelectedIndex(index);
      }
      return next;
    });
  }, [cards, lastSelectedIndex]);

  const handleBatchPrioritize = async () => {
    if (selectedIds.size === 0) return;
    await prioritizeCards(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} card${selectedIds.size === 1 ? '' : 's'}? This action cannot be undone.`)) {
      const ids = Array.from(selectedIds);
      await deleteCardsBatch(ids);
      setSelectedIds(new Set());
    }
  };

  const handleSelectAll = useCallback(() => {
    const allCurrentPageIds = cards.map(c => c.id);
    const allSelected = allCurrentPageIds.every(id => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allCurrentPageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allCurrentPageIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [cards, selectedIds]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex-1 min-h-0 flex flex-col relative bg-background">
      {/* Search & Header */}
      <header className="px-4 md:px-8 pb-2 border-b">
        <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-md">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Collection
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="tabular-nums">{stats.total} Cards</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="tabular-nums">{stats.learned} Mastered</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>

            <div className="relative">
              <Button
                variant={activeFilterCount > 0 ? "secondary" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                title="Filter Cards"
              >
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                )}
              </Button>

              {/* Filter Dropdown */}
              {showFilters && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFilters(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-popover border text-popover-foreground shadow-md rounded-md p-4 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="text-sm font-semibold">Filters</span>
                      {activeFilterCount > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={clearFilters}
                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['all', 'new', 'learning', 'graduated', 'known'] as const).map((status) => (
                          <Button
                            key={status}
                            variant={(filters.status === status || (!filters.status && status === 'all')) ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilters(f => ({ ...f, status: status === 'all' ? undefined : status }))}
                            className="capitalize h-8 text-xs font-normal"
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Quick Filters</label>
                      <div className="space-y-1.5">
                        <Button
                          variant={filters.bookmarked ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setFilters(f => ({ ...f, bookmarked: !f.bookmarked }))}
                          className={cn(
                            "w-full justify-start gap-2 h-8 text-xs font-normal",
                            filters.bookmarked && "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                          )}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Bookmarked</span>
                        </Button>
                        <Button
                          variant={filters.leech ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => setFilters(f => ({ ...f, leech: !f.leech }))}
                          className={cn(
                            "w-full justify-start gap-2 h-8 text-xs font-normal",
                            filters.leech ? "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20" : ""
                          )}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Leech Cards</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsGenerateModalOpen(true)}
              title="Generate Cards"
            >
              <Sparkles className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              onClick={() => setIsAddModalOpen(true)}
              title="Add Card"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="loading loading-spinner loading-lg">Loading...</span>
          </div>
        ) : (
          <CardList
            cards={cards}
            searchTerm=""
            onEditCard={handleEditCard}
            onDeleteCard={(id) => deleteCard(id)}
            onViewHistory={handleViewHistory}
            onPrioritizeCard={(id) => prioritizeCards([id])}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Floating Selection Bar */}
      <div className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto min-w-[300px] transition-all duration-200",
        selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      )}>
        <div className="bg-foreground text-background rounded-full shadow-lg px-6 py-3 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-semibold tabular-nums">{selectedIds.size}</span>
            <span className="text-sm opacity-80">Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBatchPrioritize}
              className="text-background hover:bg-background/20 h-8"
            >
              <Zap className="w-4 h-4 mr-2" />
              Prioritize
            </Button>

            <div className="w-px h-4 bg-background/20" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleBatchDelete}
              className="text-red-300 hover:text-red-200 hover:bg-red-900/30 h-8"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>

            <div className="w-px h-4 bg-background/20" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIds(new Set())}
              className="text-background/60 hover:text-background hover:bg-transparent h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setSelectedCard(undefined); }}
        onAdd={(card) => selectedCard ? updateCard(card) : addCard(card)}
        initialCard={selectedCard}
      />
      <GenerateCardsModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onAddCards={(cards) => addCardsBatch(cards)}
      />
      <CardHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => { setIsHistoryModalOpen(false); setSelectedCard(undefined); }}
        card={selectedCard}
      />
    </div>
  );
};

```

# src/routes/DashboardRoute.tsx

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { useDeckStats } from '@/features/collection/hooks/useDeckStats';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getDashboardStats } from '@/db/repositories/statsRepository';
import { getCardsForDashboard } from '@/db/repositories/cardRepository';
import { LoadingScreen } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';

export const DashboardRoute: React.FC = () => {
  const { history, stats } = useDeckStats();
  const settings = useSettingsStore(s => s.settings);
  const navigate = useNavigate();

  const { data: dashboardStats, isLoading: isStatsLoading, isError: isStatsError } = useQuery({
    queryKey: ['dashboardStats', settings.language],
    queryFn: () => getDashboardStats(settings.language),
  });

  const { data: cards, isLoading: isCardsLoading, isError: isCardsError } = useQuery({
    queryKey: ['dashboardCards', settings.language],
    queryFn: () => getCardsForDashboard(settings.language),
  });

  if (isStatsLoading || isCardsLoading) {
    return <LoadingScreen title="Loading Dashboard" subtitle="Fetching your progress..." />;
  }

  if (isStatsError || isCardsError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-red-500">Failed to load dashboard data.</h2>
        <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
      </div>
    );
  }

  if (!dashboardStats || !cards) {
    return <div>No data found.</div>;
  }


  const metrics = {
    total: dashboardStats.counts.new + dashboardStats.counts.learning + dashboardStats.counts.graduated + dashboardStats.counts.known,
    new: dashboardStats.counts.new,
    learning: dashboardStats.counts.learning,
    reviewing: dashboardStats.counts.graduated,
    known: dashboardStats.counts.known,
  };


  const xp = dashboardStats.languageXp;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;

  return (
    <Dashboard
      metrics={metrics}
      languageXp={{ xp, level }}
      stats={stats}
      history={history}
      onStartSession={() => navigate('/study')}
      cards={cards as any}
    />
  );
};

```

# src/routes/StudyRoute.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Grade } from '@/types';
import { StudySession } from '@/features/study/components/StudySession';
import { useDeckActions } from '@/contexts/DeckActionsContext';
import { useDeckStats } from '@/features/collection/hooks/useDeckStats';
import { useDeckStore } from '@/stores/useDeckStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCardOperations } from '@/features/collection/hooks/useCardOperations';
import { isNewCard } from '@/services/studyLimits';
import {
  getCramCards,
  getDueCards,
} from '@/db/repositories/cardRepository';
import { getTodayReviewStats } from '@/db/repositories/statsRepository';
import { useClaimDailyBonusMutation } from '@/features/collection/hooks/useDeckQueries';
import { CardXpPayload } from '@/core/gamification/xp';
import { LoadingScreen } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { sortCards, CardOrder } from '@/core/srs/cardSorter';

export const StudyRoute: React.FC = () => {
  const { recordReview, undoReview } = useDeckActions();
  const { stats } = useDeckStats();
  const lastReview = useDeckStore(state => state.lastReview);
  const canUndo = !!lastReview;

  const { updateCard, deleteCard, addCard } = useCardOperations();
  const settings = useSettingsStore(s => s.settings);
  const claimBonus = useClaimDailyBonusMutation();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [reserveCards, setReserveCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mode = searchParams.get('mode');
  const isCramMode = mode === 'cram';

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadCards = async () => {
      try {
        if (isCramMode) {
          const limit = parseInt(searchParams.get('limit') || '50', 10);
          const tag = searchParams.get('tag') || undefined;
          const cramCards = await getCramCards(limit, tag, settings.language);
          if (isMounted) {
            setSessionCards(cramCards);
            setReserveCards([]);
          }
        } else {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 15000)
          );

          const [due, reviewsToday] = await Promise.race([
            Promise.all([
              getDueCards(new Date(), settings.language),
              getTodayReviewStats(settings.language)
            ]),
            timeoutPromise
          ]) as [Card[], { newCards: number; reviewCards: number }];

          if (!isMounted) return;

          const dailyNewLimit = settings.dailyNewLimits?.[settings.language] ?? 20;
          const dailyReviewLimit = settings.dailyReviewLimits?.[settings.language] ?? 100;

          const active: Card[] = [];
          const reserve: Card[] = [];

          let newCount = reviewsToday.newCards || 0;
          let reviewCount = reviewsToday.reviewCards || 0;

          const hasLimit = (val: number) => val > 0;

          for (const card of due) {
            if (isNewCard(card)) {
              if (hasLimit(dailyNewLimit) && newCount >= dailyNewLimit) {
                reserve.push(card);
              } else {
                active.push(card);
                if (hasLimit(dailyNewLimit)) newCount++;
              }
            } else {
              if (hasLimit(dailyReviewLimit) && reviewCount >= dailyReviewLimit) {
                continue;
              }
              active.push(card);
              if (hasLimit(dailyReviewLimit)) reviewCount++;
            }
          }

          const sortedActive = sortCards(active, (settings.cardOrder as CardOrder) || 'newFirst');

          setSessionCards(sortedActive);
          setReserveCards(reserve);
        }
      } catch (err) {
        console.error("Failed to load cards", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load cards');
          toast.error('Failed to load study session. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCards();

    return () => {
      isMounted = false;
    };
  }, [settings.language, isCramMode, searchParams, settings.dailyNewLimits, settings.dailyReviewLimits]);

  const handleUpdateCard = (card: Card) => {
    if (isCramMode) {
      if (card.status === 'known') {
        updateCard(card, { silent: true });
      }
      return;
    }
    updateCard(card, { silent: true });
  };

  const handleDeleteCard = async (id: string) => {
    await deleteCard(id);
    // Note: Don't call setSessionCards here - it would trigger useStudySession's 
    // INIT effect and reset all learning progress. The removeCardFromSession 
    // function in StudySession handles the UI state update correctly.
  };

  const handleRecordReview = async (card: Card, newCard: Card, grade: Grade, xpPayload?: CardXpPayload) => {
    if (!isCramMode) {
      await recordReview(card, newCard, grade, xpPayload);
    }
  };

  const handleSessionComplete = () => {
    if (!isCramMode) {
      claimBonus.mutate();
    }
    navigate('/');
  };

  if (isLoading) {
    return <LoadingScreen title="Loading Session" subtitle="Preparing your cards..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-destructive text-xl">!</span>
          </div>
          <h2 className="text-lg font-medium">Failed to load study session</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            onClick={() => navigate('/')}
            size="default"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <StudySession
      dueCards={sessionCards}
      reserveCards={reserveCards}
      onUpdateCard={handleUpdateCard}
      onDeleteCard={handleDeleteCard}
      onRecordReview={handleRecordReview}
      onExit={() => navigate('/')}
      onComplete={handleSessionComplete}
      onUndo={isCramMode ? undefined : undoReview}
      canUndo={isCramMode ? false : canUndo}
      isCramMode={isCramMode}
      dailyStreak={stats?.streak ?? 0}
      onAddCard={addCard}
    />
  );
};

```

# src/services/studyLimits.ts

```typescript
import { Card, UserSettings } from '../types';
import { State } from 'ts-fsrs';

interface LimitOptions {
  dailyNewLimit?: number;
  dailyReviewLimit?: number;
  reviewsToday?: {
    newCards: number;
    reviewCards: number;
  };
}

export const isNewCard = (card: Card) => {

  if (card.status === 'new') return true;



  if (card.state !== undefined) {
    return card.state === State.New;
  }

  return (card.reps || 0) === 0;
};

const hasLimit = (value?: number) => typeof value === 'number' && value > 0;

export const applyStudyLimits = (cards: Card[], settings: LimitOptions): Card[] => {
  const { dailyNewLimit, dailyReviewLimit, reviewsToday } = settings;
  const limitedCards: Card[] = [];
  
  let newCount = reviewsToday?.newCards || 0;
  let reviewCount = reviewsToday?.reviewCards || 0;

  for (const card of cards) {
    const isNew = isNewCard(card);

    if (isNew) {
      if (hasLimit(dailyNewLimit)) {
        if (newCount >= (dailyNewLimit as number)) {
          continue;
        }
        newCount++;
        limitedCards.push(card);
      } else {
        limitedCards.push(card);
      }
    } else {

      if (hasLimit(dailyReviewLimit)) {
        if (reviewCount >= (dailyReviewLimit as number)) {
          continue;
        }
        reviewCount++;
        limitedCards.push(card);
      } else {
        limitedCards.push(card);
      }
    }
  }

  return limitedCards;
};

```

# src/stores/useDeckStore.ts

```typescript
import { create } from 'zustand';
import { Card, DeckStats, ReviewHistory } from '@/types';

interface StreakStats {
    currentStreak: number;
    longestStreak: number;
    totalReviews: number;
}

interface DeckState {
    streakStats: StreakStats;

    lastReview: { card: Card; date: string; xpEarned: number } | null;

    setStreakStats: (stats: StreakStats) => void;
    setLastReview: (review: { card: Card; date: string; xpEarned: number } | null) => void;
    clearLastReview: () => void;
}

export const useDeckStore = create<DeckState>((set) => ({
    streakStats: {
        currentStreak: 0,
        longestStreak: 0,
        totalReviews: 0,
    },
    lastReview: null,

    setStreakStats: (stats) => set({ streakStats: stats }),
    setLastReview: (review) => set({ lastReview: review }),
    clearLastReview: () => set({ lastReview: null }),
}));

```

# src/stores/useSettingsStore.ts

```typescript
import { create } from 'zustand';
import { UserSettings, Language, LanguageId } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';
import { UserApiKeys, updateUserSettings } from '@/db/repositories/settingsRepository';
import { toast } from 'sonner';

export const DEFAULT_SETTINGS: UserSettings = {
    language: LanguageId.Polish,
    languageColors: {
        [LanguageId.Polish]: '#dc2626',
        [LanguageId.Norwegian]: '#ef4444',
        [LanguageId.Japanese]: '#f87171',
        [LanguageId.Spanish]: '#fca5a5',
        [LanguageId.German]: '#facc15',
    },
    dailyNewLimits: {
        [LanguageId.Polish]: 20,
        [LanguageId.Norwegian]: 20,
        [LanguageId.Japanese]: 20,
        [LanguageId.Spanish]: 20,
        [LanguageId.German]: 20,
    },
    dailyReviewLimits: {
        [LanguageId.Polish]: 100,
        [LanguageId.Norwegian]: 100,
        [LanguageId.Japanese]: 100,
        [LanguageId.Spanish]: 100,
        [LanguageId.German]: 100,
    },
    autoPlayAudio: false,
    blindMode: false,
    showTranslationAfterFlip: true,
    showWholeSentenceOnFront: false,
    ignoreLearningStepsWhenNoCards: false,
    binaryRatingMode: false,
    cardOrder: 'newFirst',
    learningSteps: [1, 10], geminiApiKey: '',
    tts: {
        provider: 'browser',
        voiceURI: null,
        volume: 1.0,
        rate: 0.9,
        pitch: 1.0,
        googleApiKey: '',
        azureApiKey: '',
        azureRegion: 'eastus'
    },
    fsrs: {
        request_retention: FSRS_DEFAULTS.request_retention,
        maximum_interval: FSRS_DEFAULTS.maximum_interval,
        w: FSRS_DEFAULTS.w,
        enable_fuzzing: FSRS_DEFAULTS.enable_fuzzing,
    }
};

const getInitialSettings = (): UserSettings => {
    return DEFAULT_SETTINGS;
};

export interface SettingsState {
    settings: UserSettings;
    settingsLoading: boolean;
    updateSettings: (newSettings: Partial<UserSettings>) => void;
    resetSettings: () => void;
    setSettingsLoading: (loading: boolean) => void;
    setSettings: (settings: UserSettings | ((prev: UserSettings) => UserSettings)) => void;
    saveApiKeys: (userId: string, apiKeys: UserApiKeys) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: getInitialSettings(),
    settingsLoading: false,

    updateSettings: (newSettings) =>
        set((state) => ({
            settings: {
                ...state.settings,
                ...newSettings,
                fsrs: { ...state.settings.fsrs, ...(newSettings.fsrs || {}) },
                tts: { ...state.settings.tts, ...(newSettings.tts || {}) },
                languageColors: { ...state.settings.languageColors, ...((newSettings.languageColors || {}) as Record<Language, string>) },
                dailyNewLimits: { ...state.settings.dailyNewLimits, ...(newSettings.dailyNewLimits || {}) },
                dailyReviewLimits: { ...state.settings.dailyReviewLimits, ...(newSettings.dailyReviewLimits || {}) },
                learningSteps: newSettings.learningSteps || state.settings.learningSteps,
            },
        })),

    resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

    setSettingsLoading: (loading) => set({ settingsLoading: loading }),

    setSettings: (newSettings) =>
        set((state) => ({
            settings: typeof newSettings === 'function' ? newSettings(state.settings) : newSettings,
        })),

    saveApiKeys: async (userId, apiKeys) => {
        set({ settingsLoading: true });
        try {
            await updateUserSettings(userId, apiKeys);

            set((state) => ({
                settings: {
                    ...state.settings,
                    geminiApiKey: apiKeys.geminiApiKey || '',
                    tts: {
                        ...state.settings.tts,
                        googleApiKey: apiKeys.googleTtsApiKey || '',
                        azureApiKey: apiKeys.azureTtsApiKey || '',
                        azureRegion: apiKeys.azureRegion || 'eastus',
                    },
                },
            }));

            toast.success('API keys synced to cloud');
        } catch (error) {
            console.error('Failed to save API keys:', error);
            toast.error('Failed to sync API keys');
            throw error;
        } finally {
            set({ settingsLoading: false });
        }
    },
}));

```

# src/types/index.ts

```typescript
import { Card as FSRSCard, State as FSRSState } from 'ts-fsrs';

export type Difficulty = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CardStatus = 'new' | 'learning' | 'graduated' | 'known';

export interface Card extends Omit<Partial<FSRSCard>, 'due' | 'last_review'> {
  id: string;
  targetSentence: string;
  targetWord?: string;
  targetWordTranslation?: string;
  targetWordPartOfSpeech?: string;
  nativeTranslation: string;
  furigana?: string;
  gender?: string;
  grammaticalCase?: string;
  notes: string;
  tags?: string[];
  language?: Language;
  status: CardStatus;


  interval: number;
  easeFactor: number;
  dueDate: string;


  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reps?: number;
  lapses?: number;
  state?: FSRSState;
  due?: string;
  last_review?: string;
  first_review?: string;
  learningStep?: number;
  leechCount?: number;
  isLeech?: boolean;
  isBookmarked?: boolean;
  precise_interval?: number;
  user_id?: string; // Added for multi-user support
}

export type Grade = 'Again' | 'Hard' | 'Good' | 'Easy';

export type ReviewHistory = Record<string, number>;

export interface DeckStats {
  total: number;
  due: number;
  newDue: number;
  reviewDue: number;
  learned: number;
  streak: number;
  totalReviews: number;
  longestStreak: number;
}

import { Language } from './languages';
export type { Language } from './languages';
export { LanguageId, LANGUAGE_LABELS } from './languages';

export type TTSProvider = 'browser' | 'google' | 'azure';

export interface TTSSettings {
  provider: TTSProvider;
  voiceURI: string | null;
  volume: number;
  rate: number;
  pitch: number;
  googleApiKey?: string;
  azureApiKey?: string;
  azureRegion?: string;
}

export interface UserSettings {
  language: Language;
  languageColors?: Record<Language, string>;

  dailyNewLimits: Record<Language, number>;
  dailyReviewLimits: Record<Language, number>;
  autoPlayAudio: boolean;
  blindMode: boolean;
  showTranslationAfterFlip: boolean;
  showWholeSentenceOnFront?: boolean;
  ignoreLearningStepsWhenNoCards: boolean;
  binaryRatingMode: boolean;
  cardOrder: 'newFirst' | 'reviewFirst' | 'mixed';
  learningSteps: number[]; tts: TTSSettings;
  fsrs: {
    request_retention: number;
    maximum_interval: number;
    w?: number[];
    enable_fuzzing?: boolean;
  }
  geminiApiKey: string;
}

export interface ReviewLog {
  id: string;
  card_id: string;
  grade: number;
  state: number;
  elapsed_days: number;
  scheduled_days: number;
  stability: number;
  difficulty: number;
  created_at: string;
}

```

# src/types/languages.ts

```typescript
export const LanguageId = {
    Polish: 'polish',
    Norwegian: 'norwegian',
    Japanese: 'japanese',
    Spanish: 'spanish',
    German: 'german',
} as const;

export type Language = typeof LanguageId[keyof typeof LanguageId];

export const LANGUAGE_LABELS: Record<Language, string> = {
    [LanguageId.Polish]: 'Polish',
    [LanguageId.Norwegian]: 'Norwegian',
    [LanguageId.Japanese]: 'Japanese',
    [LanguageId.Spanish]: 'Spanish',
    [LanguageId.German]: 'German',
};

```

# src/types/multiplayer.ts

```typescript
export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface GameQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
}

export interface GameRoom {
  id: string;
  code: string;
  host_id: string;
  language: string;
  level: string;
  status: GameStatus;
  questions: GameQuestion[];
  current_question_index: number;
  timer_duration: number;
  max_players: number;
}

export interface GamePlayer {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  score: number;
  is_ready: boolean;
}


```

# src/utils/formatInterval.ts

```typescript
export const formatInterval = (diffMs: number): string => {
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return '<1m';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 30) return `${days}d`;
    if (months < 12) return `${months}mo`;
    return `${years}y`;
};

```

# src/utils/jsonParser.ts

```typescript
export const repairJSON = (jsonString: string): string => {
    let cleaned = jsonString.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, '$1');

    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let start = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
        start = Math.min(firstBrace, firstBracket);
    } else {
        start = Math.max(firstBrace, firstBracket);
    }

    if (start !== -1) {
        cleaned = cleaned.substring(start);
    }

    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);

    if (end !== -1) {
        cleaned = cleaned.substring(0, end + 1);
    }

    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');


    return cleaned;
};

export const parseAIJSON = <T>(jsonString: string): T => {
    const repaired = repairJSON(jsonString);
    try {
        return JSON.parse(repaired) as T;
    } catch (e) {
        console.error("JSON Parse Error on:", jsonString, "\nRepaired:", repaired);
        throw new Error("Failed to parse AI output.");
    }
};

```

# src/vite-env.d.ts

```typescript

declare const __APP_VERSION__: string;

```

# src/vitest.setup.ts

```typescript
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

type SpeechWindow = typeof window & {
  SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
};

class MockSpeechSynthesisUtterance {
  text: string;
  lang?: string;
  constructor(text: string) {
    this.text = text;
  }
}

if (typeof window !== 'undefined') {
  const globalWindow = window as SpeechWindow;
  const speechSynthesisMock = {
    getVoices: vi.fn(() => []),
    speak: vi.fn(),
    cancel: vi.fn(),
    onvoiceschanged: null as SpeechSynthesis['onvoiceschanged'],
  };

  Object.defineProperty(globalWindow, 'speechSynthesis', {
    value: speechSynthesisMock,
    writable: true,
  });

  if (!globalWindow.SpeechSynthesisUtterance) {
    globalWindow.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance;
  }

  Object.defineProperty(globalWindow, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), 
      removeListener: vi.fn(), 
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

```

# src/workers/fsrs.worker.ts

```typescript
import { ReviewLog } from '@/types';
import { computeCardLoss } from '@/lib/fsrsShared';

const optimizeFSRS = async (
  allLogs: ReviewLog[],
  currentW: number[],
  onProgress: (progress: number) => void
): Promise<number[]> => {
  const cardHistory: Record<string, ReviewLog[]> = {};
  allLogs.forEach(log => {
    if (!cardHistory[log.card_id]) cardHistory[log.card_id] = [];
    cardHistory[log.card_id].push(log);
  });

  const cardGroups = Object.values(cardHistory);

  if (cardGroups.length < 5) {
    throw new Error("Insufficient history (need 5+ cards with reviews)");
  }

  let w = [...currentW];
  const learningRate = 0.002;
  const iterations = 500;
  const batchSize = Math.min(cardGroups.length, 64);
  const targetIndices = [0, 1, 2, 3, 8, 9, 10, 11, 12];

  for (let iter = 0; iter < iterations; iter++) {
    const gradients = new Array(19).fill(0);
    let totalLoss = 0;

    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      batch.push(cardGroups[Math.floor(Math.random() * cardGroups.length)]);
    }

    const h = 0.0001;

    for (const logs of batch) {
      totalLoss += computeCardLoss(logs, w);
    }

    for (const idx of targetIndices) {
      const wPlus = [...w];
      wPlus[idx] += h;

      let lossPlus = 0;
      for (const logs of batch) {
        lossPlus += computeCardLoss(logs, wPlus);
      }

      gradients[idx] = (lossPlus - totalLoss) / h;
    }

    for (const idx of targetIndices) {
      w[idx] -= learningRate * gradients[idx];
      if (w[idx] < 0.01) w[idx] = 0.01;
    }

    if (iter % 20 === 0) {
      onProgress((iter / iterations) * 100);
    }
  }

  onProgress(100);
  return w;
};

self.onmessage = async (e: MessageEvent) => {
  const { logs, currentW } = e.data;
  try {
    const optimizedW = await optimizeFSRS(logs, currentW, (progress) => {
      self.postMessage({ type: 'progress', progress });
    });
    self.postMessage({ type: 'result', w: optimizedW });
  } catch (error) {
    self.postMessage({ type: 'error', error: (error as Error).message });
  }
};


```

# vite.config.ts

```typescript
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { version } from './package.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    define: {
      '__APP_VERSION__': JSON.stringify(version),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/],
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React - changes rarely
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Radix UI components - changes rarely  
            'vendor-radix': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-switch',
              '@radix-ui/react-slider',
              '@radix-ui/react-progress',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-separator',
              '@radix-ui/react-toggle',
              '@radix-ui/react-label',
              '@radix-ui/react-slot',
            ],
            // Charts - large, only needed on dashboard
            'vendor-charts': ['recharts'],
            // Database layer - core functionality
            'vendor-db': ['dexie', 'dexie-react-hooks', 'idb'],
            // Animations - used throughout but can load async
            'vendor-motion': ['framer-motion'],
            // Icons - used everywhere
            'vendor-icons': ['lucide-react'],
            // Form handling
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            // Spaced repetition algorithm
            'vendor-srs': ['ts-fsrs'],
            // Data utilities
            'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'uuid'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/vitest.setup.ts',
      coverage: {
        reporter: ['text', 'lcov'],
        include: [
          'src/services/**/*.ts',
          'src/components/**/*.tsx',
          'src/contexts/**/*.tsx',
          'src/routes/**/*.tsx'
        ]
      }
    }
  };
});
```

