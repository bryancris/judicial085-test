
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/useAuthState";
import { AuthCard } from "@/components/auth/AuthCard";
import { FormValues } from "@/components/auth/AuthForm";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, isLoading, setIsLoading, isMounted } = useAuthState();

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
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
          navigate("/");
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
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  // Redirect if already logged in - IMPORTANT: This conditional return must come after all hook calls
  if (session) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <AuthCard
        isLogin={isLogin}
        isLoading={isLoading}
        error={error}
        onSubmit={handleSubmit}
        onToggleAuthMode={toggleAuthMode}
      />
    </div>
  );
};

export default Auth;
