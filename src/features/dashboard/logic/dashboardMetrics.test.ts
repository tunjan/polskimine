import { describe, it, expect } from "vitest";
import { calculateDashboardMetrics } from "./dashboardMetrics";

describe("calculateDashboardMetrics", () => {
  const baseCounts = {
    new: 0,
    learning: 0,
    relearning: 0,
    review: 0,
    known: 0,
  };

  it("should show all available new cards if within limit", () => {
    const counts = { ...baseCounts, new: 5 };
    const limit = 10;
    const studiedToday = 0;

    const metrics = calculateDashboardMetrics(counts, limit, studiedToday);
    expect(metrics.new).toBe(5);
  });

  it("should cap new cards at the remaining limit", () => {
    const counts = { ...baseCounts, new: 10 };
    const limit = 10;
    const studiedToday = 5;

    
    
    const metrics = calculateDashboardMetrics(counts, limit, studiedToday);
    expect(metrics.new).toBe(5);
  });

  it("should show 0 new cards if limit is reached", () => {
    const counts = { ...baseCounts, new: 10 };
    const limit = 10;
    const studiedToday = 10;

    const metrics = calculateDashboardMetrics(counts, limit, studiedToday);
    expect(metrics.new).toBe(0);
  });

  it("should show 0 new cards if limit is exceeded", () => {
    const counts = { ...baseCounts, new: 10 };
    const limit = 10;
    const studiedToday = 15; 

    const metrics = calculateDashboardMetrics(counts, limit, studiedToday);
    expect(metrics.new).toBe(0);
  });

  it("should handle 0 counts correctly", () => {
    const counts = { ...baseCounts, new: 0 };
    const limit = 10;
    const studiedToday = 0;

    const metrics = calculateDashboardMetrics(counts, limit, studiedToday);
    expect(metrics.new).toBe(0);
  });

  it("should handle 0 limit correctly", () => {
    const counts = { ...baseCounts, new: 10 };
    const limit = 0;
    const studiedToday = 0;

    const metrics = calculateDashboardMetrics(counts, limit, studiedToday);
    expect(metrics.new).toBe(0);
  });
});
