
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Gavel } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthState } from "@/hooks/useAuthState";

const NavBar: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { session } = useAuthState();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "Logged out successfully",
      });
      // Redirect to home page after logout
      navigate('/');
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="w-full bg-gray-200 dark:bg-gray-800 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Gavel className="h-6 w-6 text-brand-burgundy dark:text-brand-gold mr-2" />
          <Link to="/" className="text-xl font-bold dark:text-white">Judicial Junction</Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/features" className="font-medium hover:text-brand-burgundy dark:text-gray-200 dark:hover:text-brand-gold transition-colors">Features</Link>
          <a href="#" className="font-medium hover:text-brand-burgundy dark:text-gray-200 dark:hover:text-brand-gold transition-colors">Pricing</a>
          <a href="#" className="font-medium hover:text-brand-burgundy dark:text-gray-200 dark:hover:text-brand-gold transition-colors">Contact</a>
          {session && (
            <>
              <Link to="/clients" className="font-medium hover:text-brand-burgundy dark:text-gray-200 dark:hover:text-brand-gold transition-colors">Clients</Link>
              <Link to="/knowledge" className="font-medium hover:text-brand-burgundy dark:text-gray-200 dark:hover:text-brand-gold transition-colors">Knowledge</Link>
            </>
          )}
        </nav>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          
          {session ? (
            <Button 
              onClick={handleLogout}
              className="bg-brand-burgundy hover:bg-brand-burgundy/90 text-white flex items-center gap-2 dark:bg-brand-gold dark:hover:bg-brand-gold/90 dark:text-gray-900"
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
              className="bg-brand-burgundy hover:bg-brand-burgundy/90 text-white flex items-center gap-2 dark:bg-brand-gold dark:hover:bg-brand-gold/90 dark:text-gray-900"
            >
              <LogIn className="h-4 w-4" />
              Log In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavBar;
