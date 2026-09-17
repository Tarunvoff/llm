import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "coral" | "lavender" | "yellow" | "academic" | "danger" | "outline" | "neutral";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-[#E4E2D8] bg-[#FAF9F5] text-[#151515]",
    coral: "border-[#FFC8BC] bg-[#FFF3F0] text-[#BD3012] font-medium",
    lavender: "border-[#E0D1FB] bg-[#F0E9FD] text-[#6C38D4] font-medium",
    yellow: "border-[#FFF1A3] bg-[#FFF9D6] text-[#8F6E00] font-medium",
    academic: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534] font-medium",
    danger: "border-red-200 bg-red-50 text-red-700 font-medium",
    outline: "border-[#E4E2D8] bg-white text-[#151515]",
    neutral: "border-[#EFEFE8] bg-[#F7F7F2] text-[#555555]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border transition-colors focus:outline-none select-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
