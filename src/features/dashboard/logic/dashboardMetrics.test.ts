import { calculateDashboardMetrics } from "./dashboardMetrics";
import { describe, it, expect } from "vitest";

describe("calculateDashboardMetrics", () => {
    const counts = {
        new: 20,
        learning: 5,
        relearning: 2,
        review: 15,
        known: 100
    };

    it("should limit new cards based on daily limit", () => {
        // Daily limit 10, studied 0 -> allow 10
        const result = calculateDashboardMetrics(counts, 10, 0);
        expect(result.new).toBe(10);
        
        // Daily limit 10, studied 5 -> allow 5
        const result2 = calculateDashboardMetrics(counts, 10, 5);
        expect(result2.new).toBe(5);

        // Daily limit 10, studied 10 -> allow 0
        const result3 = calculateDashboardMetrics(counts, 10, 10);
        expect(result3.new).toBe(0);
    });

    it("should limit reviews based on daily limit", () => {
        // Review limit 20, studied 0 -> allow min(15, 20) = 15
        const result = calculateDashboardMetrics(counts, 10, 0, 20, 0);
        expect(result.reviewing).toBe(15);

        // Review limit 10, studied 0 -> allow min(15, 10) = 10
        const result2 = calculateDashboardMetrics(counts, 10, 0, 10, 0);
        expect(result2.reviewing).toBe(10);

        // Review limit 10, studied 5 -> allow min(15, 5) = 5
        const result3 = calculateDashboardMetrics(counts, 10, 0, 10, 5);
        expect(result3.reviewing).toBe(5);
    });

    it("should calculate total correctly", () => {
        // Total includes ALL courts, not just shown ones?
        // Logic: total = sum(counts). YES.
        const result = calculateDashboardMetrics(counts, 100, 0);
        expect(result.total).toBe(20 + 5 + 2 + 15 + 100);
    });
});
