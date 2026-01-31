import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  onClick?: () => void;
  isActive?: boolean;
}

const StatsCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  onClick,
  isActive,
}: StatsCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card border-2 border-border p-6 transition-all duration-300 cursor-pointer shadow-card",
        "hover:border-primary/50 hover:shadow-warm hover:-translate-y-1",
        isActive && "border-primary shadow-warm"
      )}
    >
      {/* Warm glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
            "bg-primary/10 group-hover:bg-primary/20",
            isActive && "bg-primary/20"
          )}>
            <Icon className="w-7 h-7 text-primary" />
          </div>
          {trend && trendValue && (
            <span className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-full",
              trend === "up" && "bg-success/10 text-success",
              trend === "down" && "bg-destructive/10 text-destructive",
              trend === "neutral" && "bg-muted text-muted-foreground"
            )}>
              {trend === "up" && "↑"} {trend === "down" && "↓"} {trendValue}
            </span>
          )}
        </div>
        
        <h3 className="text-4xl font-display font-bold text-foreground mb-2">{value}</h3>
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground/70 mt-2">{description}</p>
        )}
      </div>
      
      {/* Click indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-primary font-semibold">View details →</span>
      </div>
    </div>
  );
};

export default StatsCard;
