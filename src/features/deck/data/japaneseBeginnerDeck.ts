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

  createCard("おはようございます。", "Good morning.", undefined, "Formal greeting used in the morning.", "おはようございます。"),
  createCard("こんにちは。", "Hello / Good afternoon.", undefined, "Used during the day.", "こんにちは。"),
  createCard("こんばんは。", "Good evening.", undefined, "Used in the evening.", "こんばんは。"),
  createCard("おやすみなさい。", "Good night.", undefined, "Used before going to sleep.", "おやすみなさい。"),
  createCard("ありがとうございます。", "Thank you.", undefined, "Formal.", "ありがとうございます。"),
  createCard("すみません。", "Excuse me / I'm sorry.", undefined, "", "すみません。"),
  createCard("はい。", "Yes.", undefined, "", "はい。"),
  createCard("いいえ。", "No.", undefined, "", "いいえ。"),


  createCard("はじめまして。", "Nice to meet you.", undefined, "Used when meeting someone for the first time.", "はじめまして。"),
  createCard("私の名前は田中です。", "My name is Tanaka.", "名前", "", "私[わたし]の 名前[なまえ]は 田中[たなか]です。"),
  createCard("よろしくお願いします。", "Please treat me well / Nice to meet you.", undefined, "Standard phrase used at the end of an introduction.", "よろしくお 願[ねが]いします。"),
  createCard("お元気ですか？", "How are you?", "元気", "", "お 元気[げんき]ですか？"),
  createCard("元気です。", "I am fine.", "元気", "", "元気[げんき]です。"),


  createCard("私は学生です。", "I am a student.", "学生", "", "私[わたし]は 学生[がくせい]です。"),
  createCard("これはペンです。", "This is a pen.", "これ", "", "これはペンです。"),
  createCard("日本語を勉強しています。", "I am studying Japanese.", "勉強", "", "日本語[にほんご]を 勉強[べんきょう]しています。"),
  createCard("分かりません。", "I don't understand.", "分かりません", "", "分[わ]かりません。"),
  createCard("もう一度お願いします。", "Once more, please.", "一度", "", "もう 一度[いちど]お 願[ねが]いします。"),


  createCard("水をください。", "Water, please.", "水", "", "水[みず]をください。"),
  createCard("いただきます。", "Thank you for the meal (before eating).", undefined, "", "いただきます。"),
  createCard("ごちそうさまでした。", "Thank you for the meal (after eating).", undefined, "", "ごちそうさまでした。"),
  createCard("美味しいです。", "It is delicious.", "美味しい", "", "美味[おい]しいです。"),


  createCard("一、二、三。", "One, two, three.", undefined, "", "一[いち]、 二[に]、 三[さん]。"),
  createCard("いくらですか？", "How much is it?", "いくら", "", "いくらですか？"),


  createCard("トイレはどこですか？", "Where is the toilet?", "トイレ", "", "トイレはどこですか？"),
  createCard("駅はどこですか？", "Where is the station?", "駅", "", "駅[えき]はどこですか？"),
];