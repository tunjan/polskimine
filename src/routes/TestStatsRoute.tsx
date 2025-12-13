import React, { useEffect, useState } from "react";
import { db } from "@/db/dexie";
import { Card } from "@/types";

export const TestStatsRoute: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      
      const ankiCards = await db.cards
        .where("language")
        .equals("German")
        .toArray();
      
      
      const nids = ankiCards.map(c => c.nid);
      const notes = await db.notes.where("id").anyOf(nids).toArray();
      const noteMap = new Map(notes.map(n => [n.id, n]));
      
      
      const fullCards: Card[] = ankiCards.map(ac => {
        const note = noteMap.get(ac.nid);
        const fields = note?.flds.split('\x1f') || ['', '', ''];
        
        return {
          id: ac.id.toString(),
          targetSentence: fields[0] || '',
          nativeTranslation: fields[1] || '',
          notes: fields[2] || '',
          language: (ac.language || 'German') as any,
          type: ac.type,
          queue: ac.queue,
          due: ac.due,
          last_modified: ac.mod * 1000,
          left: ac.left,
          interval: ac.ivl,
          easeFactor: ac.factor,
          stability: ac.stability,
          difficulty: ac.difficulty,
          elapsed_days: ac.elapsed_days,
          scheduled_days: ac.scheduled_days,
          reps: ac.reps,
          lapses: ac.lapses,
          state: ac.state,
          isBookmarked: ac.isBookmarked,
          isLeech: ac.isLeech,
          user_id: ac.user_id,
        } as Card;
      });
      
      setCards(fullCards);
      setLoading(false);
    };
    fetchCards();
  }, []);

  if (loading) return <div>Loading debug data...</div>;

  const byType = cards.reduce(
    (acc, card) => {
      const t = card.type;
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const masteredCandidates = cards.filter(
    (c) =>
      c.type === 2 && c.interval >= 21   );

  return (
    <div className="p-8 font-mono text-sm max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug: German Deck Stats</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Summary Counts (by Type)</h2>
        <pre>{JSON.stringify(byType, null, 2)}</pre>
        <div className="mt-2 text-blue-600 font-bold">
          Mastered Count (Calc): {masteredCandidates.length}
        </div>
      </div>

      {masteredCandidates.length > 0 && (
        <div>
          <h2 className="font-bold mb-2">First 5 "Mastered" Cards</h2>
          <div className="space-y-4">
            {masteredCandidates.slice(0, 5).map((card) => (
              <div key={card.id} className="border p-2 rounded">
                <div>ID: {card.id}</div>
                <div>Front: {card.targetSentence}</div>
                <div>Back: {card.nativeTranslation}</div>
                <div>Type: {card.type}</div>
                <div>Interval: {card.interval}</div>
                <div>UserID: {card.user_id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cards.length === 0 && (
        <div className="text-red-500 font-bold">
          No cards found with language="German"
        </div>
      )}
    </div>
  );
};
