import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  completed?: boolean;
}

interface ActivityTimelineProps {
  title: string;
  description?: string;
  activities: ActivityItem[];
}

export function ActivityTimeline({ title, description, activities }: ActivityTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No activities yet</p>
          ) : (
            activities.map((activity, index) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex flex-col items-center">
                  {activity.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                  {index < activities.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-200 my-1" />
                  )}
                </div>
                <div className="flex-1 space-y-1 pb-4">
                  <p className="text-sm font-medium">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-gray-500">{activity.description}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
