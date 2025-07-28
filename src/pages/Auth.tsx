
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/useAuthState";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormValues } from "@/components/auth/AuthForm";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, isLoading } = useAuthState();
  const isMobile = useIsMobile();

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      let response;
      
      if (isLogin) {
        // Login flow
        response = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
      } else {
        // Signup flow
        response = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
      }

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (isLogin) {
        if (response.data.session) {
          toast({
            title: "Login successful",
            description: "Welcome back!",
          });
          // Redirect mobile users to Quick Consult, desktop users to Clients
          navigate(isMobile ? "/quick-consult" : "/clients");
        } else {
          setError("No session created. Please check your credentials and try again.");
        }
      } else {
        if (response.data.user) {
          toast({
            title: "Signup successful",
            description: "Please check your email for verification instructions",
          });
        } else {
          setError("Account creation failed. Please try again.");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setError(error.message);
      toast({
        title: "Authentication error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Loading...
        </div>
      </div>
    );
  }

  // Redirect if already logged in
  if (session) {
    // Redirect mobile users to Quick Consult, desktop users to Clients
    return <Navigate to={isMobile ? "/quick-consult" : "/clients"} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <AuthCard
        isLogin={isLogin}
        isLoading={isSubmitting}
        error={error}
        onSubmit={handleSubmit}
        onToggleAuthMode={toggleAuthMode}
      />
    </div>
  );
};

export default Auth;
