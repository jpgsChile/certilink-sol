import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { institutionInitials } from "@/lib/institution-branding";
import { cn } from "@/lib/utils";

type InstitutionLogoProps = {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  rounded?: "full" | "lg" | "md";
};

const sizeMap = {
  sm: { box: "h-8 w-8", text: "text-xs", img: "h-8 w-8" },
  md: { box: "h-10 w-10", text: "text-sm", img: "h-10 w-10" },
  lg: { box: "h-12 w-12", text: "text-base", img: "h-12 w-12" },
  xl: { box: "h-16 w-16", text: "text-lg", img: "h-16 w-16" },
};

const roundedMap = {
  full: "rounded-full",
  lg: "rounded-lg",
  md: "rounded-md",
};

export function InstitutionLogo({
  name,
  logoUrl,
  size = "md",
  className,
  rounded = "lg",
}: InstitutionLogoProps) {
  const [broken, setBroken] = useState(false);
  const initials = institutionInitials(name);
  const s = sizeMap[size];
  const showLogo = Boolean(logoUrl?.trim()) && !broken;

  if (showLogo) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-border",
          s.box,
          roundedMap[rounded],
          className
        )}
      >
        <img
          src={logoUrl!}
          alt={name}
          className={cn("max-h-full max-w-full object-contain p-0.5", s.img)}
          onError={() => setBroken(true)}
          decoding="async"
        />
      </div>
    );
  }

  return (
    <Avatar className={cn(s.box, roundedMap[rounded], className)}>
      <AvatarImage src="" alt={name} />
      <AvatarFallback className={cn("bg-gradient-primary text-primary-foreground font-semibold", s.text)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
