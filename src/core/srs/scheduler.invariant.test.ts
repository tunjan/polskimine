import { describe, it, expect } from "vitest";
import { calculateNextReview } from "./scheduler";
import { Card, CardStatus } from "@/types";
import { State } from "ts-fsrs";

const generateRandomCard = (seed: number): Card => {
  const statuses = [
    CardStatus.NEW,
    CardStatus.LEARNING,
    CardStatus.REVIEW,
    CardStatus.KNOWN,
  ];
  const states = [State.New, State.Learning, State.Review, State.Relearning];

  // Deterministic-ish random for reproducibility
  const rand = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  return {
    id: `fuzz-${seed}`,
    targetSentence: "Fuzz",
    nativeTranslation: "Fuzz",
    notes: "",
    status: statuses[Math.floor(rand() * statuses.length)],
    state: states[Math.floor(rand() * states.length)],
    reps: Math.floor(rand() * 100),
    lapses: Math.floor(rand() * 10),
    interval: rand() * 100,
    precise_interval: rand() * 100,
    scheduled_days: Math.floor(rand() * 100),
    dueDate: new Date().toISOString(),
    stability: (rand() - 0.2) * 10, // Some negative, some positive
    difficulty: (rand() - 0.2) * 10,
    elapsed_days: rand() * 50,
    learningStep: rand() > 0.5 ? Math.floor(rand() * 5) : undefined,
    language: "polish" as any,
    easeFactor: 2.5,
  };
};

describe("scheduler - invariant tests (fuzzing)", () => {
  it("should maintain invariants across 1000 random card states", () => {
    const grades = ["Again", "Hard", "Good", "Easy"] as const;

    for (let i = 0; i < 1000; i++) {
      const card = generateRandomCard(i);
      const grade = grades[i % 4];

      try {
        const result = calculateNextReview(card, grade);

        // Invariant 1: Interval must be non-negative
        expect(result.interval).toBeGreaterThanOrEqual(0);

        // Invariant 2: Stability/Difficulty must be finite numbers (defaults applied)
        expect(Number.isFinite(result.stability)).toBe(true);
        expect(Number.isFinite(result.difficulty)).toBe(true);

        // Invariant 3: Review cards must have substantial intervals (unless failing)
        if (result.status === CardStatus.REVIEW && grade !== "Again") {
          // If we are in Review and rated Good/Hard/Easy, interval should be reasonable
          // Note: Hard might be small, but generally > 0
          expect(result.interval).toBeGreaterThan(0);
        }

        // Invariant 4: New/Learning cards staying in learning must have small intervals
        if (
          result.status === CardStatus.LEARNING &&
          result.state !== State.Relearning
        ) {
          // Usually minutes or < 1 day
          // Just checking validity here
          expect(result.dueDate).toBeDefined();
        }

        // Invariant 5: Due date validity
        expect(new Date(result.dueDate).getTime()).not.toBeNaN();
      } catch (e) {
        console.error(
          "Fuzz failure on card:",
          JSON.stringify(card, null, 2),
          "Grade:",
          grade,
        );
        throw e;
      }
    }
  });
});
