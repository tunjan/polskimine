import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";
import { describe, it, expect, vi, afterEach } from "vitest";

describe("ErrorBoundary", () => {
  const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => {});

  afterEach(() => {
    consoleErrorMock.mockClear();
  });

  const ThrowError = () => {
    throw new Error("Test Error");
  };

  it("should render children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Safe Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Safe Content")).toBeInTheDocument();
  });

  it("should render fallback UI on error", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test Error")).toBeInTheDocument();
    expect(consoleErrorMock).toHaveBeenCalled();
  });
});
