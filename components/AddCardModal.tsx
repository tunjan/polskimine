import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: Card) => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [form, setForm] = useState({
    sentence: '',
    targetWord: '',
    translation: '',
    notes: ''
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.sentence.toLowerCase().includes(form.targetWord.toLowerCase())) {
      setError('Target word missing from sentence.');
      return;
    }
    if (!form.sentence || !form.targetWord || !form.translation) {
      setError('Missing required fields.');
      return;
    }

    const newCard: Card = {
      id: uuidv4(),
      targetSentence: form.sentence,
      targetWord: form.targetWord,
      nativeTranslation: form.translation,
      notes: form.notes,
      status: 'learning',
      interval: 0,
      easeFactor: 2.5,
      dueDate: new Date().toISOString(),
    };

    onAdd(newCard);
    setForm({ sentence: '', targetWord: '', translation: '', notes: '' });
    onClose();
  };

  const inputClass = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 p-4">
      <div className="bg-white border border-gray-200 rounded-md shadow-sm w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-900">New Entry</h2>
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
            <label className="block text-xs font-mono text-gray-500 uppercase mb-1.5">Polish Sentence</label>
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
              <label className="block text-xs font-mono text-gray-500 uppercase mb-1.5">Target Word</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g., samochód"
                value={form.targetWord}
                onChange={e => setForm({...form, targetWord: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-500 uppercase mb-1.5">Translation</label>
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