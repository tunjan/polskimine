import React, { useEffect, useState } from 'react';
import { Skull, AlertTriangle } from 'lucide-react';
import { useSabotage, CurseType } from '@/contexts/SabotageContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const CURSE_DETAILS: Record<CurseType, { name: string; description: string }> = {
  comic_sans: { name: 'Comic Sans Hell', description: 'Your font has been downgraded. Permanently.' },
  blur: { name: 'Beer Goggles', description: 'Everything is a little bit fuzzy...' },
  uwu: { name: 'The UwUifier', description: 'Your deck is feeling... kawaiii.' },
  rotate: { name: 'Australian Mode', description: 'Hope you can read upside down.' },
  gaslight: { name: 'Gaslight Pro', description: 'Are you sure that was the translation?' },
};

export const SabotageNotification: React.FC = () => {
  const { notificationQueue, dismissNotification } = useSabotage();
  const [isOpen, setIsOpen] = useState(false);
  const [shake, setShake] = useState(false);

  const currentNotification = notificationQueue[0];

  useEffect(() => {
    if (currentNotification) {
      setIsOpen(true);
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [currentNotification]);

  if (!currentNotification) return null;

  const details = CURSE_DETAILS[currentNotification.curse_type] || { name: 'Unknown Curse', description: 'Something bad happened.' };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dismissNotification()}>
      <DialogContent
        className={cn(
          'sm:max-w-md border-destructive/50 bg-destructive/10 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)]',
          shake && 'animate-shake'
        )}
      >
        <div className="flex flex-col items-center text-center space-y-6 py-6">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive blur-2xl opacity-20 animate-pulse rounded-full" />
            <div className="relative bg-background p-4 rounded-full border-2 border-destructive shadow-xl">
              <Skull size={48} className="text-destructive animate-[wiggle_1s_ease-in-out_infinite]" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter text-destructive uppercase">Sabotaged!</h2>
            <p className="text-lg font-medium text-foreground">
              <span className="font-bold text-destructive">{currentNotification.sender_username}</span> attacked you!
            </p>
          </div>

            <div className="w-full bg-background/50 border border-destructive/20 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-destructive mb-2">
                <AlertTriangle size={16} />
                <span className="text-xs font-mono uppercase tracking-widest">Active Effect</span>
              </div>
              <h3 className="text-xl font-bold mb-1">{details.name}</h3>
              <p className="text-sm text-muted-foreground">{details.description}</p>
            </div>

          <button
            onClick={dismissNotification}
            className="w-full bg-destructive text-destructive-foreground font-bold uppercase tracking-widest py-4 rounded-md hover:bg-destructive/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Accept My Fate
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
