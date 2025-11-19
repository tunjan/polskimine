import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { AddCardModal } from '../components/AddCardModal';
import { SettingsModal } from '../components/SettingsModal';
import { useDeck } from '../contexts/DeckContext';
import { db } from '../services/db';
import { Card } from '../types';

export const DashboardRoute: React.FC = () => {
  const { history, stats, addCard, deleteCard, updateCard, dataVersion } = useDeck();
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

  return (
    <>
      <Dashboard 
        cards={cards}
        stats={stats}
        history={history}
        onStartSession={() => navigate('/study')}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onDeleteCard={deleteCard}
        onAddCard={addCard}
        onEditCard={handleEditCard}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onMarkKnown={handleMarkKnown}
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
