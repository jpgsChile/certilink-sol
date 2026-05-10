import { Link } from "react-router-dom";
import { APP_NAME, LOGO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  to?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
  imgClassName?: string;
  wordmarkClassName?: string;
};

/** PNG: altura fija y ancho automático para respetar proporción sin deformar. */
const sizeClasses = {
  sm: { img: "h-8 w-auto max-w-[7rem]", text: "text-base" },
  md: {
    img: "h-9 w-auto max-h-9 max-w-[10rem] sm:h-10 sm:max-h-10 sm:max-w-[11rem]",
    text: "text-lg sm:text-xl",
  },
  lg: { img: "h-11 w-auto max-h-11 max-w-[12rem] sm:h-12 sm:max-h-12 sm:max-w-[13rem]", text: "text-xl" },
};

export function BrandLogo({
  to = "/",
  size = "md",
  showWordmark = true,
  className,
  imgClassName,
  wordmarkClassName,
}: BrandLogoProps) {
  const s = sizeClasses[size];
  const imgAlt = showWordmark ? "" : APP_NAME;

  const inner = (
    <>
      <img
        src={LOGO_URL}
        alt={imgAlt}
        decoding="async"
        loading="eager"
        fetchPriority="high"
        className={cn(
          s.img,
          "shrink-0 object-contain object-left rounded-xl shadow-sm ring-1 ring-black/5",
          imgClassName
        )}
      />
      {showWordmark && (
        <span className={cn("font-bold tracking-tight text-foreground", s.text, wordmarkClassName)}>
          {APP_NAME}
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          "inline-flex items-center gap-2.5 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        aria-label={`${APP_NAME} — inicio`}
      >
        {inner}
      </Link>
    );
  }

  return <div className={cn("inline-flex items-center gap-2.5", className)}>{inner}</div>;
}
