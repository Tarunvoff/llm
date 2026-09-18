"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  content?: string;
  className?: string;
  block?: boolean;
}

/**
 * Render a single raw LaTeX equation (either block or inline)
 */
export function LaTeXBlock({
  latex,
  displayMode = false,
  className = "",
}: {
  latex: string;
  displayMode?: boolean;
  className?: string;
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex.trim(), {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch (err) {
      return `<span class="text-red-500 font-mono text-xs">${latex}</span>`;
    }
  }, [latex, displayMode]);

  return (
    <span
      className={`inline-math ${displayMode ? "block my-2 text-center overflow-x-auto py-1.5" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Parses markdown text containing mixed LaTeX equations ($...$, $$...$$, \(...\), \[...\])
 * and formats headers, lists, bold/italics, and code snippets cleanly.
 */
export function MathRenderer({
  content = "",
  className = "",
  block = false,
}: MathRendererProps) {
  if (!content) return null;

  // If the content is purely a raw LaTeX formula (e.g. "E = mc^2" or "\tau = I\alpha" without markdown)
  if (
    block ||
    (content.includes("\\") &&
      !content.includes(" ") &&
      !content.includes("\n"))
  ) {
    // Check if it's already wrapped in delimiters
    const cleanFormula = content.trim().replace(/^(\$\$|\$|\\\[|\\\()|(\$\$|\$|\\\]|\\\))$/g, "");
    return <LaTeXBlock latex={cleanFormula} displayMode={block} className={className} />;
  }

  // Segment parser: splits string into text and LaTeX segments
  const segments = useMemo(() => {
    const text = content;
    // Regex for $$...$$, \[...\], $...$, \(...\)
    const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?!\$)(?:\\.|[^\$\\\n])+\$|\\\([\s\S]*?\\\))/g;
    const parts: { type: "text" | "block_math" | "inline_math"; value: string }[] = [];

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          value: text.slice(lastIndex, match.index),
        });
      }

      const matchStr = match[0];
      if (matchStr.startsWith("$$") || matchStr.startsWith("\\[")) {
        const formula = matchStr
          .replace(/^\$\$|^\\\[/, "")
          .replace(/\$\$$|\\\]$/, "");
        parts.push({ type: "block_math", value: formula.trim() });
      } else {
        const formula = matchStr
          .replace(/^\$|^\\\(/, "")
          .replace(/\$$|\\\)$/, "");
        parts.push({ type: "inline_math", value: formula.trim() });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        value: text.slice(lastIndex),
      });
    }

    return parts;
  }, [content]);

  // Render text segments formatted as lightweight markdown (paragraphs, bullets, bold, italics)
  return (
    <div className={`leading-relaxed text-inherit break-words ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === "block_math") {
          return (
            <div
              key={idx}
              className="my-3 px-4 py-3 bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl overflow-x-auto shadow-xs text-center select-all"
            >
              <LaTeXBlock latex={seg.value} displayMode={true} />
            </div>
          );
        }

        if (seg.type === "inline_math") {
          return <LaTeXBlock key={idx} latex={seg.value} displayMode={false} />;
        }

        // Standard text with bold / italic / line-break support
        return (
          <span key={idx} className="whitespace-pre-line">
            {formatTextWithMarkdown(seg.value)}
          </span>
        );
      })}
    </div>
  );
}

function formatTextWithMarkdown(text: string): React.ReactNode {
  // Simple inline markdown tokenizer for **bold**, *italic*, and `code`
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-[#151515]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-inherit">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E8E6DE] font-mono text-[11px] text-[#BD3012] font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
