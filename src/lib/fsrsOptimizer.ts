import { ReviewLog } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';

// FSRS v4/v5 Constants
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
    // Forget (Again)
    return w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r));
  }
  
  // Success (Hard, Good, Easy)
  // Hard(2) is handled slightly differently in full FSRS, but for optimization 
  // we often treat 2,3,4 as success with different difficulty updates.
  // Here is the standard "Success" stability update formula:
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  
  return s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1) * hardPenalty * easyBonus);
};

/**
 * Calculates next difficulty
 */
const nextDifficulty = (d: number, rating: number, w: number[]): number => {
  const nextD = d - w[6] * (rating - 3);
  return Math.min(10, Math.max(1, nextD * (1 - w[7]) + w[4] * w[7])); // Mean Reversion
};

/**
 * Replays history for a single card to compute loss given weights W
 */
const computeCardLoss = (logs: ReviewLog[], w: number[]): number => {
  let loss = 0;
  
  // Initial State
  let s = w[0]; // Default to w[0] for first review if needed, though usually determined by first rating
  let d = w[4]; 

  // We iterate through logs. 
  // Note: logs must be sorted by date.
  for (const log of logs) {
    const { grade, elapsed_days, state } = log;
    
    // 0=New, 1=Learning, 2=Review, 3=Relearning
    // We only optimize based on "Review" logs (state 2) or "Relearning" checks
    // Standard FSRS optimization usually filters out short-term learning steps.
    
    if (state === 0 || state === 1) {
      // Update S/D for the first time based on first rating
      // w[0]=Again, w[1]=Hard, w[2]=Good, w[3]=Easy
      s = w[grade - 1];
      d = w[4] - w[5] * (grade - 3);
      d = Math.max(1, Math.min(10, d));
      continue;
    }

    // Calculate Retrievability at the moment of this review
    const r = getRetrievability(elapsed_days, s);

    // Calculate Loss for this specific review
    // y = 1 if grade > 1 (Pass), y = 0 if grade == 1 (Fail)
    const y = grade > 1 ? 1 : 0;
    
    // Clip p to prevent log(0)
    const p = Math.max(0.0001, Math.min(0.9999, r));
    
    // Log Loss
    loss -= (y * Math.log(p) + (1 - y) * Math.log(1 - p));

    // Update State for next iteration
    if (grade === 1) {
       // Failed
       s = nextStability(s, d, r, 1, w);
       d = nextDifficulty(d, 1, w);
    } else {
       // Passed
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
  
  // 1. Group logs by Card ID
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

  // We optimize specific parameters to ensure stability
  // w0-w3 (Initial Stability), w8-w10 (Stability Increase), w11-w14 (Forgetting)
  const targetIndices = [0, 1, 2, 3, 8, 9, 10, 11, 12]; 

  for (let iter = 0; iter < iterations; iter++) {
    const gradients = new Array(19).fill(0);
    let totalLoss = 0;

    // Mini-batch
    const batch = [];
    for(let i=0; i<batchSize; i++) {
        batch.push(cardGroups[Math.floor(Math.random() * cardGroups.length)]);
    }

    // Finite Difference Method for Gradients
    const h = 0.0001;
    
    // Calculate Base Loss
    for (const logs of batch) {
        totalLoss += computeCardLoss(logs, w);
    }

    // Calculate Gradients per parameter
    for (const idx of targetIndices) {
        const wPlus = [...w];
        wPlus[idx] += h;
        
        let lossPlus = 0;
        for (const logs of batch) {
            lossPlus += computeCardLoss(logs, wPlus);
        }
        
        gradients[idx] = (lossPlus - totalLoss) / h;
    }

    // Apply Gradients
    for (const idx of targetIndices) {
        w[idx] -= learningRate * gradients[idx];
        if (w[idx] < 0.01) w[idx] = 0.01; // Clamp
    }

    if (iter % 20 === 0) {
        onProgress((iter / iterations) * 100);
        await new Promise(r => setTimeout(r, 0));
    }
  }

  onProgress(100);
  return w;
};
