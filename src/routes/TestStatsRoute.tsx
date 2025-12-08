import React, { useEffect, useState } from 'react';
import { db } from '@/db/dexie';
import { Card } from '@/types';

export const TestStatsRoute: React.FC = () => {
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCards = async () => {
                                    const germanCards = await db.cards.where('language').equals('German').toArray();
            setCards(germanCards);
            setLoading(false);
        };
        fetchCards();
    }, []);

    if (loading) return <div>Loading debug data...</div>;

    const byStatus = cards.reduce((acc, card) => {
        acc[card.status] = (acc[card.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const masteredCandidates = cards.filter(c => 
        c.status === 'known' || (c.status === 'graduated' && c.interval >= 180)
    );

    return (
        <div className="p-8 font-mono text-sm max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Debug: German Deck Stats</h1>
            
            <div className="mb-6 p-4 bg-gray-100 rounded">
                <h2 className="font-bold mb-2">Summary Counts</h2>
                <pre>{JSON.stringify(byStatus, null, 2)}</pre>
                <div className="mt-2 text-blue-600 font-bold">
                    Mastered Count (Calc): {masteredCandidates.length}
                </div>
            </div>

            {masteredCandidates.length > 0 && (
                <div>
                    <h2 className="font-bold mb-2">First 5 "Mastered" Cards</h2>
                    <div className="space-y-4">
                        {masteredCandidates.slice(0, 5).map(card => (
                            <div key={card.id} className="border p-2 rounded">
                                <div>ID: {card.id}</div>
                                <div>Front: {card.targetSentence}</div>
                                <div>Back: {card.nativeTranslation}</div>
                                <div>Status: {card.status}</div>
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
