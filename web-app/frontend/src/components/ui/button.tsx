import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "academic" | "danger" | "yellow" | "lavender";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-400 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";
    
    const variants = {
      primary: "bg-[#FF5734] text-white hover:bg-[#E64320] active:scale-[0.98] shadow-sm font-semibold",
      secondary: "bg-[#B99AF5] text-[#151515] hover:bg-[#A37EF0] active:scale-[0.98] shadow-sm font-semibold",
      yellow: "bg-[#FFCC42] text-[#151515] hover:bg-[#E5B125] active:scale-[0.98] shadow-sm font-semibold",
      lavender: "bg-[#F0E9FD] text-[#6C38D4] border border-[#E0D1FB] hover:bg-[#E0D1FB] active:scale-[0.98]",
      outline: "border border-[#E4E2D8] bg-white text-[#151515] hover:bg-[#FAF9F5] hover:border-[#D2CFC2] active:scale-[0.98] shadow-subtle",
      ghost: "text-[#151515] hover:bg-[#EFEFE8] hover:text-[#151515] active:scale-[0.98]",
      academic: "bg-[#16A34A] text-white hover:bg-[#15803D] active:scale-[0.98] shadow-sm font-semibold",
      danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
    };

    const sizes = {
      sm: "h-8 px-3.5 text-xs rounded-full gap-1.5",
      md: "h-10 px-5 text-sm rounded-full gap-2",
      lg: "h-12 px-7 text-sm sm:text-base rounded-full gap-2.5 font-semibold",
      icon: "h-9 w-9 p-0 rounded-full",
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
