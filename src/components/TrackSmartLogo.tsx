import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textClassName?: string;
}

export default function TrackSmartLogo({
  className = "",
  size = "md",
  showText = true,
  textClassName = "",
}: LogoProps) {
  const sizeMap = {
    sm: { text: "text-base tracking-wide" },
    md: { text: "text-xl tracking-wider" },
    lg: { text: "text-3xl tracking-widest" },
    xl: { text: "text-5xl tracking-widest" },
  };

  const dimensions = sizeMap[size];

  return (
    <div className={`flex items-center select-none ${className}`}>
      {showText ? (
        <span
          className={`font-sans tracking-[0.12em] font-extrabold uppercase ${dimensions.text} ${textClassName}`}
        >
          <span className={textClassName.includes("text-") ? "" : "text-slate-900 dark:text-slate-50"}>TRACK </span>
          <span className="text-emerald-500 dark:text-emerald-400">SMART</span>
        </span>
      ) : (
        <span
          className={`font-sans font-black tracking-wider text-emerald-500 dark:text-emerald-400 ${dimensions.text} ${textClassName}`}
        >
          TS
        </span>
      )}
    </div>
  );
}
