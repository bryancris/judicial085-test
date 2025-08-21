
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ErrorAlert } from './ErrorAlert';
import { AuthForm, FormValues } from './AuthForm';
import { AuthToggle } from './AuthToggle';
import { ForgotPasswordLink } from './ForgotPasswordLink';

interface AuthCardProps {
  isLogin: boolean;
  isLoading: boolean;
  error: string | null;
  onSubmit: (values: FormValues) => Promise<void>;
  onToggleAuthMode: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({ 
  isLogin, 
  isLoading, 
  error, 
  onSubmit, 
  onToggleAuthMode 
}) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>{isLogin ? "Log In" : "Sign Up"}</CardTitle>
        <CardDescription>
          {isLogin 
            ? "Enter your credentials to access your account" 
            : "Create an account to get started with Judicial Junction"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorAlert error={error} />
        <AuthForm 
          isLogin={isLogin} 
          isLoading={isLoading} 
          onSubmit={onSubmit} 
        />
        <ForgotPasswordLink isLogin={isLogin} />
      </CardContent>
      <CardFooter>
        <AuthToggle 
          isLogin={isLogin} 
          isLoading={isLoading} 
          onClick={onToggleAuthMode} 
        />
      </CardFooter>
    </Card>
  );
};
