import React from "react";
import Link from "next/link";

interface LogoProps {
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

export function LogoIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 1. Orange 'i' Dot */}
      <circle cx="28" cy="22" r="9" fill="#FF5734" />

      {/* 2. Orange 'i' Stem */}
      <rect x="19" y="38" width="18" height="42" rx="9" fill="#FF5734" />

      {/* 3. Lavender Book/Page Fold on top of 'r' */}
      <path
        d="M 43 38 C 43 25 58 18 72 18 C 72 30 60 38 43 38 Z"
        fill="#BE94F5"
      />

      {/* 4. Black 'r' Body & Stem */}
      <path
        d="M 37 38 C 43 38 48 36 53 36 C 65 36 72 43 72 52 C 72 58 64 61 58 61 L 58 69 C 58 75 53 80 47 80 C 41 80 39 74 39 68 L 39 38 Z"
        fill="#151515"
      />

      {/* 5. 3 Golden Yellow Radiating Energy Rays */}
      <path
        d="M 72 42 L 84 35"
        stroke="#FCCC42"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M 76 54 L 89 54"
        stroke="#FCCC42"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M 71 66 L 81 74"
        stroke="#FCCC42"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLogo({
  showSubtitle = true,
  size = "md",
  href = "/",
  className = "",
}: LogoProps) {
  const iconSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const titleSize =
    size === "sm"
      ? "text-lg"
      : size === "lg"
      ? "text-2xl sm:text-3xl"
      : "text-xl sm:text-2xl";

  const content = (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <LogoIcon className={`${iconSize} shrink-0 transition-transform group-hover:scale-105`} />
      <div className="flex flex-col">
        <span className={`font-display ${titleSize} font-bold tracking-tight text-[#151515] leading-none`}>
          Intelli<span className="text-[#FF5734]">Tutor</span> <span className="text-[#151515]">AI</span>
        </span>
        {showSubtitle && (
          <span className="text-[10px] sm:text-xs font-semibold text-[#707070] tracking-tight mt-0.5">
            Your Personal Study Coach
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
