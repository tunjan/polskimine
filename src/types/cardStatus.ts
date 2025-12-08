import { State as FsrsState } from 'ts-fsrs';

export enum CardStatus {
  NEW = 'new',             LEARNING = 'learning',   REVIEW = 'review',       KNOWN = 'known',       }

export const mapFsrsStateToStatus = (state: FsrsState): CardStatus => {
  switch (state) {
    case FsrsState.New: return CardStatus.NEW;
    case FsrsState.Learning: return CardStatus.LEARNING;
    case FsrsState.Relearning: return CardStatus.LEARNING;     case FsrsState.Review: return CardStatus.REVIEW;
    default: return CardStatus.NEW;
  }
};

export const mapStatusToFsrsState = (status: CardStatus): FsrsState => {
  switch (status) {
    case CardStatus.NEW: return FsrsState.New;
    case CardStatus.LEARNING: return FsrsState.Learning;
    case CardStatus.REVIEW: return FsrsState.Review;
    case CardStatus.KNOWN: return FsrsState.Review;     default: return FsrsState.New;
  }
};
