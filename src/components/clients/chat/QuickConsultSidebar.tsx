import React from 'react';

interface QuickConsultSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat?: () => void;
  onSessionDelete?: (sessionId: string) => void;
}

const QuickConsultSidebar = ({ 
  isCollapsed, 
  onToggle, 
  currentSessionId, 
  onSessionSelect, 
  onNewChat,
  onSessionDelete
}: QuickConsultSidebarProps) => {
  return (
    <div className="w-80 border-r bg-background">
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Sidebar feature being updated for 3-Agent AI system
        </p>
      </div>
    </div>
  );
};

export default QuickConsultSidebar;