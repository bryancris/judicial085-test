import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, MoreHorizontal, Trash2 } from "lucide-react";
import { ChatSession } from "@/hooks/useQuickConsultSessions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuickConsultSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onSessionDelete: (sessionId: string) => void;
}

const QuickConsultSidebar = ({ 
  sessions,
  currentSessionId, 
  onSessionSelect, 
  onNewChat,
  onSessionDelete
}: QuickConsultSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      Today: [] as ChatSession[],
      Yesterday: [] as ChatSession[],
      'This Week': [] as ChatSession[],
      'This Month': [] as ChatSession[],
      Older: [] as ChatSession[]
    };

    sessions.forEach(session => {
      const sessionDate = session.createdAt;
      const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        groups.Today.push(session);
      } else if (diffDays === 1) {
        groups.Yesterday.push(session);
      } else if (diffDays <= 7) {
        groups['This Week'].push(session);
      } else if (diffDays <= 30) {
        groups['This Month'].push(session);
      } else {
        groups.Older.push(session);
      }
    });

    return groups;
  };

  const sessionGroups = groupSessionsByDate(filteredSessions);

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <Button 
          onClick={onNewChat}
          className="w-full justify-start gap-2 mb-3"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(sessionGroups).map(([groupName, groupSessions]) => {
            if (groupSessions.length === 0) return null;
            
            return (
              <div key={groupName} className="mb-4">
                <h3 className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                  {groupName}
                </h3>
                <div className="space-y-1">
                  {groupSessions.map(session => (
                    <div
                      key={session.id}
                      className={`group relative flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                        currentSessionId === session.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => onSessionSelect(session.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {session.title}
                        </div>
                        {session.lastMessage && (
                          <div className="text-xs text-muted-foreground truncate">
                            {session.lastMessage}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {session.timestamp}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onSessionDelete(session.id);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {filteredSessions.length === 0 && searchQuery && (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No chats found</p>
            </div>
          )}
          
          {sessions.length === 0 && !searchQuery && (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No chat history yet</p>
              <p className="text-xs">Start a new conversation to see it here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default QuickConsultSidebar;