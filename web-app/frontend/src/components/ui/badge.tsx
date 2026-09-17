import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "academic" | "warning" | "danger" | "outline" | "neutral";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-ink-800 text-ink-200",
    academic: "border-academic-700/50 bg-academic-950/60 text-academic-300 font-medium",
    warning: "border-amber-700/50 bg-amber-950/50 text-amber-300",
    danger: "border-red-700/50 bg-red-950/50 text-red-300",
    outline: "border-ink-700 text-ink-300",
    neutral: "border-ink-800 bg-ink-900 text-ink-400 font-mono",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-normal border transition-colors focus:outline-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
