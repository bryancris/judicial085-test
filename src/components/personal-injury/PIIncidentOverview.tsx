import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users, FileText, TrendingUp } from "lucide-react";
import { PIIncidentData } from "@/types/personalInjury";

interface PIIncidentOverviewProps {
  incident: PIIncidentData;
}

const PIIncidentOverview: React.FC<PIIncidentOverviewProps> = ({ incident }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Incident Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Date:</span>
          <span className="text-sm font-medium">{new Date(incident.date).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Location:</span>
          <span className="text-sm font-medium">{incident.location}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{incident.type}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{incident.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Witnesses:</span>
            <span className="text-sm font-medium">{incident.witnesses}</span>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Police Report:</span>
            <Badge variant={incident.policeReport ? "default" : "destructive"}>
              {incident.policeReport ? "Available" : "Pending"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm text-muted-foreground">Confidence Score:</span>
          <span className="text-sm font-bold text-green-600">{incident.confidence}/10</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PIIncidentOverview;