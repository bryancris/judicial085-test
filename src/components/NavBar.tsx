
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NavBar: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isMounted = useRef(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Component mount indicator
    isMounted.current = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted.current) {
        setSession(currentSession);
      }
    });

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error.message);
          return;
        }
        if (isMounted.current) {
          setSession(data.session);
        }
      } catch (err) {
        console.error("Unexpected error checking session:", err);
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (isMounted.current) {
        toast({
          title: "Logged out successfully",
        });
        // Redirect to home page after logout
        navigate('/');
      }
    } catch (error: any) {
      console.error("Logout error:", error);
      if (isMounted.current) {
        toast({
          title: "Error logging out",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      if (isMounted.current) {
        setIsLoggingOut(false);
      }
    }
  };

  return (
    <header className="w-full bg-gray-200 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-brand-burgundy mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            <line x1="6" y1="1" x2="6" y2="4"></line>
            <line x1="10" y1="1" x2="10" y2="4"></line>
            <line x1="14" y1="1" x2="14" y2="4"></line>
          </svg>
          <Link to="/" className="text-xl font-bold">Judicial Junction</Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="font-medium hover:text-brand-burgundy transition-colors">Features</a>
          <a href="#" className="font-medium hover:text-brand-burgundy transition-colors">Benefits</a>
          <a href="#" className="font-medium hover:text-brand-burgundy transition-colors">Pricing</a>
          <a href="#" className="font-medium hover:text-brand-burgundy transition-colors">Contact</a>
          {session && (
            <>
              <Link to="/clients" className="font-medium hover:text-brand-burgundy transition-colors">Clients</Link>
              <Link to="/knowledge" className="font-medium hover:text-brand-burgundy transition-colors">Knowledge</Link>
            </>
          )}
        </nav>
        
        {session ? (
          <Button 
            onClick={handleLogout}
            className="bg-brand-burgundy hover:bg-brand-burgundy/90 text-white flex items-center gap-2"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Logging out...
              </span>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Log Out
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-brand-burgundy hover:bg-brand-burgundy/90 text-white flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Log In
          </Button>
        )}
      </div>
    </header>
  );
};

export default NavBar;
