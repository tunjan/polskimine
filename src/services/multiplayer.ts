import { supabase } from '@/lib/supabase';
import { aiService } from '@/features/deck/services/ai';
import type { GameQuestion } from '@/types/multiplayer';

const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const multiplayerService = {
  async createRoom(hostId: string, username: string, language: string, level: string) {
    const code = generateRoomCode();

    const { data: room, error } = await supabase
      .from('game_rooms')
      .insert({ code, host_id: hostId, language, level })
      .select('*')
      .single();

    if (error || !room) {
      throw error ?? new Error('Failed to create room');
    }

    await this.joinRoom(room.id, hostId, username);
    return room;
  },

  async joinRoom(roomId: string, userId: string, username: string) {
    const { error } = await supabase
      .from('game_players')
      .insert({ room_id: roomId, user_id: userId, username });

    if (error && error.code !== '23505') {
      throw error;
    }
  },

  async generateQuestions(language: string, level: string, count = 10, apiKey?: string): Promise<GameQuestion[]> {
    const prompt = `
      Generate ${count} multiple-choice quiz questions for ${language} learners at ${level} level.
      Return a JSON ARRAY of objects. Each object must have:
      - question: A sentence in ${language} with a missing word (use ____ for blanks) or a word to translate.
      - correctAnswer: The correct answer.
      - options: An array of 4 plausible answers including the correct one.
    `;

    return await aiService.generateQuiz(prompt, apiKey ?? localStorage.getItem('gemini_api_key') ?? '');
  },

  async startGame(roomId: string, questions: GameQuestion[]) {
    await supabase
      .from('game_rooms')
      .update({ status: 'playing', questions, current_question_index: 0 })
      .eq('id', roomId);
  },

  async updateScore(playerId: string, newScore: number) {
    await supabase
      .from('game_players')
      .update({ score: newScore })
      .eq('id', playerId);
  },

  async nextQuestion(roomId: string, nextIndex: number) {
    await supabase
      .from('game_rooms')
      .update({ current_question_index: nextIndex })
      .eq('id', roomId);
  },

  async endGame(roomId: string) {
    await supabase
      .from('game_rooms')
      .update({ status: 'finished' })
      .eq('id', roomId);
  }
};
