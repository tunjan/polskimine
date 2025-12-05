import { ReviewLog } from '@/types';
import { computeCardLoss } from './fsrsShared';


export const optimizeFSRS = async (
  allLogs: ReviewLog[],
  currentW: number[],
  onProgress: (progress: number) => void
): Promise<number[]> => {


  const cardHistory: Record<string, ReviewLog[]> = {};
  allLogs.forEach(log => {
    if (!cardHistory[log.card_id]) cardHistory[log.card_id] = [];
    cardHistory[log.card_id].push(log);
  });

  const cardGroups = Object.values(cardHistory);

  if (cardGroups.length < 5) {
    throw new Error("Insufficient history (need 5+ cards with reviews)");
  }

  let w = [...currentW];
  const learningRate = 0.002;
  const iterations = 500;
  const batchSize = Math.min(cardGroups.length, 64);



  const targetIndices = [0, 1, 2, 3, 8, 9, 10, 11, 12];

  for (let iter = 0; iter < iterations; iter++) {
    const gradients = new Array(19).fill(0);
    let totalLoss = 0;


    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      batch.push(cardGroups[Math.floor(Math.random() * cardGroups.length)]);
    }


    const h = 0.0001;


    for (const logs of batch) {
      totalLoss += computeCardLoss(logs, w);
    }


    for (const idx of targetIndices) {
      const wPlus = [...w];
      wPlus[idx] += h;

      let lossPlus = 0;
      for (const logs of batch) {
        lossPlus += computeCardLoss(logs, wPlus);
      }

      gradients[idx] = (lossPlus - totalLoss) / h;
    }


    for (const idx of targetIndices) {
      w[idx] -= learningRate * gradients[idx];
      if (w[idx] < 0.01) w[idx] = 0.01;
    }

    if (iter % 20 === 0) {
      onProgress((iter / iterations) * 100);
      await new Promise(r => setTimeout(r, 0));
    }
  }

  onProgress(100);
  return w;
};

