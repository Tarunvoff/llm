import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-[#E4E2D8] bg-white px-3.5 py-2 text-sm text-[#151515] placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:border-[#FF5734] focus-visible:ring-1 focus-visible:ring-[#FF5734] disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-subtle",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
