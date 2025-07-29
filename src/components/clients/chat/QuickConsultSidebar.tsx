import React, { useState } from "react";
import { Plus, Search, MessageSquare, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuickConsultSessions, QuickConsultSession } from "@/hooks/useQuickConsultSessions";
import { formatDistanceToNow, isToday, isYesterday, startOfWeek, isWithinInterval } from "date-fns";

interface QuickConsultSidebarProps {
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onSessionDelete?: (sessionId: string) => void;
  isCollapsed: boolean;
}

const QuickConsultSidebar = ({ 
  currentSessionId, 
  onSessionSelect, 
  onNewChat,
  onSessionDelete,
  isCollapsed 
}: QuickConsultSidebarProps) => {
  const { sessions, isLoading, deleteSession } = useQuickConsultSessions();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupSessionsByDate = (sessions: QuickConsultSession[]) => {
    const today: QuickConsultSession[] = [];
    const yesterday: QuickConsultSession[] = [];
    const thisWeek: QuickConsultSession[] = [];
    const older: QuickConsultSession[] = [];

    sessions.forEach(session => {
      const date = new Date(session.updated_at);
      
      if (isToday(date)) {
        today.push(session);
      } else if (isYesterday(date)) {
        yesterday.push(session);
      } else if (isWithinInterval(date, { start: startOfWeek(new Date()), end: new Date() })) {
        thisWeek.push(session);
      } else {
        older.push(session);
      }
    });

    return { today, yesterday, thisWeek, older };
  };

  const { today, yesterday, thisWeek, older } = groupSessionsByDate(filteredSessions);

  const SessionGroup = ({ title, sessions }: { title: string; sessions: QuickConsultSession[] }) => {
    if (sessions.length === 0) return null;

    return (
      <div className="mb-4">
        {!isCollapsed && (
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">{title}</h3>
        )}
        <div className="space-y-1">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`group relative p-2 rounded-md cursor-pointer transition-colors ${
                session.id === currentSessionId
                  ? "bg-teal-50 border border-teal-200 text-teal-900"
                  : "hover:bg-accent"
              }`}
              onClick={() => onSessionSelect(session.id)}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 flex-shrink-0 text-teal-600" />
                {!isCollapsed && (
                  <>
                    <span className="text-sm truncate flex-1">{session.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Notify parent component first for state cleanup
                        onSessionDelete?.(session.id);
                        // Then delete from database
                        deleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </>
                )}
              </div>
              {!isCollapsed && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-14 border-r border-border p-2 flex flex-col gap-2">
        <Button
          onClick={onNewChat}
          size="icon"
          className="w-10 h-10 bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {sessions.slice(0, 8).map(session => (
              <Button
                key={session.id}
                variant={session.id === currentSessionId ? "secondary" : "ghost"}
                size="icon"
                className="w-10 h-10"
                onClick={() => onSessionSelect(session.id)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-border p-4 flex flex-col gap-4">
      <Button
        onClick={onNewChat}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Chat
      </Button>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <div>
            <SessionGroup title="Today" sessions={today} />
            <SessionGroup title="Yesterday" sessions={yesterday} />
            <SessionGroup title="This Week" sessions={thisWeek} />
            <SessionGroup title="Older" sessions={older} />
            
            {filteredSessions.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No chats found" : "No chats yet"}
                </p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default QuickConsultSidebar;