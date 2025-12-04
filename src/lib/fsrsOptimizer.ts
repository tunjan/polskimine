import { ReviewLog } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';


const DECAY = -0.5;
const FACTOR = 0.9 ** (1 / DECAY) - 1;

/**
 * Calculates Retrievability (Probability of recall)
 */
const getRetrievability = (elapsedDays: number, stability: number): number => {
  if (stability <= 0) return 0;
  return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
};

/**
 * Calculates next stability based on current W parameters
 * This mimics the FSRS scheduler logic for "Review" state
 */
const nextStability = (s: number, d: number, r: number, rating: number, w: number[]): number => {
  if (rating === 1) {
    
    return w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r));
  }
  
  
  
  
  
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  
  return s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1) * hardPenalty * easyBonus);
};

/**
 * Calculates next difficulty
 */
const nextDifficulty = (d: number, rating: number, w: number[]): number => {
  const nextD = d - w[6] * (rating - 3);
  return Math.min(10, Math.max(1, nextD * (1 - w[7]) + w[4] * w[7])); 
};

/**
 * Replays history for a single card to compute loss given weights W
 */
const computeCardLoss = (logs: ReviewLog[], w: number[]): number => {
  let loss = 0;
  
  
  let s = w[0]; 
  let d = w[4]; 

  
  
  for (const log of logs) {
    const { grade, elapsed_days, state } = log;
    
    
    
    
    
    if (state === 0 || state === 1) {
      
      
      s = w[grade - 1];
      d = w[4] - w[5] * (grade - 3);
      d = Math.max(1, Math.min(10, d));
      continue;
    }

    
    const r = getRetrievability(elapsed_days, s);

    
    
    const y = grade > 1 ? 1 : 0;
    
    
    const p = Math.max(0.0001, Math.min(0.9999, r));
    
    
    loss -= (y * Math.log(p) + (1 - y) * Math.log(1 - p));

    
    if (grade === 1) {
       
       s = nextStability(s, d, r, 1, w);
       d = nextDifficulty(d, 1, w);
    } else {
       
       s = nextStability(s, d, r, grade, w);
       d = nextDifficulty(d, grade, w);
    }
  }

  return loss;
};

/**
 * Main Optimizer Function
 */
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
    for(let i=0; i<batchSize; i++) {
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
