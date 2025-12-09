import { ReviewLog } from "@/types";

export const optimizeFSRS = async (
  allLogs: ReviewLog[],
  currentW: number[],
  onProgress: (progress: number) => void,
): Promise<number[]> => {
  if (typeof Worker === "undefined") {
    throw new Error("Web Workers are not supported in this environment");
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("@/workers/fsrs.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (e: MessageEvent) => {
      const { type, progress, w, error } = e.data;

      switch (type) {
        case "progress":
          onProgress(progress);
          break;
        case "result":
          worker.terminate();
          resolve(w);
          break;
        case "error":
          worker.terminate();
          reject(new Error(error));
          break;
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(new Error(`Worker error: ${error.message}`));
    };

    worker.postMessage({ logs: allLogs, currentW });
  });
};
