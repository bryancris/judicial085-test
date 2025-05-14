
import React from 'react';
import { Button } from "@/components/ui/button";

interface AuthToggleProps {
  isLogin: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export const AuthToggle: React.FC<AuthToggleProps> = ({ isLogin, isLoading, onClick }) => {
  return (
    <Button 
      variant="link" 
      className="w-full" 
      type="button"
      onClick={onClick}
      disabled={isLoading}
    >
      {isLogin 
        ? "Don't have an account? Sign Up" 
        : "Already have an account? Log In"}
    </Button>
  );
};
