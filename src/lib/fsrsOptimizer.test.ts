import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { optimizeFSRS } from './fsrsOptimizer';
import { ReviewLog } from '@/types';


class MockWorker {
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;
  onerror: ((this: Worker, ev: ErrorEvent) => any) | null = null;
  
  constructor(_stringUrl: string | URL, _options?: WorkerOptions) {}

  postMessage(data: any) {
    setTimeout(() => {
        if (this.onmessage) {
            this.onmessage.call(this as unknown as Worker, { data: { type: 'progress', progress: 50 } } as MessageEvent);
            
            const { currentW } = data;
            const newW = [...currentW];
            if (newW.length > 0) newW[0] += 0.1;

            this.onmessage.call(this as unknown as Worker, { data: { type: 'result', w: newW } } as MessageEvent);
        }
    }, 10);
  }

  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

describe('fsrsOptimizer', () => {
    const originalWorker = global.Worker;

    beforeEach(() => {
        global.Worker = MockWorker as any;
    });

    afterEach(() => {
        global.Worker = originalWorker;
    });

    it('should run optimization successfully', async () => {
        const logs: ReviewLog[] = [];
        const currentW = [1, 2, 3];
        const onProgress = vi.fn();

        const result = await optimizeFSRS(logs, currentW, onProgress);

        expect(result).toEqual([1.1, 2, 3]);
        expect(onProgress).toHaveBeenCalledWith(50);
    });

    it('should handle worker errors', async () => {
         
         global.Worker = class ErrorWorker extends MockWorker {
             postMessage(_data: any) {
                 setTimeout(() => {
                     if (this.onmessage) {
                         this.onmessage.call(this as unknown as Worker, { data: { type: 'error', error: 'Test Error' } } as MessageEvent);
                     }
                 }, 10);
             }
         } as any;

         const logs: ReviewLog[] = [];
         const currentW: number[] = [];
         const onProgress = vi.fn();

         await expect(optimizeFSRS(logs, currentW, onProgress)).rejects.toThrow('Test Error');
    });
});
