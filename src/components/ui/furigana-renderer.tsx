import React from "react";
import { parseFurigana, cn } from "@/lib/utils";

interface FuriganaRendererProps {
  text: string;
  className?: string;
  processText?: (text: string) => string;
}

export const FuriganaRenderer: React.FC<FuriganaRendererProps> = ({
  text,
  className = "",
  processText = (t) => t,
}) => {
  const segments = parseFurigana(text);
  const hasFurigana = segments.some((s) => s.furigana);

  if (!hasFurigana) {
    return <span className={className}>{processText(text)}</span>;
  }

  return (
    <span className={cn(className, "leading-[1.6]")}>
      {segments.map((segment, i) => {
        if (segment.furigana) {
          return (
            <ruby
              key={i}
              className="group/ruby"
              style={{ rubyAlign: "center" }}
            >
              <span>{processText(segment.text)}</span>
              <rt
                className="text-[0.5em] text-muted-foreground/70 select-none opacity-0 group-hover/ruby:opacity-100 transition-opacity duration-500 font-sans font-light tracking-wide text-center"
                style={{ textAlign: "center" }}
              >
                {processText(segment.furigana)}
              </rt>
            </ruby>
          );
        }
        return <span key={i}>{processText(segment.text)}</span>;
      })}
    </span>
  );
};
