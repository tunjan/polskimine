import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Loader2, Trophy, Copy, Play } from 'lucide-react';
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

  const handleNextQuestion = useCallback(async () => {
    if (!room) return;
    const nextIdx = room.current_question_index + 1;
    if (nextIdx >= room.questions.length) {
      await multiplayerService.endGame(room.id);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else {
      await multiplayerService.nextQuestion(room.id, nextIdx);
    }
  }, [room]);

  useEffect(() => {
    if (!room || room.status !== 'playing') return;

    setTimeLeft(TIMER_SECONDS);
    setSelectedAnswer(null);

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
  }, [room?.current_question_index, room?.status, isHost, handleNextQuestion]);

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
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (room.status === 'waiting') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-light">Lobby</h1>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-3 text-5xl md:text-7xl font-mono font-bold tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
          >
            {room.code}
            <Copy size={24} className="text-muted-foreground" />
          </button>
          <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
            {room.language} • {room.level}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {players.map((player) => (
            <div key={player.id} className="bg-secondary/20 border border-border p-4 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {player.username.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium truncate">{player.username}</span>
              {player.user_id === room.host_id && <Trophy size={14} className="text-yellow-500 ml-auto" />}
            </div>
          ))}
        </div>

        {isHost && (
          <div className="flex justify-center pt-8">
            <button
              onClick={handleStartGame}
              disabled={players.length < 2 || isGenerating}
              className="bg-primary text-primary-foreground px-12 py-4 rounded-full text-sm font-mono uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Play />}
              {players.length < 2 ? 'Waiting for players...' : 'Start Game'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (room.status === 'finished') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-8">
        <Trophy size={64} className="mx-auto text-yellow-500" />
        <h1 className="text-4xl font-bold">Game Over</h1>

        <div className="space-y-4">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={clsx(
                'flex items-center justify-between p-4 rounded-lg border',
                index === 0 ? 'bg-yellow-500/10 border-yellow-500' : 'bg-card border-border'
              )}
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-xl font-bold w-6">{index + 1}</span>
                <span className="font-medium">{player.username}</span>
              </div>
              <span className="font-mono text-xl">{player.score}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/multiplayer')}
          className="text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  const currentQuestion = room.questions[room.current_question_index];
  const isTimeUp = timeLeft <= 0;
  const shouldReveal = selectedAnswer !== null || isTimeUp;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-2">
          {players.map((player) => (
            <div key={player.id} className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full bg-secondary text-xs flex items-center justify-center border border-border"
                title={player.username}
              >
                {player.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] font-mono mt-1">{player.score}</span>
            </div>
          ))}
        </div>
        <div className="font-mono text-2xl font-bold tabular-nums">00:{timeLeft.toString().padStart(2, '0')}</div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-12">
        <div className="text-center space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Question {room.current_question_index + 1} / {room.questions.length}
          </span>
          <h2 className="text-3xl md:text-5xl font-light leading-tight">{currentQuestion?.question}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion?.options?.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;

            let stateClass = 'border-border hover:bg-secondary/50';
            if (shouldReveal) {
              if (isSelected && isCorrect) stateClass = 'bg-green-500 text-white border-green-500';
              else if (isSelected && !isCorrect) stateClass = 'bg-red-500 text-white border-red-500';
              else if (!isSelected && isCorrect) stateClass = 'border-green-500 text-green-500';
              else stateClass = 'opacity-50';
            }

            return (
              <button
                key={idx}
                disabled={selectedAnswer !== null || isTimeUp}
                onClick={() => handleAnswer(option)}
                className={clsx(
                  'h-20 rounded-xl border-2 text-lg font-medium transition-all active:scale-95',
                  stateClass
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-1 bg-secondary mt-8 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / TIMER_SECONDS) * 100}%` }}
        />
      </div>
    </div>
  );
};
