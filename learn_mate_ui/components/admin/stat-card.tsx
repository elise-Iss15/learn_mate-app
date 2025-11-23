import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-gray-600',
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div
            className={`text-xs mt-2 flex items-center ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span className="ml-1">{Math.abs(trend.value)}%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
