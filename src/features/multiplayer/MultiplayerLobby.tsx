import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ButtonLoader } from '@/components/ui/game-ui';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { multiplayerService } from '@/services/multiplayer';
import clsx from 'clsx';

export const MultiplayerLobby: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [level, setLevel] = useState('A1');
  const [language, setLanguage] = useState('polish');
  const [timerDuration, setTimerDuration] = useState('10');
  const [maxPlayers, setMaxPlayers] = useState('4');

  const handleCreate = async () => {
    if (!user || !profile?.username) {
      toast.error('You need an account with a username to host.');
      return;
    }

    setIsCreating(true);
    try {
      const room = await multiplayerService.createRoom(
        user.id,
        profile.username,
        language,
        level,
        parseInt(timerDuration),
        parseInt(maxPlayers)
      );
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
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-20 md:pb-24 space-y-10 sm:space-y-12 md:space-y-16">
        {/* Editorial Hero */}
        <div className="text-center space-y-6 sm:space-y-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-terracotta/10 dark:bg-terracotta/20 text-terracotta dark:text-terracotta-light">
            <Sparkles size={28} className="sm:w-8 sm:h-8" strokeWidth={1.5} />
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-light tracking-tight text-foreground leading-[1.1] px-4">
              Deck Wars
            </h1>
            <p className="text-base sm:text-lg md:text-xl font-serif text-muted-foreground font-light leading-relaxed max-w-lg mx-auto px-4">
              Challenge others in real-time. Test your knowledge. Compete with grace.
            </p>
          </div>
        </div>

        {/* Join Existing Room */}
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-serif text-muted-foreground font-light tracking-wide">
              Join existing game
            </label>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 w-full sm:w-auto bg-transparent border-b-2 border-border focus:border-terracotta dark:focus:border-terracotta-light outline-none px-1 py-3 font-serif text-xl sm:text-2xl tracking-[0.15em] sm:tracking-[0.3em] uppercase placeholder:text-muted-foreground/30 placeholder:tracking-widest sm:placeholder:tracking-[0.2em] transition-colors min-h-12 sm:min-h-0"
                maxLength={6}
              />
              <button
                onClick={handleJoin}
                disabled={isJoining || roomCode.length < 6}
                className={clsx(
                  'w-full sm:w-auto px-8 py-3 sm:py-3 rounded-2xl font-serif text-sm transition-all min-h-12 sm:min-h-0 active:scale-95',
                  isJoining || roomCode.length < 6
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-terracotta dark:bg-terracotta-light text-white hover:opacity-90'
                )}
              >
                {isJoining ? <ButtonLoader /> : 'Join'}
              </button>
            </div>
          </div>
        </div>

        {/* Elegant Divider */}
        <div className="relative py-6 sm:py-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 sm:px-6 bg-background text-[10px] sm:text-xs font-serif text-muted-foreground font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase">
              or create new
            </span>
          </div>
        </div>

        {/* Create New Room */}
        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-5 sm:space-y-6">
            {/* Language & Level */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2.5 sm:space-y-3">
                <label className="block text-xs sm:text-sm font-serif text-muted-foreground font-light">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-transparent border-b border-border focus:border-terracotta dark:focus:border-terracotta-light outline-none py-2.5 sm:py-2 font-serif text-sm sm:text-base text-foreground transition-colors cursor-pointer min-h-11 sm:min-h-0"
                >
                  <option value="polish">Polish</option>
                  <option value="spanish">Spanish</option>
                  <option value="japanese">Japanese</option>
                  <option value="norwegian">Norwegian</option>
                </select>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                <label className="block text-xs sm:text-sm font-serif text-muted-foreground font-light">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-transparent border-b border-border focus:border-terracotta dark:focus:border-terracotta-light outline-none py-2.5 sm:py-2 font-serif text-sm sm:text-base text-foreground transition-colors cursor-pointer min-h-11 sm:min-h-0"
                >
                  {['A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Timer & Max Players */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2.5 sm:space-y-3">
                <label className="block text-xs sm:text-sm font-serif text-muted-foreground font-light">Timer</label>
                <select
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(e.target.value)}
                  className="w-full bg-transparent border-b border-border focus:border-terracotta dark:focus:border-terracotta-light outline-none py-2.5 sm:py-2 font-serif text-sm sm:text-base text-foreground transition-colors cursor-pointer min-h-11 sm:min-h-0"
                >
                  {['10', '15', '20', '30', '60'].map((t) => (
                    <option key={t} value={t}>
                      {t} seconds
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                <label className="block text-xs sm:text-sm font-serif text-muted-foreground font-light">Max Players</label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className="w-full bg-transparent border-b border-border focus:border-terracotta dark:focus:border-terracotta-light outline-none py-2.5 sm:py-2 font-serif text-sm sm:text-base text-foreground transition-colors cursor-pointer min-h-11 sm:min-h-0"
                >
                  {['2', '4', '8', '16', '32'].map((p) => (
                    <option key={p} value={p}>
                      {p} players
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className={clsx(
              'w-full py-4 sm:py-5 rounded-2xl font-serif text-sm sm:text-base tracking-wide transition-all min-h-14 sm:min-h-0',
              isCreating
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-terracotta dark:bg-terracotta-light text-white hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]'
            )}
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-3">
                <ButtonLoader />
                Creating...
              </span>
            ) : (
              'Create Lobby'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
