import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { AddCardModal } from '../components/AddCardModal';
import { useDeck } from '../contexts/DeckContext';

export const DashboardRoute: React.FC = () => {
  const { cards, history, stats, addCard, deleteCard } = useDeck();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <>
      <Dashboard 
        cards={cards}
        stats={stats}
        history={history}
        onStartSession={() => navigate('/study')}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onDeleteCard={deleteCard}
      />
      <AddCardModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addCard}
      />
    </>
  );
};
