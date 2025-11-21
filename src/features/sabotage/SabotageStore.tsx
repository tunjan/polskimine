import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Skull, Type, EyeOff, RefreshCcw, Zap } from 'lucide-react';

interface Profile {
  id: string;
  username: string | null;
}

const CURSES = [
  { id: 'comic_sans', name: 'Comic Sans Hell', cost: 200, icon: Type, desc: 'Forces their font to Comic Sans.' },
  { id: 'blur', name: 'Beer Goggles', cost: 350, icon: EyeOff, desc: 'Makes text pulse in and out of focus.' },
  { id: 'uwu', name: 'The UwUifier', cost: 500, icon: Skull, desc: 'Converts all sentences into UwU speak.' },
  { id: 'rotate', name: 'Australian Mode', cost: 600, icon: RefreshCcw, desc: 'Upside down text. Good luck.' },
  { id: 'gaslight', name: 'Gaslight Pro', cost: 1000, icon: Zap, desc: 'Randomly shows the WRONG answer before correcting itself.' },
] as const;

interface SabotageStoreProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SabotageStore: React.FC<SabotageStoreProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const [victims, setVictims] = useState<Profile[]>([]);
  const [selectedVictim, setSelectedVictim] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchVictims = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .neq('id', user?.id)
        .limit(20);

      if (error) {
        toast.error('Failed to load victims.');
        console.error(error);
        return;
      }

      setVictims(data ?? []);
    };

    fetchVictims();
  }, [isOpen, user?.id]);

  const handlePurchase = async (curseId: string, cost: number) => {
    if (!selectedVictim) {
      toast.error('Select a victim first!');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.rpc('buy_curse', {
      target_user_id: selectedVictim,
      curse_type_input: curseId,
      cost,
    });

    setLoading(false);

    if (error) {
      toast.error('Transaction failed.');
      console.error(error);
      return;
    }

    if (data?.success) {
      toast.success('Curse cast! Pure evil.');
      onClose();
      return;
    }

    toast.error(data?.message ?? 'Something went wrong.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-popover border border-destructive/20 text-popover-foreground">
        <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-destructive">
          <Skull /> The Sabotage Store
        </DialogTitle>

        <div className="mb-4 p-2 bg-destructive/10 rounded border border-destructive/20 text-center">
          Your Balance: <span className="font-mono font-bold text-xl">{profile?.xp ?? 0} XP</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Select Victim</label>
            <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
              {victims.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVictim(v.id)}
                  className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap transition-all ${
                    selectedVictim === v.id
                      ? 'bg-destructive text-destructive-foreground border-destructive'
                      : 'border-border hover:bg-secondary text-muted-foreground'
                  }`}
                >
                  {v.username ?? '???'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {CURSES.map(curse => (
              <button
                key={curse.id}
                disabled={loading || !selectedVictim}
                onClick={() => handlePurchase(curse.id, curse.cost)}
                className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-destructive/50 hover:bg-destructive/5 transition-all disabled:opacity-50 text-left group"
              >
                <div className="p-2 bg-secondary rounded group-hover:bg-destructive/20 transition-colors">
                  <curse.icon size={20} className="text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{curse.name}</div>
                  <div className="text-xs text-muted-foreground">{curse.desc}</div>
                </div>
                <div className="font-mono text-destructive text-sm whitespace-nowrap">-{curse.cost} XP</div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};