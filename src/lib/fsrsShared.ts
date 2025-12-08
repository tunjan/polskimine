import { ReviewLog } from "@/types";

export const DECAY = -0.6;
export const FACTOR = 0.9 ** (1 / DECAY) - 1;

// Upper and lower bounds for optimizer weights
export const WEIGHT_BOUNDS = {
  min: 0.01,
  max: 20.0, // Prevent unbounded growth
};

export const getRetrievability = (
  elapsedDays: number,
  stability: number,
): number => {
  if (stability <= 0) return 0;
  return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
};

export const nextStability = (
  s: number,
  d: number,
  r: number,
  rating: number,
  w: number[],
): number => {
  if (rating === 1) {
    return (
      w[11] *
      Math.pow(d, -w[12]) *
      (Math.pow(s + 1, w[13]) - 1) *
      Math.exp(w[14] * (1 - r))
    );
  }
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  return (
    s *
    (1 +
      Math.exp(w[8]) *
        (11 - d) *
        Math.pow(s, -w[9]) *
        (Math.exp((1 - r) * w[10]) - 1) *
        hardPenalty *
        easyBonus)
  );
};

export const nextDifficulty = (
  d: number,
  rating: number,
  w: number[],
): number => {
  const nextD = d - w[6] * (rating - 3);
  return Math.min(10, Math.max(1, nextD * (1 - w[7]) + w[4] * w[7]));
};

export const computeCardLoss = (logs: ReviewLog[], w: number[]): number => {
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

    loss -= y * Math.log(p) + (1 - y) * Math.log(1 - p);

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

// Shared optimizer configuration
export const OPTIMIZER_CONFIG = {
  learningRate: 0.002,
  iterations: 500,
  maxBatchSize: 64,
  // Optimize more parameters: initial stabilities (0-3), recall stability (8-12), difficulty (4-5)
  targetIndices: [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12],
  finiteDiffH: 0.0001,
};

// Clamp weight values to prevent numerical instability
export const clampWeight = (value: number): number => {
  return Math.max(WEIGHT_BOUNDS.min, Math.min(WEIGHT_BOUNDS.max, value));
};

// Shared optimizer core logic
export const runOptimizerIteration = (
  w: number[],
  batch: ReviewLog[][],
  targetIndices: number[],
  learningRate: number,
  h: number,
): number[] => {
  const newW = [...w];
  const gradients = new Array(w.length).fill(0);

  let totalLoss = 0;
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
    newW[idx] = clampWeight(newW[idx] - learningRate * gradients[idx]);
  }

  return newW;
};

