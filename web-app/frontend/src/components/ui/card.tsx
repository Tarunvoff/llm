import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "subtle" | "interactive" | "lavender" | "yellow" | "coral" | "framed";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-white border border-[#E8E6DE] shadow-subtle text-[#151515]",
    subtle: "bg-[#FAF9F5] border border-[#E8E6DE] text-[#151515]",
    interactive: "bg-white border border-[#E8E6DE] hover:border-[#FF5734]/50 hover:shadow-card transition-all duration-200 text-[#151515] cursor-pointer",
    lavender: "bg-[#F0E9FD] border border-[#E0D1FB] text-[#151515]",
    yellow: "bg-[#FFF9D6] border border-[#FFF1A3] text-[#151515]",
    coral: "bg-[#FFF3F0] border border-[#FFC8BC] text-[#151515]",
    framed: "bg-white border-2 border-[#151515] shadow-[4px_4px_0px_0px_#151515] text-[#151515]",
  };
  return (
    <div
      ref={ref}
      className={cn("rounded-2xl p-6 transition-all", variants[variant], className)}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4 border-b border-[#EFEFE8]", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-display font-semibold text-lg text-[#151515] tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-[#555555] font-normal leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
