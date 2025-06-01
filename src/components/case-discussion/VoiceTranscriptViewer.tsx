
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, User, Bot, Calendar, Download } from 'lucide-react';
import { useVoiceTranscripts, VoiceTranscript } from '@/hooks/useVoiceTranscripts';
import { format } from 'date-fns';

interface VoiceTranscriptViewerProps {
  clientId: string;
}

const VoiceTranscriptViewer: React.FC<VoiceTranscriptViewerProps> = ({ clientId }) => {
  const { transcripts, isLoading, refreshTranscripts } = useVoiceTranscripts(clientId);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Group transcripts by session
  const sessionGroups = transcripts.reduce((groups, transcript) => {
    if (!groups[transcript.session_id]) {
      groups[transcript.session_id] = [];
    }
    groups[transcript.session_id].push(transcript);
    return groups;
  }, {} as Record<string, VoiceTranscript[]>);

  const exportTranscript = (sessionId: string) => {
    const sessionTranscripts = sessionGroups[sessionId];
    if (!sessionTranscripts?.length) return;

    const content = sessionTranscripts
      .map(t => `[${format(new Date(t.timestamp), 'HH:mm:ss')}] ${t.speaker.toUpperCase()}: ${t.content}`)
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-transcript-${sessionId.slice(0, 8)}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Voice Chat Transcripts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (Object.keys(sessionGroups).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Voice Chat Transcripts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No voice chat transcripts available yet.</p>
            <p className="text-sm">Start a voice chat session to see transcripts here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedTranscripts = selectedSession ? sessionGroups[selectedSession] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Voice Chat Transcripts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-96">
          {/* Session List */}
          <div className="md:col-span-1">
            <h4 className="font-medium mb-2">Chat Sessions</h4>
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {Object.entries(sessionGroups).map(([sessionId, sessionTranscripts]) => {
                  const firstTranscript = sessionTranscripts[0];
                  const isSelected = selectedSession === sessionId;
                  
                  return (
                    <Button
                      key={sessionId}
                      variant={isSelected ? "default" : "ghost"}
                      className="w-full justify-start h-auto p-3"
                      onClick={() => setSelectedSession(sessionId)}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">
                          {format(new Date(firstTranscript.timestamp), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs opacity-75">
                          {format(new Date(firstTranscript.timestamp), 'HH:mm')} • {sessionTranscripts.length} messages
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Transcript Details */}
          <div className="md:col-span-2">
            {selectedTranscripts ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedTranscripts[0].timestamp), 'MMMM dd, yyyy - HH:mm')}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportTranscript(selectedSession!)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
                
                <ScrollArea className="h-72">
                  <div className="space-y-4">
                    {selectedTranscripts.map((transcript, index) => (
                      <div key={transcript.id}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {transcript.speaker === 'user' ? (
                              <User className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Bot className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {transcript.speaker === 'user' ? 'You' : 'AI Assistant'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(transcript.timestamp), 'HH:mm:ss')}
                              </span>
                            </div>
                            <p className="text-sm">{transcript.content}</p>
                          </div>
                        </div>
                        {index < selectedTranscripts.length - 1 && (
                          <Separator className="my-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex items-center justify-center h-72 text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a chat session to view the transcript</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceTranscriptViewer;
