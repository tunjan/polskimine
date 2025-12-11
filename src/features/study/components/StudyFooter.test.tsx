import { render, screen, fireEvent } from "@testing-library/react";
import { StudyFooter } from "./StudyFooter";
import { vi, describe, it, expect } from "vitest";

describe("StudyFooter", () => {
  const mockSetIsFlipped = vi.fn();
  const mockOnGrade = vi.fn();

  it("renders Show Answer button when not flipped", () => {
    render(
      <StudyFooter
        isFlipped={false}
        setIsFlipped={mockSetIsFlipped}
        isProcessing={false}
        binaryRatingMode={false}
        onGrade={mockOnGrade}
      />,
    );
    const btn = screen.getByText("Show Answer");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(mockSetIsFlipped).toHaveBeenCalledWith(true);
  });

  it("renders standard grading buttons when flipped and not binary mode", () => {
    render(
      <StudyFooter
        isFlipped={true}
        setIsFlipped={mockSetIsFlipped}
        isProcessing={false}
        binaryRatingMode={false}
        onGrade={mockOnGrade}
      />,
    );
    expect(screen.getByText("Again")).toBeInTheDocument();
    expect(screen.getByText("Hard")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it("renders binary grading buttons when flipped and binary mode", () => {
    render(
      <StudyFooter
        isFlipped={true}
        setIsFlipped={mockSetIsFlipped}
        isProcessing={false}
        binaryRatingMode={true}
        onGrade={mockOnGrade}
      />,
    );
    expect(screen.getByText("Again")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.queryByText("Hard")).not.toBeInTheDocument();
    expect(screen.queryByText("Easy")).not.toBeInTheDocument();
  });

  it("calls onGrade with correct grade", () => {
    render(
      <StudyFooter
        isFlipped={true}
        setIsFlipped={mockSetIsFlipped}
        isProcessing={false}
        binaryRatingMode={false}
        onGrade={mockOnGrade}
      />,
    );
    fireEvent.click(screen.getByText("Hard"));
    expect(mockOnGrade).toHaveBeenCalledWith("Hard");
  });
});
