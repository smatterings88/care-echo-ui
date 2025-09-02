import { Calendar, Users, BarChart3, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SurveyCardProps {
  title: string;
  description: string;
  responseCount: number;
  status: "active" | "draft" | "completed";
  createdAt: string;
  category: string;
}

const SurveyCard = ({ 
  title, 
  description, 
  responseCount, 
  status, 
  createdAt, 
  category 
}: SurveyCardProps) => {
  const statusColors = {
    active: "bg-success/10 text-success border-success/20",
    draft: "bg-warning/10 text-warning border-warning/20",
    completed: "bg-muted/50 text-muted-foreground border-border"
  };

  return (
    <Card className="survey-card group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {description}
          </p>
        </div>
        <Badge variant="outline" className={statusColors[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{responseCount} responses</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{createdAt}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-2">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary to-healthcare-green h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((responseCount / 100) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {Math.min((responseCount / 100) * 100, 100).toFixed(0)}%
        </span>
      </div>
    </Card>
  );
};

export default SurveyCard;