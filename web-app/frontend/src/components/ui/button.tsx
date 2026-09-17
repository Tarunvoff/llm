import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "academic" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-academic-500 disabled:pointer-events-none disabled:opacity-50 select-none";
    
    const variants = {
      primary: "bg-ink-900 text-ink-50 hover:bg-ink-800 active:scale-[0.99] border border-ink-700/60 shadow-sm",
      secondary: "bg-ink-800 text-ink-100 hover:bg-ink-700 active:scale-[0.99] border border-ink-700/40",
      outline: "border border-ink-700/50 bg-transparent text-ink-200 hover:bg-ink-800/60 hover:text-white active:scale-[0.99]",
      ghost: "text-ink-400 hover:text-ink-100 hover:bg-ink-800/40 active:scale-[0.99]",
      academic: "bg-academic-700 text-white hover:bg-academic-600 active:scale-[0.99] border border-academic-600 shadow-sm",
      danger: "bg-red-900/40 text-red-300 border border-red-800/60 hover:bg-red-900/60",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md gap-1.5",
      md: "h-9 px-4 text-sm rounded-md gap-2",
      lg: "h-11 px-6 text-sm rounded-md gap-2.5 font-semibold",
      icon: "h-9 w-9 p-0 rounded-md",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
