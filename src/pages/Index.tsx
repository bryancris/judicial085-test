
import React from 'react';
import NavBar from '@/components/NavBar';
import HeroSection from '@/components/HeroSection';
import StreamlineSection from '@/components/StreamlineSection';
import SecuritySection from '@/components/SecuritySection';
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
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 Legal Assistant for Texas Law. All rights reserved.</p>
          <p className="mt-2 text-sm">Designed exclusively for Texas attorneys.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
