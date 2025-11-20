import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { AddCardModal } from '../components/AddCardModal';
import { SettingsModal } from '../components/SettingsModal';
import { useDeck } from '../contexts/DeckContext';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../services/db';
import { Card } from '../types';
import { isCardDue } from '../services/srs';
import { applyStudyLimits } from '../services/studyLimits';

export const DashboardRoute: React.FC = () => {
  const { history, stats, reviewsToday, addCard, deleteCard, updateCard, dataVersion } = useDeck();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | undefined>(undefined);
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    const fetchCards = async () => {
      const loadedCards = await db.getCards();
      setCards(loadedCards);
    };
    fetchCards();
  }, [dataVersion]);

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingCard(undefined);
  };

  const handleMarkKnown = (card: Card) => {
    const updatedCard = { ...card, status: 'known' as const };
    updateCard(updatedCard);
  };

  const dueCards = cards.filter(card => isCardDue(card));
  const limitedCards = applyStudyLimits(dueCards, { ...settings, reviewsToday });
  const dueCardIds = useMemo(() => new Set(limitedCards.map(c => c.id)), [limitedCards]);
  
  const effectiveStats = {
    ...stats,
    due: limitedCards.length
  };

  return (
    <>
      <Dashboard 
        cards={cards}
        stats={effectiveStats}
        history={history}
        onStartSession={() => navigate('/study')}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onDeleteCard={deleteCard}
        onAddCard={addCard}
        onEditCard={handleEditCard}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onMarkKnown={handleMarkKnown}
        dueCardIds={dueCardIds}
      />
      <AddCardModal 
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onAdd={addCard}
        initialCard={editingCard}
      />
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
