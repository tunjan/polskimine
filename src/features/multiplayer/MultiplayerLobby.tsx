import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, Loader2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { multiplayerService } from '@/services/multiplayer';
import { EditorialSelect } from '@/components/form/EditorialSelect';

export const MultiplayerLobby: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [level, setLevel] = useState('A1');
  const [language, setLanguage] = useState('polish');

  const handleCreate = async () => {
    if (!user || !profile?.username) {
      toast.error('You need an account with a username to host.');
      return;
    }

    setIsCreating(true);
    try {
      const room = await multiplayerService.createRoom(user.id, profile.username, language, level);
      navigate(`/multiplayer/${room.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !profile?.username) {
      toast.error('Sign in to join a lobby.');
      return;
    }

    const normalizedCode = roomCode.trim().toUpperCase();
    if (normalizedCode.length !== 6) {
      toast.error('Room code must be 6 letters.');
      return;
    }

    setIsJoining(true);
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('code', normalizedCode)
        .single();

      if (error || !data) {
        throw error ?? new Error('Room not found');
      }

      await multiplayerService.joinRoom(data.id, user.id, profile.username);
      navigate(`/multiplayer/${data.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Invalid room code');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
          <Users size={32} />
        </div>
        <h1 className="text-4xl font-light tracking-tight">Deck Wars</h1>
        <p className="text-muted-foreground">Compete in real-time battles.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-xl space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Join Existing</h3>
          <div className="flex gap-2">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              className="flex-1 bg-secondary/20 border-border border rounded-md px-4 font-mono uppercase tracking-widest outline-none focus:border-primary transition-colors"
              maxLength={6}
            />
            <button
              onClick={handleJoin}
              disabled={isJoining || roomCode.length < 6}
              className="bg-secondary hover:bg-secondary/80 text-foreground px-4 rounded-md disabled:opacity-50 flex items-center justify-center"
            >
              {isJoining ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            </button>
          </div>
        </div>

        <div className="relative flex items-center py-2">
          <div className="grow border-t border-border"></div>
          <span className="shrink-0 mx-4 text-xs text-muted-foreground font-mono uppercase">OR CREATE NEW</span>
          <div className="grow border-t border-border"></div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Language</label>
              <EditorialSelect
                value={language}
                onChange={setLanguage}
                options={[
                  { value: 'polish', label: 'Polish' },
                  { value: 'spanish', label: 'Spanish' },
                  { value: 'japanese', label: 'Japanese' },
                  { value: 'norwegian', label: 'Norwegian' },
                ]}
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Level</label>
              <EditorialSelect
                value={level}
                onChange={setLevel}
                options={['A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => ({ value: lvl, label: lvl }))}
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {isCreating ? <Loader2 className="animate-spin" /> : <Globe size={16} />}
            Create Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
