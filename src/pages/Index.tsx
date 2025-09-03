
import React from 'react';
import NavBar from '@/components/NavBar';
import HeroSection from '@/components/HeroSection';
import StreamlineSection from '@/components/StreamlineSection';
import SecuritySection from '@/components/SecuritySection';
import { LegalFooter } from '@/components/legal/LegalFooter';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NavBar />
      <main className="flex-grow">
        <HeroSection />
        <StreamlineSection />
        <SecuritySection />
      </main>
      <LegalFooter />
    </div>
  );
};

export default Index;
