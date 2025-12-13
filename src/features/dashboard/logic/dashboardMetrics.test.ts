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
        
        const result = calculateDashboardMetrics(counts, 10, 0);
        expect(result.new).toBe(10);
        
        
        const result2 = calculateDashboardMetrics(counts, 10, 5);
        expect(result2.new).toBe(5);

        
        const result3 = calculateDashboardMetrics(counts, 10, 10);
        expect(result3.new).toBe(0);
    });

    it("should limit reviews based on daily limit", () => {
        
        const result = calculateDashboardMetrics(counts, 10, 0, 20, 0);
        expect(result.reviewing).toBe(15);

        
        const result2 = calculateDashboardMetrics(counts, 10, 0, 10, 0);
        expect(result2.reviewing).toBe(10);

        
        const result3 = calculateDashboardMetrics(counts, 10, 0, 10, 5);
        expect(result3.reviewing).toBe(5);
    });

    it("should calculate total correctly", () => {
        
        
        const result = calculateDashboardMetrics(counts, 100, 0);
        expect(result.total).toBe(20 + 5 + 2 + 15 + 100);
    });
});
