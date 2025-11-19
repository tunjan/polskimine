import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { AddCardModal } from '../components/AddCardModal';
import { useDeck } from '../contexts/DeckContext';
import { db } from '../services/db';
import { Card } from '../types';

export const DashboardRoute: React.FC = () => {
  const { history, stats, addCard, deleteCard, dataVersion } = useDeck();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
      />
      <AddCardModal 
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onAdd={addCard}
        initialCard={editingCard}
      />
    </>
  );
};
