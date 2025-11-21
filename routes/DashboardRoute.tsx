import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { useDeck } from '../contexts/DeckContext';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../services/db';
import { Card } from '../types';
import { isCardDue } from '../services/srs';
import { applyStudyLimits } from '../services/studyLimits';

export const DashboardRoute: React.FC = () => {
  const { history, stats, reviewsToday, dataVersion } = useDeck();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    const fetchCards = async () => {
      const loadedCards = await db.getCards();
      setCards(loadedCards);
    };
    fetchCards();
  }, [dataVersion]);

  const dueCards = cards.filter(card => isCardDue(card));
  const limitedCards = applyStudyLimits(dueCards, { ...settings, reviewsToday });
  
  const effectiveStats = {
    ...stats,
    due: limitedCards.length
  };

  return (
    <Dashboard 
      cards={cards}
      stats={effectiveStats}
      history={history}
      onStartSession={() => navigate('/study')}
    />
  );
};
