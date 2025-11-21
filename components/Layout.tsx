import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GraduationCap, 
  PlusCircle, 
  Zap, 
  List as ListIcon, 
  Settings, 
  Upload, 
  Database 
} from 'lucide-react';
import { useDeck } from '../contexts/DeckContext';
import { AddCardModal } from './AddCardModal';
import { SettingsModal } from './SettingsModal';
import { CramModal } from './CramModal';
import { db } from '../services/db';
import { Card } from '../types';

// Assuming __APP_VERSION__ is defined in vite config define
declare const __APP_VERSION__: string;

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { stats, addCard, dataVersion } = useDeck();
  const location = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCramModalOpen, setIsCramModalOpen] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    const fetchCards = async () => {
      const loadedCards = await db.getCards();
      setCards(loadedCards);
    };
    fetchCards();
  }, [dataVersion]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    cards.forEach(card => {
      if (card.tags) {
        card.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [cards]);
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', action: undefined },
    { icon: GraduationCap, label: 'Study', path: '/study', action: undefined },
    { icon: PlusCircle, label: 'Add Card', path: '#', action: () => setIsAddModalOpen(true) },
    { icon: Zap, label: 'Cram Mode', path: '#', action: () => setIsCramModalOpen(true) },
    { icon: ListIcon, label: 'Cards List', path: '/cards', action: undefined },
    { icon: Settings, label: 'Settings', path: '#', action: () => setIsSettingsOpen(true) },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 font-sans flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col fixed h-full z-40 transition-colors duration-300">
        <div className="p-6 flex items-center gap-3">
            <div className="p-2 bg-gray-900 dark:bg-gray-50 rounded-md text-white dark:text-gray-900">
                <Database size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-gray-50">PolskiMine</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path && !item.action;
                
                if (item.action) {
                    return (
                        <button
                            key={item.label}
                            onClick={item.action}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                            <item.icon size={18} strokeWidth={2} />
                            {item.label}
                        </button>
                    );
                }

                return (
                    <Link
                        key={item.label}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            isActive 
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        <item.icon size={18} strokeWidth={2} />
                        {item.label}
                    </Link>
                );
            })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors w-full"
            >
                <Upload size={18} />
                Import/Export Data
            </button>
            <div className="mt-4 px-3 text-[10px] font-mono text-gray-400 dark:text-gray-600">
                v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'DEV'}
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-56 w-full min-h-screen flex flex-col">
        <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
            {children}
        </div>
      </main>

      {/* Global Modals */}
      <AddCardModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addCard}
      />
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <CramModal 
        isOpen={isCramModalOpen} 
        onClose={() => setIsCramModalOpen(false)} 
        tags={uniqueTags} 
      />
    </div>
  );
};
