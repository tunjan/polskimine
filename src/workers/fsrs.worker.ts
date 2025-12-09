import { ReviewLog } from "@/types";
import { OPTIMIZER_CONFIG, runOptimizerIteration } from "@/lib/fsrsShared";

const optimizeFSRS = async (
  allLogs: ReviewLog[],
  currentW: number[],
  onProgress: (progress: number) => void,
): Promise<number[]> => {
  const cardHistory: Record<string, ReviewLog[]> = {};
  allLogs.forEach((log) => {
    if (!cardHistory[log.card_id]) cardHistory[log.card_id] = [];
    cardHistory[log.card_id].push(log);
  });

  const cardGroups = Object.values(cardHistory);

  if (cardGroups.length < 5) {
    throw new Error("Insufficient history (need 5+ cards with reviews)");
  }

  let w = [...currentW];
  const { learningRate, iterations, maxBatchSize, targetIndices, finiteDiffH } =
    OPTIMIZER_CONFIG;
  const batchSize = Math.min(cardGroups.length, maxBatchSize);

  for (let iter = 0; iter < iterations; iter++) {
        const batch: ReviewLog[][] = [];
    for (let i = 0; i < batchSize; i++) {
      batch.push(cardGroups[Math.floor(Math.random() * cardGroups.length)]);
    }

        w = runOptimizerIteration(
      w,
      batch,
      targetIndices,
      learningRate,
      finiteDiffH,
    );

    if (iter % 20 === 0) {
      onProgress((iter / iterations) * 100);
          }
  }

  onProgress(100);
  return w;
};

self.onmessage = async (e: MessageEvent) => {
  const { logs, currentW } = e.data;
  try {
    const optimizedW = await optimizeFSRS(logs, currentW, (progress) => {
      self.postMessage({ type: "progress", progress });
    });
    self.postMessage({ type: "result", w: optimizedW });
  } catch (error) {
    self.postMessage({ type: "error", error: (error as Error).message });
  }
};
