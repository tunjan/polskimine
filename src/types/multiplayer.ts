export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface GameQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
}

export interface GameRoom {
  id: string;
  code: string;
  host_id: string;
  language: string;
  level: string;
  status: GameStatus;
  questions: GameQuestion[];
  current_question_index: number;
  timer_duration: number;
  max_players: number;
}

export interface GamePlayer {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  score: number;
  is_ready: boolean;
}

