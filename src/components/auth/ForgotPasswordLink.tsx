import React, { useState } from 'react';
import { ForgotPasswordDialog } from './ForgotPasswordDialog';

interface ForgotPasswordLinkProps {
  isLogin: boolean;
}

export const ForgotPasswordLink: React.FC<ForgotPasswordLinkProps> = ({ isLogin }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!isLogin) return null;

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Forgot Password?
        </button>
      </div>
      <ForgotPasswordDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </>
  );
};