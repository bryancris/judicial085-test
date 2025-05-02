
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NavBar: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
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
        </nav>
        
        {session ? (
          <Button 
            onClick={handleLogout}
            className="bg-brand-burgundy hover:bg-brand-burgundy/90 text-white flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log Out
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
