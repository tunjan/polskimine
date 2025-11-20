
## App.tsx
\`\`\`typescript
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DeckProvider } from './contexts/DeckContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { DashboardRoute } from './routes/DashboardRoute';
import { StudyRoute } from './routes/StudyRoute';

const PolskiMineApp: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardRoute />} />
          <Route path="/study" element={<StudyRoute />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="polskimine-theme">
      <SettingsProvider>
        <DeckProvider>
          <PolskiMineApp />
          <Toaster position="bottom-right" />
        </DeckProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default App;\`\`\`

## components/AddCardModal.tsx
\`\`\`typescript
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { aiService } from '../services/ai';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: Card) => void;
  initialCard?: Card;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAdd, initialCard }) => {
  const [form, setForm] = useState({
    sentence: '',
    targetWord: '',
    translation: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const targetMismatch = Boolean(
    form.targetWord && form.sentence &&
    !form.sentence.toLowerCase().includes(form.targetWord.toLowerCase())
  );

  const previewSentence = useMemo(() => {
    if (!form.sentence) return null;
    if (!form.targetWord) return <span>{form.sentence}</span>;

    const regex = new RegExp(`(${escapeRegExp(form.targetWord)})`, 'gi');
    const parts = form.sentence.split(regex);

    return (
      <>
        {parts.map((part, idx) =>
          part.toLowerCase() === form.targetWord.toLowerCase() ? (
            <mark
              key={`${part}-${idx}`}
              className="bg-amber-100 text-amber-900 px-0.5 rounded-sm"
            >
              {part}
            </mark>
          ) : (
            <span key={`${part}-${idx}`}>{part}</span>
          )
        )}
      </>
    );
  }, [form.sentence, form.targetWord]);

  useEffect(() => {
    if (isOpen && initialCard) {
      setForm({
        sentence: initialCard.targetSentence,
        targetWord: initialCard.targetWord || '',
        translation: initialCard.nativeTranslation,
        notes: initialCard.notes
      });
    } else if (isOpen && !initialCard) {
      setForm({
        sentence: '',
        targetWord: '',
        translation: '',
        notes: ''
      });
    }
  }, [isOpen, initialCard]);

  // Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);
    
    // Initial focus
    const firstInput = modalRef.current?.querySelector('input');
    if (firstInput) (firstInput as HTMLElement).focus();

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAutoFill = async () => {
    if (!form.sentence) {
        setError('Please enter a sentence first to generate details.');
        return;
    }
    setIsGenerating(true);
    try {
        const result = await aiService.generateCardContent(form.sentence);
        setForm(prev => ({
            ...prev,
            translation: result.translation,
            notes: result.notes
        }));
        toast.success("Auto-filled successfully!");
    } catch (e) {
        console.error(e);
        toast.error("Failed to auto-fill. Check API key.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Only validate containment if a target word is actually provided
    if (form.targetWord) {
      const sentenceLower = form.sentence.toLowerCase();
      const targetLower = form.targetWord.toLowerCase();
      
      // Check if the target word exists in the sentence (case-insensitive)
      if (!sentenceLower.includes(targetLower)) {
         setError('Target word provided but not found in sentence.');
         return;
      }
    }
    
    if (!form.sentence || !form.translation) {
      setError('Sentence and Translation are required.');
      return;
    }

    const newCard: Card = {
      id: initialCard ? initialCard.id : uuidv4(),
      targetSentence: form.sentence,
      targetWord: form.targetWord || undefined, // Store as undefined if empty string
      nativeTranslation: form.translation,
      notes: form.notes,
      status: initialCard ? initialCard.status : 'new',
      interval: initialCard ? initialCard.interval : 0,
      easeFactor: initialCard ? initialCard.easeFactor : 2.5,
      dueDate: initialCard ? initialCard.dueDate : new Date().toISOString(),
    };

    onAdd(newCard);
    setForm({ sentence: '', targetWord: '', translation: '', notes: '' });
    onClose();
  };

  const inputClass = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 p-4" role="dialog" aria-modal="true">
      <div ref={modalRef} className="bg-white border border-gray-200 rounded-md shadow-sm w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-900">{initialCard ? 'Edit Entry' : 'New Entry'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-2 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-sm">
              {error}
            </div>
          )}
          
          <div>
            <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-mono text-gray-500 uppercase">Polish Sentence <span className="text-red-500">*</span></label>
                <button 
                    type="button"
                    onClick={handleAutoFill}
                    disabled={isGenerating}
                  className="text-[10px] flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium transition-colors disabled:opacity-50"
                  aria-live="polite"
                >
                  {isGenerating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  {isGenerating ? 'Mining...' : 'Auto-Fill'}
                </button>
            </div>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g., Ten samochód jest szybki"
              value={form.sentence}
              onChange={e => setForm({...form, sentence: e.target.value})}
              autoFocus
            />
            {form.sentence && (
              <div className="mt-2 rounded-md border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <p className="font-mono leading-snug">
                  {previewSentence}
                </p>
                {form.targetWord && (
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">Highlight preview</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-500 uppercase mb-1.5">Target Word <span className="text-gray-300 font-normal">(Opt)</span></label>
              <input
                type="text"
                className={inputClass}
                placeholder="Highlight word"
                value={form.targetWord}
                onChange={e => setForm({...form, targetWord: e.target.value})}
              />
              {targetMismatch && (
                <p className="mt-1 text-[11px] text-amber-600">Highlight word not found in sentence yet.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-500 uppercase mb-1.5">Translation <span className="text-red-500">*</span></label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g., car"
                value={form.translation}
                onChange={e => setForm({...form, translation: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-500 uppercase mb-1.5">Notes</label>
            <textarea
              className={inputClass}
              rows={2}
              placeholder="Context, grammar, case..."
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Save Card</Button>
          </div>
        </form>
      </div>
    </div>
  );
};\`\`\`

## components/CramModal.tsx
\`\`\`typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { X } from 'lucide-react';

interface CramModalProps {
    isOpen: boolean;
    onClose: () => void;
    tags: string[];
}

export const CramModal = ({ isOpen, onClose, tags }: CramModalProps) => {
    const [selectedTag, setSelectedTag] = useState<string>('');
    const [limit, setLimit] = useState(50);
    const navigate = useNavigate();

    const handleStart = () => {
        const params = new URLSearchParams();
        params.set('mode', 'cram');
        if (selectedTag) params.set('tag', selectedTag);
        params.set('limit', limit.toString());
        navigate(`/study?${params.toString()}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Custom Cram Session</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Tag</label>
                        <select 
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedTag}
                            onChange={e => setSelectedTag(e.target.value)}
                        >
                            <option value="">All Cards</option>
                            {tags.map((t: string) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Card Limit</label>
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{limit} cards</span>
                        </div>
                        <input 
                            type="range" min="10" max="200" step="10" 
                            value={limit} onChange={e => setLimit(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                        />
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-lg text-sm border border-amber-100 dark:border-amber-900/50">
                        Note: Cram session reviews do not update your SRS schedule. This is for extra practice only.
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleStart}>Start Cramming</Button>
                </div>
            </div>
        </div>
    );
}
\`\`\`

## components/Dashboard.tsx
\`\`\`typescript
import React, { useState, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import { Card, DeckStats, ReviewHistory, CardStatus } from '../types';
import { Button } from './ui/Button';
import { Play, Plus, Trash2, Search, CheckCircle2, Pencil, Settings, Sun, Moon, Monitor, BarChart3, LayoutList, Clock, Flame, Layers, Zap } from 'lucide-react';
import { isCardDue } from '../services/srs';
import { Heatmap } from './Heatmap';
import { RetentionStats } from './RetentionStats';
import { List } from 'react-window';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';
import { CramModal } from './CramModal';

interface DashboardProps {
  cards: Card[];
  stats: DeckStats;
  history: ReviewHistory;
  onStartSession: () => void;
  onOpenAddModal: () => void;
  onDeleteCard: (id: string) => void;
  onAddCard?: (card: Card) => void;
  onEditCard: (card: Card) => void;
  onOpenSettings: () => void;
  onMarkKnown: (card: Card) => void;
  dueCardIds?: Set<string>;
}

interface RowData {
  cards: Card[];
  onDeleteCard: (id: string) => void;
  onEditCard: (card: Card) => void;
  onMarkKnown: (card: Card) => void;
  dueCardIds?: Set<string>;
}

interface RowProps extends RowData {
  index: number;
  style: React.CSSProperties;
}

const Row = ({ index, style, cards, onDeleteCard, onEditCard, onMarkKnown, dueCardIds }: RowProps) => {
  const card = cards[index];
  const isDue = dueCardIds ? dueCardIds.has(card.id) : isCardDue(card);
  const isKnown = card.status === 'known';
  
  const statusColor = {
    new: 'bg-blue-500 dark:bg-blue-400',
    learning: 'bg-amber-500 dark:bg-amber-400',
    graduated: 'bg-emerald-500 dark:bg-emerald-400',
    known: 'bg-gray-300 dark:bg-gray-600',
  };

  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return (
    <div
      style={style}
      className="group flex items-center border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors px-4"
    >
      <div className="w-4 mr-3 flex justify-center">
        <div className={clsx("w-2 h-2 rounded-full ring-2 ring-opacity-20 dark:ring-opacity-20", statusColor[card.status], card.status === 'new' ? 'ring-blue-500' : card.status === 'learning' ? 'ring-amber-500' : card.status === 'graduated' ? 'ring-emerald-500' : 'ring-gray-400')} />
      </div>
      
      <div className="flex-1 py-3 min-w-0 grid gap-0.5">
          <div className="flex items-baseline gap-2">
              <span className={clsx("font-medium truncate transition-colors text-sm", isKnown ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100')}>
              {card.targetWord ? (
                  card.targetSentence.split(new RegExp(`\\b(${escapeRegExp(card.targetWord)})\\b`, 'gi')).map((part, i) => 
                  part.toLowerCase() === card.targetWord!.toLowerCase()
                  ? <span key={i} className="font-bold text-gray-900 dark:text-white">{part}</span>
                  : <span key={i}>{part}</span>
                  )
              ) : (
                  card.targetSentence
              )}
              </span>
          </div>
          <span className="text-gray-400 dark:text-gray-500 text-xs truncate">{card.nativeTranslation}</span>
      </div>

      <div className="w-24 text-right text-xs font-medium text-gray-400 dark:text-gray-500">
        {isDue ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                Due
            </span>
        ) : (
            <span>{new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        )}
      </div>

      <div className="w-24 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isKnown && (
            <button 
                onClick={(e) => { e.stopPropagation(); onMarkKnown(card); }}
                className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                title="Mark as Known"
            >
                <CheckCircle2 size={14} />
            </button>
          )}
          <button 
              onClick={(e) => { e.stopPropagation(); onEditCard(card); }}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Edit"
          >
              <Pencil size={14} />
          </button>
          <button 
              onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete"
          >
              <Trash2 size={14} />
          </button>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  cards, 
  stats, 
  history,
  onStartSession, 
  onOpenAddModal,
  onDeleteCard,
  onAddCard,
  onEditCard,
  onOpenSettings,
  onMarkKnown,
  dueCardIds
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CardStatus>('all');
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  const [isCramModalOpen, setIsCramModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    cards.forEach(card => {
      if (card.tags) {
        card.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [cards]);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handleDeleteWithUndo = (id: string) => {
    const cardToDelete = cards.find(c => c.id === id);
    if (!cardToDelete) return;

    onDeleteCard(id);

    toast.success('Card deleted', {
        action: onAddCard ? {
            label: 'Undo',
            onClick: () => onAddCard(cardToDelete)
        } : undefined,
        duration: 4000,
    });
  };

  const filteredCards = useMemo(() => cards
    .filter(c =>
      c.targetSentence.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nativeTranslation.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(c => (statusFilter === 'all' ? true : c.status === statusFilter))
  , [cards, searchTerm, statusFilter]);

  const itemData = useMemo(() => ({
    cards: filteredCards,
    onDeleteCard: handleDeleteWithUndo,
    onEditCard,
    onMarkKnown,
    dueCardIds
  }), [filteredCards, onDeleteCard, onAddCard, onEditCard, onMarkKnown, dueCardIds]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
             <Button 
              variant="secondary" 
              onClick={onOpenAddModal}
              className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <Plus size={16} className="mr-2"/> Add Card
            </Button>
            <Button
              variant={stats.due > 0 ? 'primary' : 'secondary'}
              disabled={stats.due === 0}
              onClick={onStartSession}
              className={stats.due === 0 ? "dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700" : ""}
            >
              <Play size={16} className="mr-2" />
              Review ({stats.due})
            </Button>
            <Button 
              variant="secondary"
              onClick={() => setIsCramModalOpen(true)}
              className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <Zap size={16} className="mr-2" /> Cram
            </Button>
        </div>

        <div className="flex items-center gap-2">
             <Button 
              variant="ghost" 
              onClick={toggleTheme}
              className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-200"
              title={`Theme: ${theme}`}
            >
              {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
            </Button>
             <Button 
              variant="ghost" 
              onClick={onOpenSettings}
              className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-200"
              title="Settings"
            >
              <Settings size={18} />
            </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-rose-500 dark:text-rose-400 mb-1"><Clock size={20} /></div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.due}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Due</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-amber-500 dark:text-amber-400 mb-1"><Flame size={20} /></div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.streak}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Streak</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-emerald-500 dark:text-emerald-400 mb-1"><CheckCircle2 size={20} /></div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.learned}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Known</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-blue-500 dark:text-blue-400 mb-1"><Layers size={20} /></div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Total</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 dark:border-gray-800">
            <button
                onClick={() => setViewMode('list')}
                className={clsx(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    viewMode === 'list' 
                        ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" 
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
            >
                Cards
            </button>
            <button
                onClick={() => setViewMode('stats')}
                className={clsx(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    viewMode === 'stats' 
                        ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" 
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
            >
                Analytics
            </button>
        </div>

        {viewMode === 'stats' ? (
            <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 size={18} /> Activity
                    </h3>
                    <Heatmap history={history} />
                </div>
                <RetentionStats cards={cards} />
            </div>
        ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input 
                        type="text"
                        placeholder="Search cards..."
                        className="pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent outline-none text-sm w-full transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-gray-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg transition-colors overflow-x-auto">
                        {(['all', 'new', 'learning', 'graduated', 'known'] as const).map(option => (
                        <button
                            key={option}
                            onClick={() => setStatusFilter(option)}
                            className={clsx(
                            'px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
                            statusFilter === option
                                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            )}
                        >
                            {option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}
                        </button>
                        ))}
                    </div>
                </div>
                
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 min-h-[400px] shadow-sm transition-colors">
                {filteredCards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
                    <Search size={24} className="mb-2 opacity-20" />
                    <p className="text-sm">No cards found</p>
                    </div>
                ) : (
                    <List<RowData>
                        style={{ width: '100%', height: 600 }}
                        rowCount={filteredCards.length}
                        rowHeight={60}
                        rowProps={itemData}
                        rowComponent={Row}
                    />
                )}
                </div>
            </div>
        )}
      </div>

      {/* Settings Modal */}
      {/* This is handled by parent or context usually, but if it was here we'd render it */}
      
      <CramModal 
        isOpen={isCramModalOpen} 
        onClose={() => setIsCramModalOpen(false)} 
        tags={uniqueTags} 
      />
    </div>
  );
};\`\`\`

## components/Flashcard.tsx
\`\`\`typescript
import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '../types';
import { Volume2, FileText, BookOpen } from 'lucide-react';

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  autoPlayAudio?: boolean;
  showTranslation?: boolean;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const Flashcard: React.FC<FlashcardProps> = ({ card, isFlipped, autoPlayAudio = false, showTranslation = true }) => {
  const [hasVoice, setHasVoice] = useState(false);

  useEffect(() => {
    const checkVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      setHasVoice(voices.some(v => v.lang.startsWith('pl')));
    };
    
    checkVoice();
    window.speechSynthesis.onvoiceschanged = checkVoice;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = React.useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(card.targetSentence);
    utterance.lang = 'pl-PL';
    window.speechSynthesis.speak(utterance);
  }, [card.targetSentence]);

  // Auto-play audio when flipped if enabled
  useEffect(() => {
    if (isFlipped && autoPlayAudio && hasVoice) {
        speak();
    }
  }, [isFlipped, autoPlayAudio, hasVoice, speak]);
  
  const HighlightedSentence = useMemo(() => {
    // Common styling for the sentence text
    const sentenceClass = "text-2xl md:text-3xl font-medium text-center leading-tight text-gray-900 dark:text-gray-100 max-w-3xl transition-colors";

    if (!card.targetWord) {
      return (
        <p className={sentenceClass}>
          {card.targetSentence}
        </p>
      );
    }

    // Regex to find the word, preserving case and punctuation
    const escapedWord = escapeRegExp(card.targetWord);
    const parts = card.targetSentence.split(new RegExp(`(${escapedWord})`, 'gi'));
    
    return (
      <p className={sentenceClass}>
        {parts.map((part, i) => (
          part.toLowerCase() === card.targetWord!.toLowerCase() ? (
            <span key={i} className="text-polishRed font-semibold border-b-2 border-polishRed/20 pb-0.5">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        ))}
      </p>
    );
  }, [card.targetSentence, card.targetWord]);

  const statusColors = {
    new: 'bg-blue-400',
    learning: 'bg-amber-400',
    graduated: 'bg-emerald-400',
    known: 'bg-gray-300 dark:bg-gray-600'
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col min-h-[400px] justify-center relative">
      
      {/* Status Indicator */}
      <div className="absolute top-0 w-full flex justify-center pointer-events-none">
         <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 transition-colors">
            <div className={`w-1.5 h-1.5 rounded-full ${statusColors[card.status]}`} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {card.status}
            </span>
         </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500">
        <div className="w-full flex flex-col items-center space-y-8">
          {HighlightedSentence}
          
          {hasVoice && (
            <button 
              onClick={speak}
              className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Listen"
            >
              <Volume2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Answer Area */}
      {isFlipped && (
        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 pb-8">
          <div className="w-full max-w-2xl mx-auto border-t border-gray-100 dark:border-gray-800 pt-8 grid grid-cols-1 gap-8 text-center transition-colors">
            
            {/* Translation */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500 uppercase tracking-wider">Meaning</span>
              <h3 className="text-xl text-gray-800 dark:text-gray-200 font-serif italic transition-colors">
                {showTranslation ? card.nativeTranslation : <span className="blur-sm select-none text-gray-300 dark:text-gray-700">Hidden</span>}
              </h3>
            </div>

            {/* Notes */}
            {card.notes && (
              <div className="space-y-2">
                 <span className="text-xs font-mono text-gray-400 dark:text-gray-500 uppercase tracking-wider">Notes</span>
                 <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg mx-auto transition-colors">
                    {card.notes}
                 </p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
\`\`\`

## components/Heatmap.tsx
\`\`\`typescript
import React, { useMemo, useState } from 'react';
import { ReviewHistory } from '../types';

interface HeatmapProps {
  history: ReviewHistory;
}

export const Heatmap: React.FC<HeatmapProps> = ({ history }) => {
  // Generate last 52 weeks
  const calendarData = useMemo(() => {
    const today = new Date();
    const days = [];
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    const dayOfWeek = startDate.getDay(); 
    startDate.setDate(startDate.getDate() - dayOfWeek); 

    const totalDays = 53 * 7;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateKey,
        count: history[dateKey] || 0,
        inFuture: d > today
      });
    }
    return days;
  }, [history]);

  const weeks = 53;
  const monthMarkers = useMemo(() => {
    const markers = new Array<string>(weeks).fill('');
    calendarData.forEach((day, idx) => {
      if (day.date.getDate() === 1) {
        const weekIndex = Math.floor(idx / 7);
        markers[weekIndex] = day.date.toLocaleString(undefined, { month: 'short' });
      }
    });
    return markers;
  }, [calendarData]);

  const [selectedDay, setSelectedDay] = useState(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    return {
      dateKey: todayKey,
      dateLabel: new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      count: history[todayKey] || 0,
    };
  });

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800/50';
    if (count <= 2) return 'bg-emerald-200 dark:bg-emerald-900/30';
    if (count <= 5) return 'bg-emerald-300 dark:bg-emerald-800/50';
    if (count <= 9) return 'bg-emerald-400 dark:bg-emerald-600';
    return 'bg-emerald-500 dark:bg-emerald-500';
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-2">
      <div className="w-max min-w-full">
        <div className="grid gap-x-[3px]" style={{ gridTemplateColumns: `repeat(${weeks}, 10px)` }}>
          {monthMarkers.map((label, idx) => (
            <span key={`month-${idx}`} className="text-[9px] text-gray-400 dark:text-gray-500 font-mono text-center h-4 block">
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px]">
            <div className="grid grid-rows-7 grid-flow-col gap-[3px]" role="grid">
            {calendarData.map((day) => (
                <div
                key={day.dateKey}
                onClick={() => setSelectedDay({
                  dateKey: day.dateKey,
                  dateLabel: day.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
                  count: day.count,
                })}
                className={`w-[10px] h-[10px] rounded-[2px] transition-all duration-300 cursor-pointer ${day.inFuture ? 'opacity-0' : getColor(day.count)} ${selectedDay.dateKey === day.dateKey ? 'ring-2 ring-offset-1 ring-gray-900 dark:ring-gray-100 dark:ring-offset-gray-900' : ''}`}
                title={`${day.dateKey}: ${day.count} reviews`}
                role="gridcell"
                aria-label={`${day.dateKey}: ${day.count} reviews`}
                aria-pressed={selectedDay.dateKey === day.dateKey}
                />
            ))}
            </div>
        </div>
        <div className="flex justify-end items-center text-[9px] text-gray-400 dark:text-gray-500 font-mono mt-3 px-1 uppercase tracking-wide gap-2">
            <span>Less</span>
            <div className="flex items-center gap-[2px]">
                <div className="w-[10px] h-[10px] bg-gray-100 dark:bg-gray-800/50 rounded-[1px]"></div>
                <div className="w-[10px] h-[10px] bg-emerald-200 dark:bg-emerald-900/30 rounded-[1px]"></div>
                <div className="w-[10px] h-[10px] bg-emerald-300 dark:bg-emerald-800/50 rounded-[1px]"></div>
                <div className="w-[10px] h-[10px] bg-emerald-400 dark:bg-emerald-600 rounded-[1px]"></div>
                <div className="w-[10px] h-[10px] bg-emerald-500 dark:bg-emerald-500 rounded-[1px]"></div>
            </div>
            <span>More</span>
        </div>
      </div>
    </div>
  );
};\`\`\`

## components/Layout.tsx
\`\`\`typescript
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Database } from 'lucide-react';
import { useDeck } from '../contexts/DeckContext';
import { isCardDue } from '../services/srs';

// Assuming __APP_VERSION__ is defined in vite config define
declare const __APP_VERSION__: string;

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { stats } = useDeck();
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 font-sans flex flex-col transition-colors duration-300">
      {/* Sticky Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            to="/"
            className="flex items-center gap-3 cursor-pointer group" 
          >
            <div className="p-2 bg-gray-900 dark:bg-gray-50 rounded-md text-white dark:text-gray-900 group-hover:bg-gray-800 dark:group-hover:bg-gray-200 transition-colors">
                <Database size={16} />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-50 leading-none">Polski<span className="text-gray-500 dark:text-gray-400">Mining</span></span>
                <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 leading-none mt-1">V {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'DEV'} LOCAL</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-4 text-xs font-mono text-gray-600 dark:text-gray-400">
                <span>CARDS: {stats.total}</span>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <span>DUE: {stats.due}</span>
             </div>
          </div>
        </div>
      </nav>

      {/* Reduced padding top/bottom to fix scrolling issues on smaller screens */}
      <main className="flex-1 w-full max-w-8xl mx-auto px-6 pt-6 pb-8 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-6 bg-gray-50 dark:bg-gray-900 mt-auto transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-mono">
            <p>PolskiMining SRS System</p>
            <p>Local-First Storage</p>
        </div>
      </footer>
    </div>
  );
};
\`\`\`

## components/RetentionStats.tsx
\`\`\`typescript
import React, { useMemo } from 'react';
import { Card } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';

interface RetentionStatsProps {
  cards: Card[];
}

export const RetentionStats: React.FC<RetentionStatsProps> = ({ cards }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const themeColors = {
    bar: isDark ? '#60a5fa' : '#3b82f6',
    barHover: isDark ? '#93c5fd' : '#60a5fa',
    text: isDark ? '#9ca3af' : '#6b7280',
    grid: isDark ? '#1f2937' : '#e5e7eb',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
    tooltipText: isDark ? '#f3f4f6' : '#111827',
  };

  // 1. Future Due (Forecast)
  const forecastData = useMemo(() => {
    const daysToShow = 30;
    const data = new Array(daysToShow).fill(0).map((_, i) => ({ day: i, count: 0, label: `+${i}d` }));
    const today = new Date();

    cards.forEach(card => {
      if (card.status === 'known' || card.status === 'new') return;
      
      const dueDate = parseISO(card.dueDate);
      const diff = differenceInCalendarDays(dueDate, today);
      
      if (diff >= 0 && diff < daysToShow) {
        data[diff].count++;
      }
    });
    
    // Label for today/tomorrow
    data[0].label = 'Today';
    data[1].label = 'Tmrw';
    
    return data;
  }, [cards]);

  // 2. Stability Distribution
  const stabilityData = useMemo(() => {
    const buckets = [
      { label: '0-1d', min: 0, max: 1, count: 0 },
      { label: '1-3d', min: 1, max: 3, count: 0 },
      { label: '3-7d', min: 3, max: 7, count: 0 },
      { label: '7-14d', min: 7, max: 14, count: 0 },
      { label: '14-30d', min: 14, max: 30, count: 0 },
      { label: '1-3m', min: 30, max: 90, count: 0 },
      { label: '3-6m', min: 90, max: 180, count: 0 },
      { label: '6m-1y', min: 180, max: 365, count: 0 },
      { label: '1y+', min: 365, max: Infinity, count: 0 },
    ];

    cards.forEach(card => {
      if (!card.stability) return;
      const s = card.stability;
      const bucket = buckets.find(b => s >= b.min && s < b.max);
      if (bucket) bucket.count++;
    });

    return buckets;
  }, [cards]);

  // 3. Status Distribution
  const statusData = useMemo(() => {
    const counts = {
      new: 0,
      learning: 0,
      graduated: 0,
      known: 0
    };
    
    cards.forEach(c => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });

    return [
      { name: 'New', value: counts.new, color: isDark ? '#60a5fa' : '#3b82f6' },
      { name: 'Learning', value: counts.learning, color: isDark ? '#fbbf24' : '#f59e0b' },
      { name: 'Graduated', value: counts.graduated, color: isDark ? '#34d399' : '#10b981' },
      { name: 'Known', value: counts.known, color: isDark ? '#9ca3af' : '#6b7280' },
    ];
  }, [cards, isDark]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Forecast Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Reviews (30 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.grid} opacity={0.5} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10, fill: themeColors.text }} 
                  interval={2}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: themeColors.text }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: `1px solid ${themeColors.tooltipBorder}`, backgroundColor: themeColors.tooltipBg, color: themeColors.tooltipText, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="count" fill={themeColors.bar} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Card Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: `1px solid ${themeColors.tooltipBorder}`, backgroundColor: themeColors.tooltipBg, color: themeColors.tooltipText, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stability Chart */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Memory Stability (Retention Strength)</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Shows how long cards are expected to be remembered (90% retention probability). Higher is better.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stabilityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.grid} opacity={0.5} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: themeColors.text }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: themeColors.text }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: `1px solid ${themeColors.tooltipBorder}`, backgroundColor: themeColors.tooltipBg, color: themeColors.tooltipText, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="count" fill={isDark ? '#34d399' : '#10b981'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
\`\`\`

## components/SettingsModal.tsx
\`\`\`typescript
import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, Save, AlertTriangle, Download, Upload, FileJson } from 'lucide-react';
import { Button } from './ui/Button';
import { useSettings } from '../contexts/SettingsContext';
import { useDeck } from '../contexts/DeckContext';
import { toast } from 'sonner';
import { db } from '../services/db';
import { BEGINNER_DECK } from '../data/beginnerDeck';
import { Card, ReviewHistory } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { dataVersion } = useDeck(); 
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmResetDeck, setConfirmResetDeck] = useState(false);
  const [confirmResetSettings, setConfirmResetSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        setLocalSettings(settings);
        setConfirmResetDeck(false);
        setConfirmResetSettings(false);
    }
  }, [isOpen, settings]);

  // Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success("Settings saved");
    onClose();
  };

  const handleResetDeck = async () => {
    if (!confirmResetDeck) {
        setConfirmResetDeck(true);
        return;
    }
    
    setIsResetting(true);
    try {
        await db.clearAllCards();
        await db.clearHistory();
        await db.saveAllCards(BEGINNER_DECK);
        window.location.reload();
    } catch (e) {
        console.error(e);
        toast.error("Failed to reset deck");
        setIsResetting(false);
        setConfirmResetDeck(false);
    }
  };

  const handleResetSettings = () => {
      if (!confirmResetSettings) {
          setConfirmResetSettings(true);
          return;
      }
      resetSettings();
      setLocalSettings(settings); 
      toast.success("Settings reset to default");
      setConfirmResetSettings(false);
  };

  const handleExport = async () => {
      try {
          const cards = await db.getCards();
          const history = await db.getHistory();
          const exportData = {
              version: 1,
              date: new Date().toISOString(),
              cards,
              history,
              settings: localSettings
          };
          
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `polskimine-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success("Backup downloaded successfully");
      } catch (e) {
          console.error(e);
          toast.error("Failed to export data");
      }
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (!json.cards || !json.history) {
                  throw new Error("Invalid backup file format");
              }

              if (!confirm("This will overwrite your current deck and history. Continue?")) {
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  return;
              }

              await db.clearAllCards();
              await db.clearHistory();
              await db.saveAllCards(json.cards as Card[]);
              await db.saveFullHistory(json.history as ReviewHistory);
              
              if (json.settings) {
                  updateSettings(json.settings);
              }

              toast.success("Data imported successfully! Reloading...");
              setTimeout(() => window.location.reload(), 1500);
          } catch (err) {
              console.error(err);
              toast.error("Failed to import backup. Invalid file.");
          }
      };
      reader.readAsText(file);
  };

  const inputClass = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm transition-all";
  const labelClass = "block text-xs font-mono text-gray-500 uppercase mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div ref={modalRef} className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
            
            {/* Section: Data Management */}
            <section>
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    Data Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" onClick={handleExport} className="w-full justify-start">
                        <Download size={16} className="mr-2" /> Export Backup (JSON)
                    </Button>
                    <Button variant="outline" onClick={handleImportClick} className="w-full justify-start">
                        <Upload size={16} className="mr-2" /> Import Backup
                    </Button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                    Regularly backup your data. All progress is stored locally in your browser.
                </p>
            </section>

            {/* Section: General */}
            <section>
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    General Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-md cursor-pointer">
                        <span className="text-sm text-gray-700">Auto-play Audio</span>
                        <input 
                            type="checkbox" 
                            className="toggle"
                            checked={localSettings.autoPlayAudio}
                            onChange={e => setLocalSettings({...localSettings, autoPlayAudio: e.target.checked})}
                        />
                    </label>
                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-md cursor-pointer">
                        <span className="text-sm text-gray-700">Show Translation After Flip</span>
                        <input 
                            type="checkbox" 
                            className="toggle"
                            checked={localSettings.showTranslationAfterFlip}
                            onChange={e => setLocalSettings({...localSettings, showTranslationAfterFlip: e.target.checked})}
                        />
                    </label>
                </div>
            </section>

            {/* Section: Limits */}
            <section>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Daily Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="dailyNewLimit" className={labelClass}>New Cards / Day</label>
                        <input 
                            id="dailyNewLimit"
                            type="number" 
                            className={inputClass}
                            value={localSettings.dailyNewLimit}
                            onChange={e => setLocalSettings({...localSettings, dailyNewLimit: parseInt(e.target.value) || 0})}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Maximum new cards to introduce per day.</p>
                    </div>
                    <div>
                        <label htmlFor="dailyReviewLimit" className={labelClass}>Max Reviews / Day</label>
                        <input 
                            id="dailyReviewLimit"
                            type="number" 
                            className={inputClass}
                            value={localSettings.dailyReviewLimit}
                            onChange={e => setLocalSettings({...localSettings, dailyReviewLimit: parseInt(e.target.value) || 0})}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Cap on total reviews (0 for unlimited).</p>
                    </div>
                </div>
            </section>

            {/* Section: Advanced SRS (FSRS) */}
            <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    FSRS Configuration
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-mono uppercase">v5</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="requestRetention" className={labelClass}>Request Retention: {localSettings.fsrs.request_retention}</label>
                        <input 
                            id="requestRetention"
                            type="range" 
                            step="0.01"
                            min="0.7"
                            max="0.99"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                            value={localSettings.fsrs.request_retention}
                            onChange={e => setLocalSettings({
                                ...localSettings, 
                                fsrs: { ...localSettings.fsrs, request_retention: parseFloat(e.target.value) || 0.9 }
                            })}
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                            <span>0.70 (Less Work)</span>
                            <span>0.99 (High Recall)</span>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="maximumInterval" className={labelClass}>Maximum Interval (Days)</label>
                        <input 
                            id="maximumInterval"
                            type="number" 
                            className={inputClass}
                            value={localSettings.fsrs.maximum_interval}
                            onChange={e => setLocalSettings({
                                ...localSettings, 
                                fsrs: { ...localSettings.fsrs, maximum_interval: parseInt(e.target.value) || 0 }
                            })}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Cap on the review interval.</p>
                    </div>
                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-md md:col-span-2 bg-white cursor-pointer">
                        <span className="text-sm text-gray-700">Enable Fuzzing</span>
                        <input 
                            type="checkbox" 
                            className="toggle"
                            checked={localSettings.fsrs.enable_fuzzing}
                            onChange={e => setLocalSettings({
                                ...localSettings, 
                                fsrs: { ...localSettings.fsrs, enable_fuzzing: e.target.checked }
                            })}
                        />
                    </label>
                </div>
            </section>

            {/* Section: Danger Zone */}
            <section className="border-t border-red-100 pt-6 mt-2">
                <h3 className="text-sm font-bold text-red-700 mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} /> Danger Zone
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <Button 
                        variant="outline" 
                        onClick={handleResetSettings}
                        className={`border-gray-300 hover:bg-gray-50 text-gray-700 ${confirmResetSettings ? 'bg-red-50 border-red-300 text-red-700' : ''}`}
                    >
                        <RotateCcw size={14} className="mr-2" /> 
                        {confirmResetSettings ? 'Click again to confirm' : 'Reset Settings'}
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleResetDeck}
                        disabled={isResetting}
                        className={`border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 ${confirmResetDeck ? 'bg-red-600 text-white hover:bg-red-700 hover:border-red-700' : ''}`}
                    >
                        <AlertTriangle size={14} className="mr-2" /> 
                        {confirmResetDeck ? 'Are you absolutely sure?' : 'Reset Deck & History'}
                    </Button>
                </div>
            </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>
                <Save size={16} className="mr-2" /> Save Changes
            </Button>
        </div>

      </div>
    </div>
  );
};
\`\`\`

## components/StudySession.tsx
\`\`\`typescript
import React, { useState, useEffect } from 'react';
import { Card, Grade } from '../types';
import { Flashcard } from './Flashcard';
import { Button } from './ui/Button';
import { calculateNextReview, isCardDue } from '../services/srs';
import { ArrowLeft, RotateCcw, Undo2, CheckCircle2, Clock } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const ShortcutBadge: React.FC<{ keys: string }> = ({ keys }) => (
  <span className="border border-gray-200 rounded px-1 py-0.5 text-[9px] font-mono uppercase tracking-tight text-gray-500">
    {keys}
  </span>
);

interface StudySessionProps {
  dueCards: Card[];
  onUpdateCard: (card: Card) => void;
  onRecordReview: (oldCard: Card) => void;
  onExit: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onMarkKnown: (card: Card) => void;
}

export const StudySession: React.FC<StudySessionProps> = ({ dueCards, onUpdateCard, onRecordReview, onExit, onUndo, canUndo, onMarkKnown }) => {
  const { settings } = useSettings();
  const [sessionCards, setSessionCards] = useState<Card[]>(dueCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [actionHistory, setActionHistory] = useState<{ appended: boolean }[]>([]);
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    setSessionCards(dueCards);
    setCurrentIndex(0);
    setSessionComplete(dueCards.length === 0);
    setActionHistory([]);
  }, [dueCards]);

  const handleUndo = () => {
    if (canUndo && onUndo) {
        onUndo();
        
        // Revert session state
        const lastAction = actionHistory[actionHistory.length - 1];
        let newLength = sessionCards.length;

        if (lastAction) {
            if (lastAction.appended) {
                setSessionCards(prev => prev.slice(0, -1));
                newLength = sessionCards.length - 1;
            }
            setActionHistory(prev => prev.slice(0, -1));
        }

        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsFlipped(true); // Show answer side to re-grade
            setSessionComplete(false);
        } else if (sessionComplete) {
             // If we were done, go back to last card
             setSessionComplete(false);
             setCurrentIndex(newLength - 1);
             setIsFlipped(true);
        }
    }
  };

  const handleMarkKnown = () => {
    onMarkKnown(currentCard);
    setActionHistory(prev => [...prev, { appended: false }]);
    if (currentIndex < sessionCards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionComplete) return;
      
      const current = sessionCards[currentIndex];
      if (current && !isCardDue(current, now)) return;

      if (!isFlipped) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          handleFlip();
        }
      } else {
        switch (e.key) {
          case '1': handleGrade('Again'); break;
          case '2': handleGrade('Good'); break;
          case ' ': // Space to default to Good
            e.preventDefault();
            handleGrade('Good'); 
            break;
          case 'z': // Undo shortcut
            if (e.metaKey || e.ctrlKey) {
                e.preventDefault();
                handleUndo();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, sessionComplete, currentIndex, sessionCards, canUndo, onUndo, now]); // Dependencies for closure

  const currentCard = sessionCards[currentIndex];
  const isDue = currentCard ? isCardDue(currentCard, now) : false;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentCard && !isDue) {
        timer = setInterval(() => {
            setNow(new Date());
        }, 1000);
    }
    return () => {
        if (timer) clearInterval(timer);
    };
  }, [currentCard, isDue]);

  const handleFlip = () => {
    if (!isFlipped && isDue) setIsFlipped(true);
  };

  const handleGrade = (grade: Grade) => {
    const updatedCard = calculateNextReview(currentCard, grade, settings.fsrs);
    onUpdateCard(updatedCard);
    onRecordReview(currentCard);

    let appended = false;
    // Re-queue if learning (status 'learning' or state Learning)
    // This allows studying ahead if the queue is empty, effectively skipping the 10m wait
    if (updatedCard.status === 'learning') {
        setSessionCards(prev => [...prev, updatedCard]);
        appended = true;
    }
    setActionHistory(prev => [...prev, { appended }]);

    if (currentIndex < sessionCards.length - 1 || appended) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  if (sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center animate-in fade-in duration-300 min-h-[300px]">
        <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mb-6">
          <RotateCcw size={24} />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Queue Cleared</h2>
        <p className="text-gray-500 mb-8 font-mono text-sm">
          No more cards due for review.
        </p>
        <div className="flex gap-4">
            <Button onClick={onExit} size="lg" variant="outline">Back to Dashboard</Button>
            {canUndo && (
                <Button onClick={handleUndo} size="lg" variant="secondary">Undo Last</Button>
            )}
        </div>
      </div>
    );
  }

  if (!currentCard) return <div className="p-10 text-center font-mono text-sm">Loading...</div>;

  if (!isDue) {
      const waitTime = Math.max(0, new Date(currentCard.dueDate).getTime() - now.getTime());
      const minutes = Math.floor(waitTime / 60000);
      const seconds = Math.floor((waitTime % 60000) / 1000);
      
      return (
        <div className="flex flex-col items-center justify-center flex-1 text-center animate-in fade-in duration-300 min-h-[300px]">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
                <Clock size={24} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Learning Step</h2>
            <p className="text-gray-500 mb-8 font-mono text-sm">
                This card is waiting for its learning step.
            </p>
            <div className="text-4xl font-mono font-bold text-gray-900 mb-8">
                {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="flex gap-4">
                <Button onClick={onExit} size="lg" variant="outline">Back to Dashboard</Button>
            </div>
        </div>
      );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 h-full px-4">
      {/* Minimal Header */}
      <div className="flex justify-between items-center py-6">
        <button 
          onClick={onExit}
          className="text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="Quit session"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-gray-400">
            {currentIndex + 1} / {sessionCards.length}
            </div>
            {canUndo && (
                <button 
                    onClick={handleUndo}
                    className="text-gray-400 hover:text-gray-900 transition-colors"
                    title="Undo"
                >
                    <Undo2 size={18} />
                </button>
            )}
            <button 
                onClick={handleMarkKnown}
                className="text-gray-400 hover:text-emerald-600 transition-colors"
                title="Mark Known"
            >
                <CheckCircle2 size={18} />
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 pb-12">
        
        <div className="w-full flex justify-center mb-12">
          <Flashcard 
            card={currentCard} 
            isFlipped={isFlipped} 
            autoPlayAudio={settings.autoPlayAudio}
            showTranslation={settings.showTranslationAfterFlip}
          />
        </div>

        {/* Controls */}
        <div className="w-full max-w-xl">
          <div className={`transition-all duration-300 ${isFlipped ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
            <Button 
              onClick={handleFlip} 
              size="lg" 
              className="w-full h-14 text-base shadow-sm"
            >
              Show Answer
            </Button>
          </div>
          
          <div className={`grid grid-cols-2 gap-3 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none h-0 overflow-hidden'}`}>
            <button 
              onClick={() => handleGrade('Again')}
              className="flex flex-col items-center justify-center h-20 rounded-lg border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all group bg-white"
            >
              <span className="text-sm font-medium text-gray-700 mb-1 group-hover:text-red-700">Again</span>
              <span className="text-[10px] font-mono text-gray-400 group-hover:text-red-500">1</span>
            </button>

            <button 
              onClick={() => handleGrade('Good')}
              className="flex flex-col items-center justify-center h-20 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group bg-white"
            >
              <span className="text-sm font-medium text-gray-700 mb-1 group-hover:text-emerald-700">Good</span>
              <span className="text-[10px] font-mono text-gray-400 group-hover:text-emerald-500">Space</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
\`\`\`

## components/ui/Button.tsx
\`\`\`typescript
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  
  // Base: Height fixed by padding/line-height, distinct borders
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-md border active:translate-y-[1px]";
  
  const variants = {
    primary: "bg-[#1c2c4c] text-white border-[#1c2c4c] hover:bg-[#14213d] hover:border-[#14213d] focus:ring-[#1c2c4c]",
    secondary: "bg-[#fff4f4] text-[#9d0208] border-[#ffdada] hover:bg-[#ffe3e3] hover:border-[#ffc9c9] focus:ring-[#ffdada]",
    outline: "bg-transparent border-slate-300 text-slate-700 hover:border-[#1c2c4c] hover:text-[#1c2c4c] focus:ring-[#1c2c4c]",
    danger: "bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 focus:ring-red-200",
    ghost: "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-200"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2 text-sm", // Taller, wider click target
    lg: "px-8 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};\`\`\`

## constants.ts
\`\`\`typescript
import { Card, ReviewHistory } from './types';

export const MOCK_CARDS: Card[] = [
  {
    id: '1',
    targetSentence: "Cześć, jak się masz?",
    targetWord: "Cześć",
    nativeTranslation: "Hi, how are you?",
    notes: "Informal greeting. Also means 'Bye' depending on context.",
    status: 'new',
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
  {
    id: '2',
    targetSentence: "Dziękuję za pomoc.",
    targetWord: "Dziękuję",
    nativeTranslation: "Thank you for the help.",
    notes: "First person singular of dziękować.",
    status: 'learning',
    interval: 1,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() - 86400000).toISOString(), // Due yesterday
  },
  {
    id: '3',
    targetSentence: "Ten mężczyzna jest wysoki.",
    targetWord: "mężczyzna",
    nativeTranslation: "That man is tall.",
    notes: "Noun, Masculine Personal.",
    status: 'new',
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
  {
    id: '4',
    targetSentence: "Lubię pić kawę rano.",
    targetWord: "kawę",
    nativeTranslation: "I like to drink coffee in the morning.",
    notes: "Accusative case of 'kawa'.",
    status: 'graduated',
    interval: 10,
    easeFactor: 2.7,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), // Due in 5 days
  },
  {
    id: '5',
    targetSentence: "Wszystko w porządku?",
    // No targetWord here implies pure sentence mining
    nativeTranslation: "Is everything okay?",
    notes: "Common phrase used to ask if someone is fine or if a situation is resolved.",
    status: 'new',
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
];

// Generate some fake history for the last year
const generateMockHistory = (): ReviewHistory => {
  const history: ReviewHistory = {};
  const today = new Date();
  for (let i = 0; i < 100; i++) {
    // Random days in the past year
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * 365));
    const dateKey = pastDate.toISOString().split('T')[0];
    
    // Add random reviews (1-15)
    history[dateKey] = (history[dateKey] || 0) + Math.floor(Math.random() * 10) + 1;
  }
  return history;
};

export const MOCK_HISTORY = generateMockHistory();

export const STORAGE_KEY = 'polski_mining_deck_v1';
export const HISTORY_KEY = 'polski_mining_history_v1';

export const SRS_CONFIG = {
  CUTOFF_HOUR: 4,
};

export const FSRS_DEFAULTS = {
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzzing: true,
  w: [0.40255, 1.18385, 3.173, 15.69105, 7.19605, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 2.9605, 2.27315, 0.20375, 0.37325, 0.89045, 0.02495],
};
\`\`\`

## contexts/DeckContext.tsx
\`\`\`typescript
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Card, DeckStats, ReviewHistory } from '../types';
import { MOCK_CARDS, MOCK_HISTORY, STORAGE_KEY, HISTORY_KEY } from '../constants';
import { BEGINNER_DECK } from '../data/beginnerDeck';
import { isCardDue } from '../services/srs';
import { db } from '../services/db';
import { toast } from 'sonner';
import { useSettings } from './SettingsContext';

interface DeckContextType {
  history: ReviewHistory;
  stats: DeckStats;
  reviewsToday: { newCards: number; reviewCards: number };
  isLoading: boolean;
  dataVersion: number;
  addCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  updateCard: (card: Card) => void;
  recordReview: (card: Card) => void;
  undoReview: () => void;
  canUndo: boolean;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const [history, setHistory] = useState<ReviewHistory>({});
  const [stats, setStats] = useState<DeckStats>({
    total: 0, due: 0, learned: 0, streak: 0, totalReviews: 0, longestStreak: 0
  });
  const [reviewsToday, setReviewsToday] = useState<{ newCards: number; reviewCards: number }>({ newCards: 0, reviewCards: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);
  const [lastReview, setLastReview] = useState<{ card: Card, date: string } | null>(null);

  const refreshStats = useCallback(async () => {
    try {
        const dbStats = await db.getStats();
        const dueCards = await db.getDueCards();
        const currentReviewsToday = await db.getTodayReviewStats();
        setReviewsToday(currentReviewsToday);
        
        // We need to merge with history-based stats which are calculated in memory or need to be recalculated
        // For now, we can recalculate streak here or keep it separate.
        // Let's recalculate streak from current history state.
        setStats(prev => ({
            ...prev,
            total: dbStats.total,
            due: dueCards.length,
            learned: dbStats.learned
        }));
    } catch (e) {
        console.error("Failed to refresh stats", e);
    }
  }, [settings]);

  // Load data from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentCards = await db.getCards();
        
        // Reset logic: If we have very few cards (likely old mock data) or empty, seed with beginner deck
        if (currentCards.length <= 5) {
            console.log("Seeding beginner deck...");
            await db.clearAllCards();
            await db.clearHistory();
            await db.saveAllCards(BEGINNER_DECK);
            setHistory({});
            toast.success("Deck reset to Beginner Polish course!");
        } else {
            let loadedHistory = await db.getHistory();
            setHistory(loadedHistory);
        }
        
        // Initial stats load
        const dbStats = await db.getStats();
        const dueCards = await db.getDueCards();
        const currentReviewsToday = await db.getTodayReviewStats();
        setReviewsToday(currentReviewsToday);

        setStats(prev => ({ ...prev, ...dbStats, due: dueCards.length }));

      } catch (error) {
        console.error("Failed to load data from DB", error);
        toast.error("Failed to load your deck. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [settings]); // Re-run when settings change to update due count

  // Effect to update streak stats whenever history changes
  useEffect(() => {
    const sortedDates = Object.keys(history).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalReviews = 0;

    const reviewCounts = Object.values(history);
    totalReviews = reviewCounts.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (history[todayStr]) {
        currentStreak = 1;
        let checkDate = new Date(yesterday);
        while(true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (history[dateStr]) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    } else if (history[yesterdayStr]) {
        currentStreak = 0; 
         let checkDate = new Date(yesterday);
        while(true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (history[dateStr]) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    } else {
        currentStreak = 0;
    }

    if (sortedDates.length > 0) {
        tempStreak = 1;
        longestStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const prev = new Date(sortedDates[i-1]);
            const curr = new Date(sortedDates[i]);
            const diffTime = Math.abs(curr.getTime() - prev.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
            if (tempStreak > longestStreak) longestStreak = tempStreak;
        }
    }

    setStats(prev => ({
        ...prev,
        streak: currentStreak,
        totalReviews,
        longestStreak
    }));
  }, [history]);

  const notifyUpdate = useCallback(() => {
      setDataVersion(v => v + 1);
      refreshStats();
  }, [refreshStats]);

  const addCard = useCallback(async (newCard: Card) => {
    try {
        await db.saveCard(newCard);
        toast.success('Card added successfully');
        notifyUpdate();
    } catch (e) {
        console.error(e);
        toast.error('Failed to save card');
    }
  }, [notifyUpdate]);

  const deleteCard = useCallback(async (id: string) => {
    try {
        await db.deleteCard(id);
        toast.success('Card deleted');
        notifyUpdate();
    } catch (e) {
        console.error(e);
        toast.error('Failed to delete card');
    }
  }, [notifyUpdate]);

  const updateCard = useCallback(async (updatedCard: Card) => {
    try {
        await db.saveCard(updatedCard);
        notifyUpdate();
    } catch (e) {
        console.error(e);
        toast.error('Failed to update card');
    }
  }, [notifyUpdate]);

  const recordReview = useCallback(async (oldCard: Card) => {
    const today = new Date().toISOString().split('T')[0];
    setHistory(prev => ({
        ...prev,
        [today]: (prev[today] || 0) + 1
    }));
    setLastReview({ card: oldCard, date: today });
    try {
        await db.incrementHistory(today, 1);
        // Note: We don't strictly need to notifyUpdate here if we only care about stats, 
        // but if we want to update 'due' counts immediately after a review in Dashboard, we should.
        // However, StudySession handles its own state. Dashboard might need to know.
        notifyUpdate();
    } catch (e) {
        console.error(e);
    }
  }, [notifyUpdate]);

  const undoReview = useCallback(async () => {
    if (!lastReview) return;
    const { card, date } = lastReview;

    try {
        await db.saveCard(card);
    } catch (e) { console.error(e); }

    setHistory(prev => ({
        ...prev,
        [date]: Math.max(0, (prev[date] || 0) - 1)
    }));
    try {
        await db.incrementHistory(date, -1);
    } catch (e) { console.error(e); }

    setLastReview(null);
    toast.success("Review undone");
    notifyUpdate();
  }, [lastReview, notifyUpdate]);

  const contextValue = useMemo(() => ({
    history,
    stats,
    reviewsToday,
    isLoading,
    dataVersion,
    addCard,
    deleteCard,
    updateCard,
    recordReview,
    undoReview,
    canUndo: !!lastReview
  }), [history, stats, reviewsToday, isLoading, dataVersion, addCard, deleteCard, updateCard, recordReview, undoReview, lastReview]);

  return (
    <DeckContext.Provider value={contextValue}>
      {children}
    </DeckContext.Provider>
  );
};

export const useDeck = () => {
  const context = useContext(DeckContext);
  if (context === undefined) {
    throw new Error('useDeck must be used within a DeckProvider');
  }
  return context;
};
\`\`\`

## contexts/SettingsContext.tsx
\`\`\`typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { FSRS_DEFAULTS } from '../constants';

const DEFAULT_SETTINGS: UserSettings = {
  dailyNewLimit: 20,
  dailyReviewLimit: 100,
  autoPlayAudio: false,
  showTranslationAfterFlip: true,
  fsrs: {
    request_retention: FSRS_DEFAULTS.request_retention,
    maximum_interval: FSRS_DEFAULTS.maximum_interval,
    w: FSRS_DEFAULTS.w,
    enable_fuzzing: FSRS_DEFAULTS.enable_fuzzing,
  }
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem('polskimine_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with default to handle new fields in future
        setSettings(prev => ({
            ...prev,
            ...parsed,
            fsrs: { ...prev.fsrs, ...(parsed.fsrs || {}) }
        }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        ...newSettings,
        fsrs: {
            ...prev.fsrs,
            ...(newSettings.fsrs || {})
        }
      };
      localStorage.setItem('polskimine_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('polskimine_settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
\`\`\`

## contexts/ThemeContext.tsx
\`\`\`typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
\`\`\`

## data/beginnerDeck.ts
\`\`\`typescript
import { Card } from '../types';
import { v4 as uuidv4 } from 'uuid';

const createCard = (sentence: string, translation: string, targetWord?: string, notes: string = ''): Card => ({
  id: uuidv4(),
  targetSentence: sentence,
  targetWord,
  nativeTranslation: translation,
  notes,
  status: 'new',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
});

export const BEGINNER_DECK: Card[] = [
  // Greetings & Basics
  createCard("Dzień dobry.", "Good morning / Good afternoon.", undefined, "Formal greeting used during the day."),
  createCard("Dobry wieczór.", "Good evening.", undefined, "Formal greeting used in the evening."),
  createCard("Cześć.", "Hi / Bye.", undefined, "Informal greeting and farewell."),
  createCard("Do widzenia.", "Goodbye.", undefined, "Formal farewell."),
  createCard("Dobranoc.", "Good night.", undefined, "Used before going to sleep."),
  createCard("Dziękuję.", "Thank you.", undefined, ""),
  createCard("Proszę.", "Please / Here you go.", undefined, ""),
  createCard("Przepraszam.", "I'm sorry / Excuse me.", undefined, ""),
  createCard("Tak.", "Yes.", undefined, ""),
  createCard("Nie.", "No.", undefined, ""),

  // Introductions
  createCard("Jak masz na imię?", "What is your name?", "imię", "Informal."),
  createCard("Mam na imię Anna.", "My name is Anna.", "imię", ""),
  createCard("Miło mi cię poznać.", "Nice to meet you.", "poznać", "Informal."),
  createCard("Skąd jesteś?", "Where are you from?", "jesteś", "Informal."),
  createCard("Jestem z Polski.", "I am from Poland.", "Polski", "Genitive case of Polska."),
  createCard("Mieszkam w Warszawie.", "I live in Warsaw.", "Warszawie", "Locative case of Warszawa."),

  // Common Verbs (To be - Być)
  createCard("Jestem zmęczony.", "I am tired.", "Jestem", "Masculine form."),
  createCard("Jesteś głodna?", "Are you hungry?", "Jesteś", "Feminine form."),
  createCard("On jest w domu.", "He is at home.", "jest", ""),
  createCard("Ona jest w pracy.", "She is at work.", "jest", ""),
  createCard("To jest trudne.", "This is difficult.", "jest", ""),

  // Common Verbs (To have - Mieć)
  createCard("Mam pytanie.", "I have a question.", "Mam", ""),
  createCard("Masz czas?", "Do you have time?", "Masz", ""),
  createCard("On ma psa.", "He has a dog.", "ma", "Accusative: pies -> psa."),
  createCard("Ona ma kota.", "She has a cat.", "ma", "Accusative: kot -> kota."),
  createCard("Nie mam pieniędzy.", "I don't have money.", "mam", "Genitive required after negation."),

  // Common Verbs (To go - Iść/Jechać)
  createCard("Idę do sklepu.", "I am walking to the store.", "Idę", "Motion on foot."),
  createCard("Jadę do Krakowa.", "I am going (by vehicle) to Krakow.", "Jadę", "Motion by vehicle."),
  createCard("Gdzie idziesz?", "Where are you going?", "idziesz", ""),
  createCard("Idziemy na spacer.", "We are going for a walk.", "Idziemy", ""),

  // Common Verbs (To want - Chcieć)
  createCard("Chcę kawę.", "I want coffee.", "Chcę", "Accusative: kawa -> kawę."),
  createCard("Co chcesz robić?", "What do you want to do?", "chcesz", ""),
  createCard("On chce spać.", "He wants to sleep.", "chce", ""),

  // Common Verbs (To like - Lubić)
  createCard("Lubię Polskę.", "I like Poland.", "Lubię", "Accusative: Polska -> Polskę."),
  createCard("Lubisz czytać?", "Do you like reading?", "Lubisz", ""),
  createCard("Nie lubię tego.", "I don't like this.", "lubię", "Genitive after negation."),

  // Food & Drink
  createCard("Poproszę wodę.", "Water, please.", "wodę", "Accusative: woda -> wodę."),
  createCard("Smacznego!", "Bon appétit!", undefined, ""),
  createCard("To jest pyszne.", "This is delicious.", "pyszne", ""),
  createCard("Jestem głodny.", "I am hungry.", "głodny", "Masculine."),
  createCard("Chcę jeść.", "I want to eat.", "jeść", ""),

  // Numbers & Time
  createCard("Która jest godzina?", "What time is it?", "godzina", ""),
  createCard("Jest pierwsza.", "It is one o'clock.", "pierwsza", ""),
  createCard("Jeden, dwa, trzy.", "One, two, three.", undefined, ""),
  createCard("Ile to kosztuje?", "How much does this cost?", "kosztuje", ""),

  // Places & Directions
  createCard("Gdzie jest toaleta?", "Where is the toilet?", "toaleta", ""),
  createCard("Prosto i w prawo.", "Straight and to the right.", "prawo", ""),
  createCard("W lewo.", "To the left.", "lewo", ""),
  createCard("Szukam dworca.", "I am looking for the station.", "dworca", "Genitive: dworzec -> dworca."),

  // Family
  createCard("To jest moja matka.", "This is my mother.", "matka", ""),
  createCard("To jest mój ojciec.", "This is my father.", "ojciec", ""),
  createCard("Masz rodzeństwo?", "Do you have siblings?", "rodzeństwo", ""),

  // Weather
  createCard("Zimno mi.", "I am cold.", "Zimno", ""),
  createCard("Jest gorąco.", "It is hot.", "gorąco", ""),
  createCard("Pada deszcz.", "It is raining.", "Pada", ""),
  createCard("Świeci słońce.", "The sun is shining.", "słońce", ""),

  // Identity & The Student (Base Layer)
  createCard("Jestem naukowcem.", "I am a scientist."),
  createCard("Jestem inżynierem.", "I am an engineer."),
  createCard("Jestem specjalistą.", "I am a specialist."),
  createCard("Jestem studentem.", "I am a student."),
  createCard("To jest uniwersytet.", "This is the university."),
  createCard("Studiuję ochronę środowiska.", "I study environmental protection."),
  createCard("Interesuje mnie ekologia.", "Ecology interests me."),
  createCard("To jest woda.", "This is water."),
  createCard("Badam jakość wody.", "I investigate the quality of the water."),
  createCard("To jest powietrze.", "This is air."),
  createCard("Analizuję zanieczyszczenie powietrza.", "I analyze the pollution of the air."),
  createCard("Lubię przyrodę.", "I like nature."),

  // Location & Movement
  createCard("Jestem w domu.", "I am at home."),
  createCard("Idę do domu.", "I am going home."),
  createCard("Jestem na uniwersytecie.", "I am at the university."),
  createCard("Idę na uniwersytet.", "I am going to the university."),
  createCard("Mieszkam w mieście.", "I live in the city."),
  createCard("Jadę do miasta.", "I am driving to the city."),
  createCard("To jest Kraków.", "This is Krakow."),
  createCard("Lubię Kraków.", "I like Krakow."),
  createCard("Jestem w Krakowie.", "I am in Krakow."),

  // Action, Objects & Negation
  createCard("Czytam książkę.", "I am reading a book."),
  createCard("Mam książkę.", "I have a book."),
  createCard("Szukam książki.", "I am looking for a book."),
  createCard("Piszę e-mail.", "I am writing an email."),
  createCard("Wysyłam e-mail.", "I am sending an email."),
  createCard("Nie mam e-maila.", "I do not have the email."),
  createCard("Piję kawę.", "I am drinking coffee."),
  createCard("Nie ma kawy.", "There is no coffee."),
  createCard("Potrzebuję kawy.", "I need coffee."),
  createCard("Zamawiam kawę.", "I am ordering coffee."),
  createCard("Chcę herbatę.", "I want tea."),
  createCard("Nie chcę herbaty.", "I do not want tea."),
  createCard("Lubię kawę.", "I like coffee."),
  createCard("Nie lubię kawy.", "I do not like coffee."),
  createCard("Jem obiad.", "I am eating lunch."),
  createCard("Nie jem obiadu.", "I am not eating lunch."),
  createCard("Widzę problem.", "I see a problem."),
  createCard("Nie widzę problemu.", "I do not see a problem."),

  // Environment & Elements
  createCard("To jest słońce.", "This is the sun."),
  createCard("Widzę słońce.", "I see the sun."),
  createCard("Nie ma słońca.", "There is no sun."),
  createCard("To jest deszcz.", "This is rain."),
  createCard("Pada deszcz.", "It is raining."),
  createCard("Nie lubię deszczu.", "I do not like rain."),
  createCard("To jest smog.", "This is smog."),
  createCard("W mieście jest smog.", "There is smog in the city."),
  createCard("Badamy smog.", "We are investigating the smog."),
  createCard("To jest rzeka.", "This is a river."),
  createCard("Widzę rzekę.", "I see a river."),
  createCard("Idę nad rzekę.", "I am going to the river."),
  createCard("To jest las.", "This is a forest."),
  createCard("Lubię las.", "I like the forest."),
  createCard("Idziemy na spacer.", "We are going for a walk."),
  createCard("To jest morze.", "This is the sea."),
  createCard("Jedziemy nad morze.", "We are going to the seaside."),
  createCard("Wieje wiatr.", "The wind is blowing."),
  createCard("To jest ziemia.", "This is earth/soil."),
  createCard("To jest ogień.", "This is fire."),
  createCard("Widzę drzewo.", "I see a tree."),
  createCard("Ptaki śpiewają.", "Birds are singing."),

  // Academic & Laboratory
  createCard("To jest laboratorium.", "This is the laboratory."),
  createCard("Pracuję w laboratorium.", "I work in the laboratory."),
  createCard("Wchodzę do laboratorium.", "I am entering the laboratory."),
  createCard("To jest mikroskop.", "This is a microscope."),
  createCard("Używam mikroskopu.", "I am using a microscope."),
  createCard("Mam wynik.", "I have a result."),
  createCard("Szukam wyniku.", "I am looking for the result."),
  createCard("Piszę raport.", "I am writing a report."),
  createCard("Analizuję raport.", "I am analyzing the report."),
  createCard("Wysyłam raport.", "I am sending the report."),

  // People & Social
  createCard("To jest profesor.", "This is the professor."),
  createCard("Słucham profesora.", "I am listening to the professor."),
  createCard("Rozmawiam z profesorem.", "I am talking with the professor."),
  createCard("To jest koleżanka.", "This is a colleague/friend."),
  createCard("Lubię koleżankę.", "I like the colleague."),
  createCard("Idę z koleżanką.", "I am going with the colleague."),
  createCard("To jest student.", "This is a student."),
  createCard("Widzę studenta.", "I see the student."),
  createCard("To jest grupa.", "This is a group."),
  createCard("Pracuję z grupą.", "I work with the group."),
  createCard("To jest człowiek.", "This is a human/man."),
  createCard("Nie znam tego człowieka.", "I do not know that man."),
  createCard("Widzę ludzi.", "I see people."),
  createCard("Tam są ludzie.", "There are people there."),
  createCard("To jest kobieta.", "This is a woman."),
  createCard("To jest mężczyzna.", "This is a man."),
  createCard("On jest dobrym człowiekiem.", "He is a good human."),
  createCard("Wszyscy to wiedzą.", "Everyone knows that."),
  createCard("Nikt nie wie.", "Nobody knows."),
  createCard("Kto to jest?", "Who is that?"),

  // Existence & States
  createCard("Jestem tutaj.", "I am here."),
  createCard("Nie ma mnie tam.", "I am not there."),
  createCard("Jesteś gotowy?", "Are you ready?"),
  createCard("On jest w domu.", "He is at home."),
  createCard("To jest możliwe.", "This is possible."),
  createCard("To nie jest łatwe.", "This is not easy."),
  createCard("Wszystko jest w porządku.", "Everything is in order."),
  createCard("To jest duży problem.", "This is a big problem."),
  createCard("To jest moja sprawa.", "This is my business."),

  // Possession, Needs & Knowledge
  createCard("Mam czas.", "I have time."),
  createCard("Nie mam czasu.", "I do not have time."),
  createCard("Mam pytanie.", "I have a question."),
  createCard("Masz rację.", "You are right."),
  createCard("Co masz?", "What do you have?"),
  createCard("Chcę to zrobić.", "I want to do this."),
  createCard("Nie chcę tego robić.", "I do not want to do this."),
  createCard("Potrzebuję pomocy.", "I need help."),
  createCard("On ma samochód.", "He has a car."),
  createCard("Nie mamy pieniędzy.", "We do not have money."),
  createCard("Wiem to.", "I know this."),
  createCard("Nie wiem.", "I do not know."),
  createCard("Wiesz, o co chodzi?", "Do you know what it's about?"),
  createCard("Rozumiem.", "I understand."),
  createCard("Nie rozumiem słowa.", "I do not understand the word."),
  createCard("Mówię po polsku.", "I speak Polish."),
  createCard("Co mówisz?", "What are you saying?"),
  createCard("On nic nie mówi.", "He says nothing."),
  createCard("Myślę, że tak.", "I think so."),
  createCard("Pamiętam ten dzień.", "I remember that day."),

  // Work & Daily Life
  createCard("Co robisz?", "What are you doing?"),
  createCard("Nic nie robię.", "I am doing nothing."),
  createCard("Idę do pracy.", "I am going to work."),
  createCard("Wracam z pracy.", "I am returning from work."),
  createCard("Praca jest ważna.", "Work is important."),
  createCard("Szukam pracy.", "I am looking for work."),
  createCard("Lubię moją pracę.", "I like my work."),
  createCard("To działa.", "It works."),
  createCard("Kupuję chleb.", "I am buying bread."),
  createCard("Jem śniadanie.", "I am eating breakfast."),

  // Time
  createCard("Jest teraz.", "It is now."),
  createCard("Teraz idę.", "I am going now."),
  createCard("Masz chwilę?", "Do you have a moment?"),
  createCard("To jest koniec.", "This is the end."),
  createCard("Czekam na ciebie.", "I am waiting for you."),
  createCard("Jutro będę.", "I will be there tomorrow."),
  createCard("To było wczoraj.", "That was yesterday."),
  createCard("Czas to pieniądz.", "Time is money."),
  createCard("Zawsze tak jest.", "It is always like this."),
  createCard("Nigdy tego nie robię.", "I never do that."),

  // Transport & Directions
  createCard("Jadę do domu.", "I am driving home."),
  createCard("Gdzie jest samochód?", "Where is the car?"),
  createCard("Nie mam samochodu.", "I do not have a car."),
  createCard("Idę na nogach.", "I am going on foot."),
  createCard("To jest długa droga.", "This is a long way."),
  createCard("Jesteśmy na miejscu.", "We have arrived."),
  createCard("Czekam na autobus.", "I am waiting for the bus."),
  createCard("Autobus już jedzie.", "The bus is coming."),
  createCard("Gdzie idziesz?", "Where are you walking?"),
  createCard("Wracam zaraz.", "I am returning right away."),
  createCard("Idź prosto.", "Go straight."),
  createCard("Skręć w prawo.", "Turn right."),
  createCard("Skręć w lewo.", "Turn left."),
  createCard("To jest blisko.", "This is close."),
  createCard("To jest daleko.", "This is far."),
  createCard("Patrz w górę.", "Look up."),
  createCard("Patrz w dół.", "Look down."),
  createCard("Stoję obok ciebie.", "I am standing next to you."),
  createCard("Jestem w środku.", "I am inside."),
  createCard("Czekam na zewnątrz.", "I am waiting outside."),

  // Qualities & Senses
  createCard("To jest dobry pomysł.", "This is a good idea."),
  createCard("To jest zły pomysł.", "This is a bad idea."),
  createCard("Mam nowy telefon.", "I have a new phone."),
  createCard("To jest stary dom.", "This is an old house."),
  createCard("Ona jest młoda.", "She is young."),
  createCard("Ten dzień jest długi.", "This day is long."),
  createCard("Język polski jest trudny.", "The Polish language is difficult."),
  createCard("To jest proste.", "This is simple."),
  createCard("Wszystko jest jasne.", "Everything is clear."),
  createCard("To jest ważne pytanie.", "This is an important question."),
  createCard("Widzę cię.", "I see you."),
  createCard("Nie widzę cię.", "I do not see you."),
  createCard("Słyszysz mnie?", "Do you hear me?"),
  createCard("Nic nie słyszę.", "I hear nothing."),
  createCard("Słucham muzyki.", "I am listening to music."),
  createCard("Patrzę na to.", "I am looking at this."),
  createCard("Wyglądasz dobrze.", "You look good."),
  createCard("Czuję to.", "I feel it."),
  createCard("To dobrze pachnie.", "It smells good."),
  createCard("Widzę światło.", "I see the light."),

  // Giving, Taking & Money
  createCard("Daj mi to.", "Give me this."),
  createCard("Co mi dasz?", "What will you give me?"),
  createCard("Biorę to.", "I am taking this."),
  createCard("Zabieram to do domu.", "I am taking this home."),
  createCard("Daję ci słowo.", "I give you my word."),
  createCard("Proszę o pomoc.", "I am asking for help."),
  createCard("Dziękuję za wszystko.", "Thank you for everything."),
  createCard("To jest dla ciebie.", "This is for you."),
  createCard("Nie mam nic dla ciebie.", "I have nothing for you."),
  createCard("Weź to.", "Take this."),
  createCard("Idę do sklepu.", "I am going to the shop."),
  createCard("Jestem w sklepie.", "I am in the shop."),
  createCard("Ile to kosztuje?", "How much does this cost?"),
  createCard("To jest tanie.", "This is cheap."),
  createCard("To jest drogie.", "This is expensive."),
  createCard("Płacę kartą.", "I am paying by card."),
  createCard("Płacę gotówką.", "I am paying with cash."),
  createCard("Chcę to kupić.", "I want to buy this."),
  createCard("Nie mam pieniędzy.", "I do not have money."),
  createCard("Masz drobne?", "Do you have change?"),

  // Life, Abstract & Logic
  createCard("To jest życie.", "This is life."),
  createCard("Takie jest życie.", "Such is life."),
  createCard("Kocham życie.", "I love life."),
  createCard("Świat jest mały.", "The world is small."),
  createCard("Mieszkam na świecie.", "I live in the world."),
  createCard("To jest historia.", "This is history/story."),
  createCard("Opowiem ci historię.", "I will tell you a story."),
  createCard("Koniec świata.", "The end of the world."),
  createCard("Szukam miejsca.", "I am looking for a place."),
  createCard("To jest moje miejsce.", "This is my place."),
  createCard("To jest prawda.", "This is the truth."),
  createCard("Mówię prawdę.", "I speak the truth."),
  createCard("Mam nadzieję.", "I have hope."),
  createCard("Wierzę ci.", "I believe you."),
  createCard("Wierzysz w Boga?", "Do you believe in God?"),
  createCard("To jest ważne.", "This is important."),
  createCard("To nie ma znaczenia.", "It doesn't matter."),
  createCard("Szukam sensu.", "I am looking for meaning."),
  createCard("To jest błąd.", "This is a mistake."),
  createCard("Mam pewność.", "I am sure."),
  createCard("Robię to, bo chcę.", "I do it because I want to."),
  createCard("Jeśli możesz, zrób to.", "If you can, do it."),
  createCard("Ale to nie jest prawda.", "But that is not true."),
  createCard("Albo ja, albo ty.", "Either me or you."),
  createCard("Więc idziemy.", "So we are going."),
  createCard("Tylko ty wiesz.", "Only you know."),
  createCard("Może jutro.", "Maybe tomorrow."),
  createCard("Nawet on to wie.", "Even he knows that."),
  createCard("Właśnie to robię.", "I am doing exactly that."),
  createCard("Dlatego pytam.", "That is why I ask."),

  // Day, Night & Feelings
  createCard("Dzień jest jasny.", "The day is bright."),
  createCard("To był dobry dzień.", "It was a good day."),
  createCard("Cały dzień pracuję.", "I work all day."),
  createCard("Już jest noc.", "It is already night."),
  createCard("W nocy śpię.", "At night I sleep."),
  createCard("Idę spać.", "I am going to sleep."),
  createCard("Rano piję kawę.", "In the morning I drink coffee."),
  createCard("Wieczorem jestem w domu.", "In the evening I am at home."),
  createCard("Spotkamy się wieczorem.", "We will meet in the evening."),
  createCard("Czekam do rana.", "I am waiting until morning."),
  createCard("Jest mi zimno.", "I am cold."),
  createCard("Jest mi ciepło.", "I am warm."),
  createCard("Jestem głodny.", "I am hungry - male."),
  createCard("Jestem głodna.", "I am hungry - female."),
  createCard("Chce mi się pić.", "I am thirsty."),
  createCard("Jestem zmęczony.", "I am tired."),
  createCard("Jestem szczęśliwy.", "I am happy."),
  createCard("On jest smutny.", "He is sad."),
  createCard("Boję się.", "I am afraid."),
  createCard("Martwię się o ciebie.", "I worry about you."),

  // Family & Body
  createCard("To jest moja rodzina.", "This is my family."),
  createCard("Mam dużą rodzinę.", "I have a big family."),
  createCard("To jest moja matka.", "This is my mother."),
  createCard("Kocham moją matkę.", "I love my mother."),
  createCard("To jest mój ojciec.", "This is my father."),
  createCard("Rozmawiam z ojcem.", "I am talking with father."),
  createCard("Mam brata.", "I have a brother."),
  createCard("Nie mam siostry.", "I do not have a sister."),
  createCard("To są moje dzieci.", "These are my children."),
  createCard("Bawię się z dziećmi.", "I am playing with the children."),
  createCard("To jest moja głowa.", "This is my head."),
  createCard("Boli mnie głowa.", "My head hurts."),
  createCard("Mam dwie ręce.", "I have two hands."),
  createCard("Trzymam to w ręce.", "I am holding this in my hand."),
  createCard("To jest twoje serce.", "This is your heart."),
  createCard("Masz dobre serce.", "You have a good heart."),
  createCard("Patrz pod nogi.", "Look under your feet."),
  createCard("Boli mnie noga.", "My leg hurts."),
  createCard("Otwórz oczy.", "Open your eyes."),
  createCard("Jestem zdrowy.", "I am healthy."),

  // Questions & Quantity
  createCard("Co to jest?", "What is this?"),
  createCard("Gdzie jesteś?", "Where are you?"),
  createCard("Kiedy wrócisz?", "When will you return?"),
  createCard("Kiedy masz czas?", "When do you have time?"),
  createCard("Dlaczego pytasz?", "Why do you ask?"),
  createCard("Dlaczego nie?", "Why not?"),
  createCard("Jak się masz?", "How are you?"),
  createCard("Jak to zrobić?", "How to do this?"),
  createCard("Jeden raz.", "One time."),
  createCard("Dwa razy.", "Two times."),
  createCard("Mam dużo pracy.", "I have a lot of work."),
  createCard("Masz mało czasu.", "You have little time."),
  createCard("Daj mi trochę.", "Give me a little."),
  createCard("To kosztuje dużo.", "This costs a lot."),
  createCard("Kilka dni temu.", "A few days ago."),
  createCard("Wszystko albo nic.", "Everything or nothing."),
  createCard("Tylko jeden.", "Only one."),
  createCard("Pierwszy raz.", "The first time."),

  // Home, Tech & Clothing
  createCard("To jest mój dom.", "This is my home."),
  createCard("Idę do pokoju.", "I am going to the room."),
  createCard("Jestem w pokoju.", "I am in the room."),
  createCard("To jest stół.", "This is a table."),
  createCard("Połóż to na stole.", "Put this on the table."),
  createCard("Gdzie jest klucz?", "Where is the key?"),
  createCard("Nie mam klucza.", "I do not have the key."),
  createCard("Otwórz drzwi.", "Open the door."),
  createCard("Zamknij okno.", "Close the window."),
  createCard("Gdzie jest mój telefon?", "Where is my phone?"),
  createCard("Dzwonię do ciebie.", "I am calling you."),
  createCard("Nie mam internetu.", "I do not have internet."),
  createCard("Czytasz wiadomości?", "Are you reading the news/messages?"),
  createCard("Napisz do mnie.", "Write to me."),
  createCard("To jest zdjęcie.", "This is a photo."),
  createCard("Robię zdjęcie.", "I am taking a photo."),
  createCard("Oglądam film.", "I am watching a movie."),
  createCard("Słucham radia.", "I am listening to the radio."),
  createCard("Komputer nie działa.", "The computer is not working."),
  createCard("Muszę się ubrać.", "I must get dressed."),
  createCard("Masz ładne buty.", "You have nice shoes."),
  createCard("Zdejmij buty.", "Take off your shoes."),
  createCard("Gdzie jest moja kurtka?", "Where is my jacket?"),
  createCard("Włóż płaszcz.", "Put on the coat."),
  createCard("Lubię ten kolor.", "I like this color."),
  createCard("To mi pasuje.", "This fits me."),
  createCard("Kupuję nową koszulę.", "I am buying a new shirt."),
  createCard("Jesteś gotowa do wyjścia?", "Are you ready to go out?"),
  createCard("Wyglądasz pięknie.", "You look beautiful."),

  // Food, Travel & Etiquette
  createCard("To jest smaczne.", "This is tasty."),
  createCard("To jest pyszne.", "This is delicious."),
  createCard("Smacznego!", "Bon appétit!"),
  createCard("Jem owoce.", "I am eating fruit."),
  createCard("Lubię warzywa.", "I like vegetables."),
  createCard("Kup chleb.", "Buy bread."),
  createCard("Nie jem mięsa.", "I do not eat meat."),
  createCard("Poproszę wodę.", "Please give me water."),
  createCard("Daj mi sól.", "Give me the salt."),
  createCard("Kolacja jest gotowa.", "Dinner is ready."),
  createCard("Mam bilet.", "I have a ticket."),
  createCard("Gdzie jest dworzec?", "Where is the station?"),
  createCard("Pociąg jedzie.", "The train is coming."),
  createCard("Wsiadam do pociągu.", "I am getting into the train."),
  createCard("Wysiadam tutaj.", "I am getting off here."),
  createCard("Spóźnię się.", "I will be late."),
  createCard("Droga jest wolna.", "The road is clear."),
  createCard("Jedziesz szybko.", "You are driving fast."),
  createCard("Jedź wolniej.", "Drive slower."),
  createCard("Szukam taksówki.", "I am looking for a taxi."),
  createCard("Dzień dobry.", "Good day."),
  createCard("Dobry wieczór.", "Good evening."),
  createCard("Do widzenia.", "Goodbye."),
  createCard("Miło mi.", "Nice to meet you."),
  createCard("Przepraszam.", "I apologize/Excuse me."),
  createCard("Bardzo dziękuję.", "Thank you very much."),
  createCard("Proszę bardzo.", "You are welcome."),
  createCard("Nie ma za co.", "You are welcome - informal."),
  createCard("Jak masz na imię?", "What is your name?"),
  createCard("Mam na imię...", "My name is...")
];
\`\`\`

## index.tsx
\`\`\`typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);\`\`\`

## routes/DashboardRoute.tsx
\`\`\`typescript
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
\`\`\`

## routes/StudyRoute.tsx
\`\`\`typescript
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StudySession } from '../components/StudySession';
import { useDeck } from '../contexts/DeckContext';
import { db } from '../services/db';
import { Card } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { applyStudyLimits } from '../services/studyLimits';

export const StudyRoute: React.FC = () => {
  const { updateCard, recordReview, undoReview, canUndo } = useDeck();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mode = searchParams.get('mode');
  const isCramMode = mode === 'cram';

  useEffect(() => {
    const loadCards = async () => {
      try {
        if (isCramMode) {
          const limit = parseInt(searchParams.get('limit') || '50', 10);
          const tag = searchParams.get('tag') || undefined;
          const cramCards = await db.getCramCards(limit, tag);
          setSessionCards(cramCards);
        } else {
          const due = await db.getDueCards();
          const reviewsToday = await db.getTodayReviewStats();
          const limited = applyStudyLimits(due, {
            dailyNewLimit: settings.dailyNewLimit,
            dailyReviewLimit: settings.dailyReviewLimit,
            reviewsToday
          });
          setSessionCards(limited);
        }
      } catch (error) {
        console.error("Failed to load cards", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCards();
  }, [settings.dailyNewLimit, settings.dailyReviewLimit, isCramMode, searchParams]);

  const handleUpdateCard = (card: Card) => {
    if (!isCramMode) {
      updateCard(card);
    }
  };

  const handleRecordReview = (card: Card) => {
    if (!isCramMode) {
      recordReview(card);
    }
  };

  const handleMarkKnown = (card: Card) => {
    if (!isCramMode) {
      const updatedCard = { ...card, status: 'known' as const };
      updateCard(updatedCard);
    }
  };

  if (isLoading) {
    return (
      <div data-testid="loading-skeleton" className="w-full max-w-4xl mx-auto p-4 space-y-6 animate-pulse flex flex-col items-center justify-center min-h-[60vh]">
        {/* Header Skeleton */}
        <div className="w-full flex justify-between items-center mb-4">
           <div className="h-4 bg-gray-200 rounded w-24"></div>
           <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>

        {/* Card Skeleton */}
        <div className="w-full bg-gray-100 border border-gray-200 rounded-lg h-[400px]"></div>

        {/* Controls Skeleton */}
        <div className="w-full max-w-md grid grid-cols-3 gap-4 mt-8">
           <div className="h-12 bg-gray-200 rounded-lg"></div>
           <div className="h-12 bg-gray-200 rounded-lg"></div>
           <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <StudySession 
      dueCards={sessionCards}
      onUpdateCard={handleUpdateCard}
      onRecordReview={handleRecordReview}
      onExit={() => navigate('/')}
      onUndo={isCramMode ? undefined : undoReview}
      canUndo={isCramMode ? false : canUndo}
      onMarkKnown={handleMarkKnown}
    />
  );
};
\`\`\`

## services/ai.ts
\`\`\`typescript
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const getApiKey = (): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) {
    return process.env.VITE_GEMINI_API_KEY;
  }
  return undefined;
};

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in .env.local');
  }

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch from Gemini API');
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

export const aiService = {
  async translateText(text: string): Promise<string> {
    const prompt = `Translate the following Polish text to English. Provide only the translation, no explanations.\n\nText: "${text}"`;
    return await callGemini(prompt);
  },

  async analyzeWord(word: string, contextSentence: string): Promise<{
    definition: string;
    partOfSpeech: string;
    contextMeaning: string;
  }> {
    const prompt = `
      Analyze the Polish word "${word}" in the context of the sentence: "${contextSentence}".
      Return a JSON object with the following fields:
      - definition: The general English definition of the word.
      - partOfSpeech: The part of speech (noun, verb, adjective, etc.) and grammatical case/form if applicable.
      - contextMeaning: The specific meaning of the word in this context.
      
      Return ONLY the JSON object, no markdown formatting.
    `;
    
    const result = await callGemini(prompt);
    try {
      const cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanResult);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return {
        definition: "Failed to analyze",
        partOfSpeech: "Unknown",
        contextMeaning: "Could not retrieve context"
      };
    }
  },

  async generateCardContent(sentence: string): Promise<{
    translation: string;
    notes: string;
  }> {
    const prompt = `
      Analyze the following Polish sentence for a flashcard: "${sentence}".
      Return a JSON object with:
      - translation: The natural English translation.
      - notes: Brief grammar notes, explaining any interesting cases, conjugations, or idioms used in the sentence. Keep it concise (max 2-3 sentences).
      
      Return ONLY the JSON object, no markdown formatting.
    `;

    const result = await callGemini(prompt);
    try {
      const cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanResult);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return {
        translation: "",
        notes: ""
      };
    }
  }
};
\`\`\`

## services/db.ts
\`\`\`typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Card, ReviewHistory } from '../types';

interface PolskiMineDB extends DBSchema {
  cards: {
    key: string;
    value: Card;
    indexes: { 'dueDate': string; 'status': string };
  };
  history: {
    key: string; // Date string 'YYYY-MM-DD'
    value: { date: string; count: number };
  };
}

const DB_NAME = 'polskimine-db';
const DB_VERSION = 2;

class DatabaseService {
  private dbPromise: Promise<IDBPDatabase<PolskiMineDB>> | null = null;

  private getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openDB<PolskiMineDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          let cardStore;
          if (!db.objectStoreNames.contains('cards')) {
            cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          } else {
            cardStore = transaction.objectStore('cards');
          }

          if (!cardStore.indexNames.contains('dueDate')) {
            cardStore.createIndex('dueDate', 'dueDate');
          }
          if (!cardStore.indexNames.contains('status')) {
            cardStore.createIndex('status', 'status');
          }

          if (!db.objectStoreNames.contains('history')) {
            db.createObjectStore('history', { keyPath: 'date' });
          }
        },
      });
    }
    return this.dbPromise;
  }

  async getCards(): Promise<Card[]> {
    const db = await this.getDB();
    return db.getAll('cards');
  }

  async saveCard(card: Card) {
    const db = await this.getDB();
    await db.put('cards', card);
  }

  async deleteCard(id: string) {
    const db = await this.getDB();
    await db.delete('cards', id);
  }

  async getHistory(): Promise<ReviewHistory> {
    const db = await this.getDB();
    const entries = await db.getAll('history');
    return entries.reduce((acc, entry) => {
      acc[entry.date] = entry.count;
      return acc;
    }, {} as ReviewHistory);
  }

  async incrementHistory(date: string, delta: number = 1) {
    const db = await this.getDB();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    
    const existing = await store.get(date);
    const currentCount = existing ? existing.count : 0;
    const count = Math.max(0, currentCount + delta);
    
    await store.put({ date, count });
    await tx.done;
  }
  
  async saveAllCards(cards: Card[]) {
    const db = await this.getDB();
    const tx = db.transaction('cards', 'readwrite');
    const store = tx.objectStore('cards');
    await Promise.all(cards.map(card => store.put(card)));
    await tx.done;
  }

  async saveFullHistory(history: ReviewHistory) {
    const db = await this.getDB();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    await Promise.all(
      Object.entries(history).map(([date, count]) => store.put({ date, count }))
    );
    await tx.done;
  }

  async clearAllCards() {
    const db = await this.getDB();
    await db.clear('cards');
  }

  async clearHistory() {
    const db = await this.getDB();
    await db.clear('history');
  }

  async getDueCards(now: Date = new Date()): Promise<Card[]> {
    const db = await this.getDB();
    const { getSRSDate } = await import('./srs');
    
    const srsToday = getSRSDate(now);
    // We want cards due on or before "today".
    // Since isCardDue checks isBefore(due, srsToday) || isSameDay(due, srsToday),
    // and srsToday is the start of the day (00:00:00),
    // we effectively want any card with dueDate < (srsToday + 1 day).
    const cutoffDate = new Date(srsToday);
    cutoffDate.setDate(cutoffDate.getDate() + 1);
    
    const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
    const dueCandidates = await db.getAllFromIndex('cards', 'dueDate', range);
    
    return dueCandidates.filter(card => card.status !== 'known');
  }

  async getStats(): Promise<{ total: number; due: number; learned: number }> {
    const db = await this.getDB();
    const { getSRSDate } = await import('./srs');
    
    const total = await db.count('cards');
    
    const srsToday = getSRSDate(new Date());
    const cutoffDate = new Date(srsToday);
    cutoffDate.setDate(cutoffDate.getDate() + 1);
    const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
    
    // We fetch candidates to filter out 'known' cards from the due count
    const dueCandidates = await db.getAllFromIndex('cards', 'dueDate', range);
    const due = dueCandidates.filter(c => c.status !== 'known').length;
    
    const graduatedCount = await db.countFromIndex('cards', 'status', 'graduated');
    const knownCount = await db.countFromIndex('cards', 'status', 'known');
    const learned = graduatedCount + knownCount;
    
    return { total, due, learned };
  }

  async getTodayReviewStats(): Promise<{ newCards: number; reviewCards: number }> {
    const db = await this.getDB();
    const allCards = await db.getAll('cards');
    const { getSRSDate } = await import('./srs');
    
    const srsToday = getSRSDate(new Date());
    const nextDay = new Date(srsToday);
    nextDay.setDate(nextDay.getDate() + 1);
    
    let newCards = 0;
    let reviewCards = 0;

    for (const card of allCards) {
      if (card.last_review) {
        const reviewDate = new Date(card.last_review);
        if (reviewDate >= srsToday && reviewDate < nextDay) {
          if ((card.reps || 0) === 1) {
            newCards++;
          } else if ((card.reps || 0) > 1) {
            reviewCards++;
          }
        }
      }
    }
    return { newCards, reviewCards };
  }

  async getCramCards(limit: number, tag?: string): Promise<Card[]> {
    const db = await this.getDB();
    let cards = await db.getAll('cards');
    
    // Filter by tag if provided
    if (tag) {
      cards = cards.filter(card => card.tags && card.tags.includes(tag));
    }
    
    // Exclude 'known' cards unless specifically requested? 
    // For now, we exclude them to be consistent with study mode, 
    // but cramming usually implies reviewing everything.
    // Let's include everything except maybe suspended cards if we had that status.
    // Actually, 'known' in this app seems to mean "I know this perfectly, don't show it again".
    // But for cramming, maybe I want to review even those?
    // Let's stick to active cards (new, learning, graduated).
    cards = cards.filter(card => card.status !== 'known');

    // Shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    
    return cards.slice(0, limit);
  }
}

export const db = new DatabaseService();
\`\`\`

## services/srs.ts
\`\`\`typescript
import { addDays, startOfDay, subHours, isBefore, isSameDay, addMinutes } from 'date-fns';
import { Card, Grade, UserSettings, CardStatus } from '../types';
import { SRS_CONFIG, FSRS_DEFAULTS } from '../constants';
import { FSRS, Card as FSRSCard, Rating, State, generatorParameters } from 'ts-fsrs';

export const getSRSDate = (date: Date = new Date()): Date => {
  // Shift time back by CUTOFF_HOUR so that "today" starts at 4 AM
  return startOfDay(subHours(date, SRS_CONFIG.CUTOFF_HOUR));
};

const mapGradeToRating = (grade: Grade): Rating => {
  switch (grade) {
    case 'Again': return Rating.Again;
    case 'Hard': return Rating.Hard;
    case 'Good': return Rating.Good;
    case 'Easy': return Rating.Easy;
  }
};

const mapStateToStatus = (state: State): CardStatus => {
  if (state === State.New) return 'new';
  if (state === State.Learning || state === State.Relearning) return 'learning';
  return 'graduated';
};

/**
 * Calculates the next interval and scheduling info using FSRS.
 */
export const calculateNextReview = (card: Card, grade: Grade, settings?: UserSettings['fsrs']): Card => {
  const params = generatorParameters({
    request_retention: settings?.request_retention || FSRS_DEFAULTS.request_retention,
    maximum_interval: settings?.maximum_interval || FSRS_DEFAULTS.maximum_interval,
    w: settings?.w || FSRS_DEFAULTS.w,
    enable_fuzz: settings?.enable_fuzzing ?? FSRS_DEFAULTS.enable_fuzzing,
  });

  const f = new FSRS(params);

  // Convert our Card to FSRSCard
  // If FSRS fields are missing, we treat it as a New card or try to migrate
  // For simplicity, if state is missing, we treat as New.
  const now = new Date();
  
  const fsrsCard: FSRSCard = {
    due: new Date(card.dueDate),
    stability: card.stability || 0,
    difficulty: card.difficulty || 0,
    elapsed_days: card.elapsed_days || 0,
    scheduled_days: card.scheduled_days || 0,
    reps: card.reps || 0,
    lapses: card.lapses || 0,
    state: card.state ?? State.New,
    last_review: card.last_review ? new Date(card.last_review) : undefined
  } as FSRSCard;

  // If it's a legacy card (no state) but has been reviewed (interval > 0), 
  // we might want to initialize it better, but for now let's just let FSRS handle it from 'New' 
  // or if we want to be smarter, we could create a card with some initial stability.
  // However, the safest path for migration without complex logic is to start FSRS tracking from now.
  // If the card was "graduated" in SM-2, it might be annoying to reset to "New".
  // A simple hack: if status is 'graduated' or 'review', set state to Review and guess stability?
  // Let's stick to the basics: if it's the first time FSRS sees it, it treats it as a fresh interaction 
  // unless we manually construct the object.
  // BUT, `f.repeat` takes a card and a rating.
  
  // Fix: If we pass a "New" card with a past due date, FSRS handles it.
  
  const rating = mapGradeToRating(grade);

  // Custom Learning Steps Logic: New -> 10m -> Graduate
  const isNew = card.state === State.New || (!card.state && (card.reps || 0) === 0);
  const isLearningStep1 = card.learningStep === 1;

  // Case 1: New Card + Good -> Enter Learning Step 1 (10m)
  if (isNew && grade === 'Good') {
    // Run FSRS to initialize Stability/Difficulty as if it was graduating
    const schedulingCards = f.repeat(fsrsCard, now);
    const { due, ...log } = schedulingCards[rating].card;

    return {
      ...card,
      ...log,
      state: State.Learning,
      status: 'learning',
      dueDate: addMinutes(now, 10).toISOString(),
      learningStep: 1, // Mark as waiting for 2nd review
      scheduled_days: 0,
      elapsed_days: 0
    };
  }

  // Case 2: Learning Step 1 + Good -> Graduate
  if (isLearningStep1 && grade === 'Good') {
    // We want to graduate using the Stability we initialized in Step 1.
    // We pass the card (which is in State.Learning) to FSRS.
    // FSRS should calculate the next interval based on S.
    const schedulingCards = f.repeat(fsrsCard, now);
    const { due, ...log } = schedulingCards[rating].card;

    return {
      ...card,
      ...log,
      status: mapStateToStatus(log.state),
      learningStep: undefined // Clear step
    };
  }

  // Case 3: Learning Step 1 + Again -> Reset to 1m
  if (isLearningStep1 && grade === 'Again') {
     const schedulingCards = f.repeat(fsrsCard, now);
     const { due, ...log } = schedulingCards[rating].card;
     return {
        ...card,
        ...log,
        state: State.Learning,
        status: 'learning',
        dueDate: addMinutes(now, 1).toISOString(),
        learningStep: 1 // Stay in step 1
     };
  }
  
  const schedulingCards = f.repeat(fsrsCard, now);
  
  // schedulingCards[rating] gives us the Log object which contains the new card state
  const log = schedulingCards[rating].card;
  const tentativeStatus = mapStateToStatus(log.state);
  const status = card.status === 'graduated' && tentativeStatus === 'learning' && grade !== 'Again'
    ? 'graduated'
    : tentativeStatus;

  return {
    ...card,
    dueDate: log.due.toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    scheduled_days: log.scheduled_days,
    reps: log.reps,
    lapses: log.lapses,
    state: log.state,
    last_review: log.last_review ? log.last_review.toISOString() : now.toISOString(),
    status,
    // Update legacy fields for backward compatibility if needed, or just sync them
    interval: log.scheduled_days,
    learningStep: undefined // Ensure cleared for normal reviews
  };
};

/**
 * Checks if a card is due for review.
 */
export const isCardDue = (card: Card, now: Date = new Date()): boolean => {
  const due = new Date(card.dueDate);
  
  // Strict timing for learning steps (intraday)
  if (card.status === 'learning' || card.state === State.Learning || card.learningStep) {
      return due <= now;
  }

  const srsToday = getSRSDate(now);
  // FSRS uses exact timestamps, but for UI "Due Today" logic, we usually stick to the cutoff.
  // However, FSRS 'due' is a specific point in time.
  // If we want to show cards that are due *now* (minutes/hours level), we check due <= now.
  // If we want "Due Today" style (Anki), we check if due < tomorrow_cutoff.
  
  // Let's stick to the "Due by cutoff" logic for consistency with the rest of the app.
  return isBefore(due, srsToday) || isSameDay(due, srsToday) || due <= now;
};
\`\`\`

## services/studyLimits.ts
\`\`\`typescript
import { Card, UserSettings } from '../types';
import { State } from 'ts-fsrs';

interface LimitOptions {
  dailyNewLimit?: number;
  dailyReviewLimit?: number;
  reviewsToday?: {
    newCards: number;
    reviewCards: number;
  };
}

const isNewCard = (card: Card) => {
  // First consider explicit status tagging
  if (card.status === 'new') return true;

  // Check if card is truly new (never reviewed)
  // State.New is 0 in ts-fsrs
  if (card.state !== undefined) {
    return card.state === State.New;
  }
  // Fallback for legacy cards or missing state
  return (card.reps || 0) === 0;
};

const hasLimit = (value?: number) => typeof value === 'number' && value > 0;

export const applyStudyLimits = (cards: Card[], settings: LimitOptions): Card[] => {
  const { dailyNewLimit, dailyReviewLimit, reviewsToday } = settings;
  const limitedCards: Card[] = [];
  
  let newCount = reviewsToday?.newCards || 0;
  let reviewCount = reviewsToday?.reviewCards || 0;

  for (const card of cards) {
    const isNew = isNewCard(card);

    if (isNew) {
      if (hasLimit(dailyNewLimit)) {
        if (newCount >= (dailyNewLimit as number)) {
          continue;
        }
        newCount++;
        limitedCards.push(card);
      } else {
        limitedCards.push(card);
      }
    } else {
      // Review card
      if (hasLimit(dailyReviewLimit)) {
        if (reviewCount >= (dailyReviewLimit as number)) {
          continue;
        }
        reviewCount++;
        limitedCards.push(card);
      } else {
        limitedCards.push(card);
      }
    }
  }

  return limitedCards;
};
\`\`\`

## types.ts
\`\`\`typescript
import { Card as FSRSCard, State as FSRSState } from 'ts-fsrs';

export type CardStatus = 'new' | 'learning' | 'graduated' | 'known';

export interface Card extends Partial<FSRSCard> {
  id: string;
  targetSentence: string; // "Ten samochód jest szybki"
  targetWord?: string; // Optional: "samochód". If empty, whole sentence is the target.
  nativeTranslation: string; // "This car is fast"
  notes: string; // "Masc. sing. nominative"
  tags?: string[]; // Optional tags for filtering
  status: CardStatus;
  
  // Legacy SM-2 fields (kept for migration/fallback if needed, though FSRS handles scheduling)
  interval: number; // Days
  easeFactor: number; // Default 2.5
  dueDate: string; // ISO Date string
  
  // FSRS specific fields (optional during migration)
  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reps?: number;
  lapses?: number;
  state?: FSRSState;
  last_review?: string; // ISO Date string
  learningStep?: number; // 1 = waiting for 10m review
}

export type Grade = 'Again' | 'Hard' | 'Good' | 'Easy';

export type ReviewHistory = Record<string, number>; // 'YYYY-MM-DD': count

export interface DeckStats {
  total: number;
  due: number;
  learned: number;
  streak: number;
  totalReviews: number;
  longestStreak: number;
}

export interface UserSettings {
  dailyNewLimit: number;
  dailyReviewLimit: number;
  autoPlayAudio: boolean;
  showTranslationAfterFlip: boolean;
  fsrs: {
    request_retention: number; // 0.8 to 0.99
    maximum_interval: number; // Days
    w?: number[]; // Weights
    enable_fuzzing?: boolean;
  }
}
\`\`\`

## vite-env.d.ts
\`\`\`typescript
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
\`\`\`

## vite.config.ts
\`\`\`typescript
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { version } from './package.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        '__APP_VERSION__': JSON.stringify(version),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        coverage: {
          reporter: ['text', 'lcov'],
          include: [
            'services/**/*.ts',
            'components/**/*.tsx',
            'contexts/**/*.tsx',
            'routes/**/*.tsx'
          ]
        }
      }
    };
});
\`\`\`

## vitest.setup.ts
\`\`\`typescript
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

if (typeof window !== 'undefined') {
  const speechSynthesisMock = {
    getVoices: vi.fn(() => []),
    speak: vi.fn(),
    cancel: vi.fn(),
    onvoiceschanged: null as SpeechSynthesis['onvoiceschanged'],
  };

  Object.defineProperty(window, 'speechSynthesis', {
    value: speechSynthesisMock,
    writable: true,
  });

  if (!('SpeechSynthesisUtterance' in window)) {
    class MockUtterance {
      text: string;
      lang?: string;
      constructor(text: string) {
        this.text = text;
      }
    }
    // @ts-expect-error jsdom polyfill for tests only
    window.SpeechSynthesisUtterance = MockUtterance;
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
\`\`\`
