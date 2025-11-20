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
