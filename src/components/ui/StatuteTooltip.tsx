/**
 * Interactive tooltip component for statute citations
 */

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, FileText } from 'lucide-react';
import { getStatuteSummary, getStatutePdfUrl, StatuteSummary } from '@/utils/statuteSummaries';

interface StatuteTooltipProps {
  citation: string;
  children: React.ReactNode;
  className?: string;
}

export const StatuteTooltip: React.FC<StatuteTooltipProps> = ({
  citation,
  children,
  className = ''
}) => {
  const summary = getStatuteSummary(citation);
  const pdfUrl = getStatutePdfUrl(citation);

  // If no summary available, render children without tooltip
  if (!summary && !pdfUrl) {
    return <span className={className}>{children}</span>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      // Fallback to knowledge base search
      const searchUrl = `/knowledge?search=${encodeURIComponent(citation)}`;
      window.open(searchUrl, '_blank');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`
              inline-flex items-center gap-1 px-1 py-0.5 rounded
              bg-blue-50 dark:bg-blue-900/20
              border border-blue-200 dark:border-blue-700
              text-blue-700 dark:text-blue-300
              hover:bg-blue-100 dark:hover:bg-blue-800/30
              hover:border-blue-300 dark:hover:border-blue-600
              cursor-pointer transition-colors
              ${className}
            `}
            onClick={handleClick}
          >
            {children}
            <FileText className="h-3 w-3 opacity-60" />
          </span>
        </TooltipTrigger>
        <TooltipContent 
          className="max-w-sm p-3 bg-popover border shadow-lg"
          side="top"
          align="start"
        >
          <div className="space-y-2">
            {summary && (
              <>
                <div className="font-semibold text-sm text-foreground">
                  {summary.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {summary.summary}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded-sm">
                    {summary.category.toUpperCase()}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
              <ExternalLink className="h-3 w-3" />
              <span>Click to view full statute text</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};