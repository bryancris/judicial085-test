import { Calendar, Clock, Activity, Stethoscope, Pill, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";

interface TimelineEvent {
  id: string;
  event_date: string;
  event_type: string;
  description: string;
  provider?: string;
  source_document?: string;
  reliability_score: number;
}

interface PITimelineProps {
  events: TimelineEvent[];
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'injury':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'treatment':
      return <Stethoscope className="h-4 w-4 text-blue-500" />;
    case 'diagnosis':
      return <FileText className="h-4 w-4 text-purple-500" />;
    case 'medication':
      return <Pill className="h-4 w-4 text-green-500" />;
    case 'therapy':
      return <Activity className="h-4 w-4 text-orange-500" />;
    case 'imaging':
      return <Calendar className="h-4 w-4 text-indigo-500" />;
    case 'legal_milestone':
      return <FileText className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getEventTypeLabel = (eventType: string) => {
  switch (eventType) {
    case 'injury':
      return 'Injury';
    case 'treatment':
      return 'Treatment';
    case 'diagnosis':
      return 'Diagnosis';
    case 'medication':
      return 'Medication';
    case 'therapy':
      return 'Therapy';
    case 'imaging':
      return 'Imaging';
    case 'legal_milestone':
      return 'Legal';
    default:
      return 'Event';
  }
};

const getEventTypeColor = (eventType: string, hasGap?: boolean) => {
  // If this is a treatment event that follows a 30+ day gap, show as red
  if (hasGap && (eventType === 'treatment' || eventType === 'therapy' || eventType === 'medication')) {
    return 'destructive';
  }
  
  switch (eventType) {
    case 'injury':
      return 'destructive';
    case 'treatment':
      return 'default';
    case 'diagnosis':
      return 'secondary';
    case 'medication':
      return 'default';
    case 'therapy':
      return 'outline';
    case 'imaging':
      return 'secondary';
    case 'legal_milestone':
      return 'outline';
    default:
      return 'outline';
  }
};

const detectTreatmentGaps = (events: TimelineEvent[]) => {
  // Sort events by date to ensure chronological order
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
  
  const treatmentTypes = ['treatment', 'therapy', 'medication'];
  const eventsWithGaps: Set<string> = new Set();
  
  // Track the last treatment date
  let lastTreatmentDate: Date | null = null;
  
  for (const event of sortedEvents) {
    if (treatmentTypes.includes(event.event_type)) {
      const currentDate = new Date(event.event_date);
      
      if (lastTreatmentDate) {
        const daysBetween = differenceInDays(currentDate, lastTreatmentDate);
        
        // If there's a gap of more than 30 days, mark this event
        if (daysBetween > 30) {
          eventsWithGaps.add(event.id);
        }
      }
      
      lastTreatmentDate = currentDate;
    }
  }
  
  return eventsWithGaps;
};

export function PITimeline({ events }: PITimelineProps) {
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Medical Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No timeline events available. Timeline will populate as documents are processed.</p>
        </CardContent>
      </Card>
    );
  }

  // Sort events chronologically and detect treatment gaps
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );
  const eventsWithGaps = detectTreatmentGaps(events);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Medical Timeline
          <Badge variant="secondary" className="ml-2">
            {events.length} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline line */}
              {index < sortedEvents.length - 1 && (
                <div className="absolute left-6 top-8 w-px h-8 bg-border" />
              )}
              
              <div className="flex items-start space-x-4">
                {/* Event icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-background border rounded-full flex items-center justify-center">
                  {getEventIcon(event.event_type)}
                </div>
                
                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getEventTypeColor(event.event_type, eventsWithGaps.has(event.id))} className="text-xs">
                        {getEventTypeLabel(event.event_type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {event.reliability_score && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(event.reliability_score * 100)}% reliability
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium text-foreground mb-1">
                    {event.description}
                  </p>
                  
                  {event.provider && (
                    <p className="text-xs text-muted-foreground mb-1">
                      Provider: {event.provider}
                    </p>
                  )}
                  
                  {event.source_document && (
                    <p className="text-xs text-muted-foreground">
                      Source: {event.source_document}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default PITimeline;