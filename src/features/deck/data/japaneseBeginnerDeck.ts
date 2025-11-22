import { Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const createCard = (sentence: string, translation: string, targetWord?: string, notes: string = '', furigana?: string): Card => ({
  id: uuidv4(),
  targetSentence: sentence,
  targetWord,
  nativeTranslation: translation,
  notes,
  furigana,
  status: 'new',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language: 'japanese'
});

export const JAPANESE_BEGINNER_DECK: Card[] = [
  // --- GREETINGS & SELF INTRO ---
  createCard("はじめまして、田中です。", "Nice to meet you, I am Tanaka.", "はじめまして", "", "はじめまして、 田中[たなか]です。"),
  createCard("よろしくお願いします。", "Please treat me well.", "願い", "Set phrase for introductions.", "よろしくお 願[ねが]いします。"),
  createCard("お元気ですか？", "How are you?", "元気", "", "お 元気[げんき]ですか？"),
  createCard("英語を話せますか？", "Can you speak English?", "話せます", "Potential form.", "英語[えいご]を 話[はな]せますか？"),
  createCard("日本語が少し分かります。", "I understand a little Japanese.", "分かります", "", "日本語[にほんご]が 少[すこ]し 分[わ]かります。"),

  // --- PARTICLES & BASICS (Wa, Desu) ---
  createCard("これは何ですか？", "What is this?", "何", "", "これは 何[なん]ですか？"),
  createCard("それは私のペンです。", "That is my pen.", "私", "", "それは 私[わたし]のペンです。"),
  createCard("トイレはどこですか？", "Where is the toilet?", "どこ", "", "トイレはどこですか？"),
  createCard("駅はあそこです。", "The station is over there.", "駅", "", "駅[えき]はあそこです。"),
  
  // --- VERBS (Masu Form) & OBJECTS (Wo) ---
  createCard("私は寿司を食べます。", "I eat sushi.", "食べます", "", "私[わたし]は 寿司[すし]を 食[た]べます。"),
  createCard("何を飲みますか？", "What will you drink?", "飲みます", "", "何[なに]を 飲[の]みますか？"),
  createCard("毎日、日本語を勉強します。", "I study Japanese every day.", "勉強", "", "毎日[まいにち]、 日本語[にほんご]を 勉強[べんきょう]します。"),
  createCard("テレビを見ました。", "I watched TV.", "見ました", "Past tense.", "テレビを 見[み]ました。"),

  // --- MOVEMENT (Ni/E) & TIME ---
  createCard("明日、東京に行きます。", "I will go to Tokyo tomorrow.", "行きます", "", "明日[あした]、 東京[とうきょう]に 行[い]きます。"),
  createCard("何時に帰りますか？", "What time will you go home?", "帰り", "", "何時[なんじ]に 帰[かえ]りますか？"),
  createCard("友達と来ました。", "I came with a friend.", "来ました", "", "友達[ともだち]と 来[き]ました。"),
  
  // --- EXISTENCE (Iru/Aru) ---
  createCard("猫がいます。", "There is a cat.", "います", "Used for living things.", "猫[ねこ]がいます。"),
  createCard("お金がありません。", "I don't have money.", "ありません", "Negative existence (inanimate).", "お 金[かね]がありません。"),
  createCard("コンビニがありますか？", "Is there a convenience store?", "あります", "", "コンビニがありますか？"),

  // --- ADJECTIVES ---
  createCard("このラーメンは美味しいです。", "This ramen is delicious.", "美味しい", "", "このラーメンは 美味[おい]しいです。"),
  createCard("今日は暑いですね。", "It is hot today, isn't it?", "暑い", "", "今日[きょう]は 暑[あつ]いですね。"),
  createCard("日本の夏は蒸し暑いです。", "Japanese summers are humid.", "蒸し暑い", "", "日本[にほん]の 夏[なつ]は 蒸[む]し 暑[あつ]いです。"),
  createCard("それは面白そうですね。", "That looks interesting.", "面白", "", "それは 面白[おもしろ]そうですね。"),

  // --- REQUESTS ---
  createCard("これをください。", "Please give me this.", "ください", "", "これをください。"),
  createCard("ちょっと待ってください。", "Please wait a moment.", "待って", "Te-form + kudasai.", "ちょっと 待[ま]ってください。"),
  createCard("もう一度言ってください。", "Please say it one more time.", "言って", "", "もう 一度[いちど] 言[い]ってください。"),
  createCard("手伝ってもらえますか？", "Could you help me?", "手伝って", "", "手伝[てつだ]ってもらえますか？"),
];
