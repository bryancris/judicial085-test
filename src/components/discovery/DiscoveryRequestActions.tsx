
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface DiscoveryRequestActionsProps {
  clientId: string;
  onUpdateStatus: (status: 'pending' | 'in_progress' | 'completed') => void;
}

const DiscoveryRequestActions: React.FC<DiscoveryRequestActionsProps> = ({ 
  clientId, 
  onUpdateStatus 
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={() => navigate(`/clients/${clientId}`)}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Client
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <MoreHorizontal className="h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onUpdateStatus('pending')}>Mark as Pending</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onUpdateStatus('in_progress')}>Mark In Progress</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onUpdateStatus('completed')}>Mark as Completed</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DiscoveryRequestActions;
