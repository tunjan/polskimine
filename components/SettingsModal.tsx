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
