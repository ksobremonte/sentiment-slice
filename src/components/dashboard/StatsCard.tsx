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
        "group relative overflow-hidden rounded-xl bg-card border border-border p-6 transition-all duration-300 cursor-pointer shadow-card",
        "hover:border-primary/50 hover:shadow-glow hover:-translate-y-1",
        isActive && "border-primary shadow-glow"
      )}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300",
            "bg-primary/10 group-hover:bg-primary/20",
            isActive && "bg-primary/20"
          )}>
            <Icon className="w-6 h-6 text-primary" />
          </div>
          {trend && trendValue && (
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend === "up" && "bg-success/10 text-success",
              trend === "down" && "bg-destructive/10 text-destructive",
              trend === "neutral" && "bg-muted text-muted-foreground"
            )}>
              {trend === "up" && "↑"} {trend === "down" && "↓"} {trendValue}
            </span>
          )}
        </div>
        
        <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground/70 mt-2">{description}</p>
        )}
      </div>
      
      {/* Click indicator */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-primary font-medium">Click to view →</span>
      </div>
    </div>
  );
};

export default StatsCard;
