import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: ReactNode;
  positive?: boolean;
}

export default function StatCard({ title, value, change, icon, positive = true }: StatCardProps) {
  return (
    <div className="glass-card p-5 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="stat-value mt-1 text-foreground">{value}</p>
          {change && (
            <p className={`mt-1 text-xs font-medium ${positive ? "text-primary" : "text-destructive"}`}>
              {positive ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}
