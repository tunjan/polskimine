import * as cardRepository from './repositories/cardRepository';
import * as historyRepository from './repositories/historyRepository';
import * as statsRepository from './repositories/statsRepository';

export { getDB, resetDBCache } from './client';

export const db = {
  getCards: cardRepository.getCards,
  saveCard: cardRepository.saveCard,
  deleteCard: cardRepository.deleteCard,
  saveAllCards: cardRepository.saveAllCards,
  clearAllCards: cardRepository.clearAllCards,
  getDueCards: cardRepository.getDueCards,
  getCramCards: cardRepository.getCramCards,
  deleteCardsByLanguage: cardRepository.deleteCardsByLanguage,
  getStats: statsRepository.getStats,
  getTodayReviewStats: statsRepository.getTodayReviewStats,
  getHistory: historyRepository.getHistory,
  incrementHistory: historyRepository.incrementHistory,
  saveFullHistory: historyRepository.saveFullHistory,
  clearHistory: historyRepository.clearHistory,
};
