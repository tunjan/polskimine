import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: Card) => void;
  initialCard?: Card;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAdd, initialCard }) => {
  const [form, setForm] = useState({
    sentence: '',
    targetWord: '',
    translation: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

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
      status: initialCard ? initialCard.status : 'learning',
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
            </div>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g., Ten samochód jest szybki"
              value={form.sentence}
              onChange={e => setForm({...form, sentence: e.target.value})}
              autoFocus
            />
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
};