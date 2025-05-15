
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractReviewMessageAvatarProps {
  isAttorney: boolean;
}

const ContractReviewMessageAvatar: React.FC<ContractReviewMessageAvatarProps> = ({ 
  isAttorney 
}) => {
  return (
    <Avatar className={cn("mt-1", isAttorney ? "bg-green-100" : "bg-blue-100")}>
      <AvatarFallback className={cn(
        "text-sm",
        isAttorney ? "text-green-700" : "text-blue-700"
      )}>
        {isAttorney ? <User size={20} /> : <Bot size={20} />}
      </AvatarFallback>
    </Avatar>
  );
};

export default ContractReviewMessageAvatar;
