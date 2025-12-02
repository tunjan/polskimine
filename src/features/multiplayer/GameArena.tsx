import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Trophy, Copy, Crown } from 'lucide-react';
import { GameLoader, ButtonLoader } from '@/components/ui/game-ui';
import { toast } from 'sonner';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { multiplayerService } from '@/services/multiplayer';
import type { GamePlayer, GameRoom } from '@/types/multiplayer';

const TIMER_SECONDS = 10;

export const GameArena: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomId || !user) return;

    const fetchInitialState = async () => {
      const { data: roomData } = await supabase.from('game_rooms').select('*').eq('id', roomId).single();
      const { data: playersData } = await supabase.from('game_players').select('*').eq('room_id', roomId);

      if (roomData) {
        setRoom(roomData as GameRoom);
        setIsHost(roomData.host_id === user.id);
      }
      if (playersData) {
        setPlayers(playersData as GamePlayer[]);
      }
    };

    fetchInitialState();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` }, (payload) => {
        setRoom(payload.new as GameRoom);
        if (payload.new && 'host_id' in payload.new) {
          setIsHost((payload.new as GameRoom).host_id === user.id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: `room_id=eq.${roomId}` }, async () => {
        const { data } = await supabase.from('game_players').select('*').eq('room_id', roomId);
        if (data) {
          setPlayers(data as GamePlayer[]);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, user]);

  const roomRef = useRef(room);
  useEffect(() => { roomRef.current = room; }, [room]);

  const handleNextQuestion = useCallback(async () => {
    const r = roomRef.current;
    if (!r) return;
    const nextIdx = r.current_question_index + 1;
    if (nextIdx >= r.questions.length) {
      await multiplayerService.endGame(r.id);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else {
      await multiplayerService.nextQuestion(r.id, nextIdx);
    }
  }, []);

  // Reset timer when question changes
  useEffect(() => {
    if (room?.status === 'playing') {
      setTimeLeft(room.timer_duration || TIMER_SECONDS);
      setSelectedAnswer(null);
    }
  }, [room?.current_question_index, room?.status, room?.timer_duration]);

  // Timer countdown
  useEffect(() => {
    if (room?.status !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (isHost) {
            handleNextQuestion();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [room?.status, isHost, handleNextQuestion]);

  const handleStartGame = async () => {
    if (!room) return;

    const apiKey = settings.geminiApiKey;
    if (!apiKey) {
      toast.error('Host needs a Gemini API Key in Settings.');
      return;
    }

    setIsGenerating(true);
    try {
      const questions = await multiplayerService.generateQuestions(room.language, room.level, 10, apiKey);
      if (!questions.length) {
        throw new Error('AI generation failed');
      }
      await multiplayerService.startGame(room.id, questions);
    } catch (error) {
      console.error(error);
      toast.error('Failed to start game');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer || timeLeft <= 0 || !room || !user) return;
    setSelectedAnswer(answer);

    const currentQuestion = room.questions[room.current_question_index];
    if (!currentQuestion) return;

    if (answer === currentQuestion.correctAnswer) {
      const myPlayer = players.find((p) => p.user_id === user.id);
      if (!myPlayer) return;

      const points = 100 + timeLeft * 10;
      try {
        await multiplayerService.updateScore(myPlayer.id, myPlayer.score + points);
        toast.success(`Correct! +${points}`);
      } catch (error) {
        console.error(error);
        toast.error('Failed to update score');
      }
    } else {
      toast.error('Wrong answer');
    }
  };

  const copyCode = async () => {
    if (!room?.code) return;
    try {
      await navigator.clipboard.writeText(room.code);
      toast.success('Code copied');
    } catch (error) {
      console.error(error);
      toast.error('Unable to copy code');
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GameLoader text="Loading arena..." />
      </div>
    );
  }

  if (room.status === 'waiting') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-20 md:pb-24 space-y-10 sm:space-y-12 md:space-y-16">
          {/* Elegant Lobby Header */}
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm font-serif text-muted-foreground font-light tracking-wide">Waiting Room</p>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-light tracking-tight text-foreground">
                {room.code}
              </h1>
              <button
                onClick={copyCode}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-serif text-muted-foreground hover:text-terracotta dark:hover:text-terracotta-light transition-colors group active:scale-95 min-h-10 sm:min-h-0"
              >
                <Copy size={14} className="group-hover:scale-110 transition-transform" />
                Copy code
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm font-serif text-muted-foreground px-4">
              <span>{room.language}</span>
              <span className="hidden sm:inline">·</span>
              <span>Level {room.level}</span>
              <span className="hidden sm:inline">·</span>
              <span className="whitespace-nowrap">{room.timer_duration || TIMER_SECONDS}s per question</span>
            </div>
          </div>

          {/* Player Grid - Minimal & Airy */}
          <div className="space-y-4 sm:space-y-6">
            <p className="text-center text-xs sm:text-sm font-serif text-muted-foreground font-light">
              {players.length} / {room.max_players || 4} players
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {players.map((player) => {
                const isHost = player.user_id === room.host_id;
                return (
                  <div
                    key={player.id}
                    className={clsx(
                      'p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border transition-all',
                      isHost
                        ? 'bg-terracotta/5 dark:bg-terracotta/10 border-terracotta/30 dark:border-terracotta-light/30'
                        : 'bg-muted/30 border-border hover:bg-muted/50 active:bg-muted/60'
                    )}
                  >
                    <div className="flex flex-col items-center gap-2.5 sm:gap-3 text-center">
                      <div
                        className={clsx(
                          'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-serif text-base sm:text-lg',
                          isHost
                            ? 'bg-terracotta dark:bg-terracotta-light text-white'
                            : 'bg-background border border-border text-foreground'
                        )}
                      >
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-0.5 sm:space-y-1 w-full">
                        <p className="font-serif text-xs sm:text-sm font-medium truncate max-w-full px-1">{player.username}</p>
                        {isHost && (
                          <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-terracotta dark:text-terracotta-light">
                            <Crown size={10} className="sm:w-3 sm:h-3" />
                            <span className="font-serif font-light">Host</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Start Game Button */}
          {isHost && (
            <div className="flex justify-center pt-4 sm:pt-6 md:pt-8">
              <button
                onClick={handleStartGame}
                disabled={players.length < 2 || isGenerating}
                className={clsx(
                  'w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-serif text-sm sm:text-base tracking-wide transition-all min-h-14 sm:min-h-0',
                  players.length < 2 || isGenerating
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-terracotta dark:bg-terracotta-light text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'
                )}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-3">
                    <ButtonLoader />
                    Preparing questions...
                  </span>
                ) : players.length < 2 ? (
                  'Waiting for players...'
                ) : (
                  'Start Game'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (room.status === 'finished') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-lg mx-auto px-6 py-20 text-center space-y-12">
          {/* Trophy with warm styling */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 border border-amber-200/50 dark:border-amber-700/30">
            <Trophy size={48} className="text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-serif font-light tracking-tight text-foreground">Game Over</h1>
            <p className="text-lg font-serif text-muted-foreground font-light">Well played, everyone.</p>
          </div>

          {/* Final Scores */}
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => {
              const rank = index + 1;
              const isWinner = rank === 1;

              return (
                <div
                  key={player.id}
                  className={clsx(
                    'flex items-center justify-between p-5 rounded-2xl border transition-all',
                    isWinner
                      ? 'bg-terracotta/5 dark:bg-terracotta/10 border-terracotta/30 dark:border-terracotta-light/30'
                      : 'bg-muted/30 border-border'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={clsx(
                        'font-serif text-xl w-8 text-center',
                        isWinner ? 'text-terracotta dark:text-terracotta-light font-medium' : 'text-muted-foreground'
                      )}
                    >
                      {rank}
                    </span>
                    <span className={clsx('font-serif text-base', isWinner && 'font-medium')}>{player.username}</span>
                  </div>
                  <span className="font-serif text-xl tabular-nums text-foreground">{player.score}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => navigate('/multiplayer')}
            className="text-sm font-serif text-muted-foreground hover:text-terracotta dark:hover:text-terracotta-light transition-colors tracking-wide"
          >
            Return to lobby
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = room.questions[room.current_question_index];
  const isTimeUp = timeLeft <= 0;
  const shouldReveal = selectedAnswer !== null || isTimeUp;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Top Bar */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
        <div className="flex items-center justify-between gap-3">
          {/* Player Scores - Minimal Pills */}
          <div className="flex gap-1.5 sm:gap-2 md:gap-3 overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
            {players.slice(0, 4).map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-muted/30 border border-border shrink-0"
                title={player.username}
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-terracotta/20 dark:bg-terracotta-light/20 flex items-center justify-center text-[10px] sm:text-xs font-serif">
                  {player.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] sm:text-xs font-serif tabular-nums text-foreground">{player.score}</span>
              </div>
            ))}
          </div>

          {/* Timer - Large & Clear */}
          <div className="flex items-baseline gap-1 sm:gap-2 shrink-0">
            <span className="text-3xl sm:text-4xl font-serif font-light tabular-nums text-foreground">
              {timeLeft}
            </span>
            <span className="text-xs sm:text-sm font-serif text-muted-foreground">sec</span>
          </div>
        </div>
      </div>

      {/* Main Question Area - Center-focused, Literary */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="max-w-3xl w-full space-y-10 sm:space-y-12 md:space-y-16">
          {/* Question Number & Text */}
          <div className="text-center space-y-4 sm:space-y-6">
            <p className="text-[10px] sm:text-xs font-serif text-muted-foreground font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase">
              Question {room.current_question_index + 1} of {room.questions.length}
            </p>

            <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-light leading-tight text-foreground px-4 sm:px-6 md:px-8">
              {currentQuestion?.question}
            </h2>
          </div>

          {/* Answer Options - Clean, Refined */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {currentQuestion?.options?.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;

              let stateClass = 'border-border hover:bg-muted/30 hover:border-muted-foreground/20 active:bg-muted/40';

              if (shouldReveal) {
                if (isSelected && isCorrect) {
                  stateClass = 'bg-terracotta/10 dark:bg-terracotta/20 border-terracotta dark:border-terracotta-light text-foreground';
                } else if (isSelected && !isCorrect) {
                  stateClass = 'bg-destructive/10 border-destructive/50 text-foreground/70';
                } else if (!isSelected && isCorrect) {
                  stateClass = 'border-terracotta/40 dark:border-terracotta-light/40 text-muted-foreground';
                } else {
                  stateClass = 'opacity-40 border-border';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={selectedAnswer !== null || isTimeUp}
                  onClick={() => handleAnswer(option)}
                  className={clsx(
                    'min-h-16 sm:min-h-20 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 text-sm sm:text-base md:text-lg font-serif font-light transition-all',
                    'disabled:cursor-not-allowed',
                    !shouldReveal && 'active:scale-[0.98]',
                    stateClass
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress Bar - Subtle & Elegant */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-6 sm:pb-8">
        <div className="h-0.5 sm:h-1 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-terracotta dark:bg-terracotta-light transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${(timeLeft / (room.timer_duration || TIMER_SECONDS)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
