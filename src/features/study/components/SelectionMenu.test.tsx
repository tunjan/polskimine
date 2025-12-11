import { render, screen, fireEvent } from "@testing-library/react";
import { SelectionMenu } from "./SelectionMenu";
import { vi, describe, it, expect } from "vitest";

describe("SelectionMenu", () => {
  const defaultProps = {
    top: 100,
    left: 100,
    onAnalyze: vi.fn(),
    onGenerateCard: vi.fn(),
    onModifyCard: vi.fn(),
    isAnalyzing: false,
    isGeneratingCard: false,
    isModifying: false,
  };

  it("renders basic buttons", () => {
    render(<SelectionMenu {...defaultProps} />);
    expect(screen.getByText("Analyze")).toBeInTheDocument();
    expect(screen.getByText("Create Card")).toBeInTheDocument();
    expect(screen.getByText("Modify")).toBeInTheDocument();
  });

  it("calls onAnalyze when Analyze clicked", () => {
    render(<SelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText("Analyze"));
    expect(defaultProps.onAnalyze).toHaveBeenCalled();
  });

  it("calls onGenerateCard when Create Card clicked", () => {
    render(<SelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText("Create Card"));
    expect(defaultProps.onGenerateCard).toHaveBeenCalled();
  });

  it("opens modify options when Modify clicked", () => {
    render(<SelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText("Modify"));
    expect(screen.getByText("Easier")).toBeInTheDocument();
    expect(screen.getByText("Harder")).toBeInTheDocument();
  });

  it("calls onModifyCard with 'easier' when Easier clicked", () => {
    render(<SelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText("Modify"));
    fireEvent.click(screen.getByText("Easier"));
    expect(defaultProps.onModifyCard).toHaveBeenCalledWith("easier");
  });

  it("calls onModifyCard with 'harder' when Harder clicked", () => {
    render(<SelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText("Modify"));
    fireEvent.click(screen.getByText("Harder"));
    expect(defaultProps.onModifyCard).toHaveBeenCalledWith("harder");
  });

  it("does not render Modify button if onModifyCard is undefined", () => {
    const props = { ...defaultProps, onModifyCard: undefined };
    render(<SelectionMenu {...props} />);
    expect(screen.queryByText("Modify")).not.toBeInTheDocument();
  });

  it("closes modify options when close button clicked", () => {
    render(<SelectionMenu {...defaultProps} />);
    fireEvent.click(screen.getByText("Modify"));
    expect(screen.getByText("Easier")).toBeInTheDocument();
    fireEvent.click(screen.getByText("×"));
    expect(screen.queryByText("Easier")).not.toBeInTheDocument();
    expect(screen.getByText("Modify")).toBeInTheDocument();
  });
});
