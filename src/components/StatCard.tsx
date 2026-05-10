import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ label, value, change, changeType = "neutral", icon: Icon, iconColor }: StatCardProps) {
  const changeColorClass =
    changeType === "positive"
      ? "text-accent"
      : changeType === "negative"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground animate-count-up">{value}</p>
          {change && (
            <p className={`text-xs font-medium ${changeColorClass}`}>{change}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconColor || "bg-primary-muted"}`}
        >
          <Icon className={`h-5 w-5 ${iconColor ? "text-primary-foreground" : "text-primary"}`} />
        </div>
      </div>
    </div>
  );
}