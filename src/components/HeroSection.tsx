
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import EarlyAccessDialog from '@/components/EarlyAccessDialog';

const FeatureCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ 
  title, 
  description,
  icon 
}) => {
  return (
    <Card className="dark-card text-foreground p-4 flex flex-col items-start h-full min-h-[140px] justify-between">
      <div className="flex flex-col flex-1">
        <div className="mb-3">{icon}</div>
        <h3 className="text-base font-semibold mb-2 leading-tight">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
      </div>
    </Card>
  );
};

const HeroSection: React.FC = () => {
  const [showEarlyAccessDialog, setShowEarlyAccessDialog] = useState(false);

  return (
    <section className="hero-section text-white relative overflow-hidden">
      <div className="animated-bg"></div>
      <div className="animated-particles">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6 max-w-xl">
            <div className="inline-block bg-gray-800/70 backdrop-blur-sm px-3 py-1 rounded-full text-sm mb-4">
              Built for Texas Attorneys
            </div>
            
            <h2 className="text-5xl font-bold leading-tight animate-fade-in">
              AI-Powered <span className="gold-text">Research Assistant</span> for Texas Law
            </h2>
            
            <p className="text-gray-300 text-lg animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Research assistance for fact pattern analysis — gives Texas attorneys AI-powered research tools for case research assistance, document template assistance, and precedent discovery, all focused on Texas law.
            </p>
            <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-3 text-amber-200 text-sm animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <strong>ATTORNEY SUPERVISION REQUIRED:</strong> Research assistance tool only. Not a substitute for attorney advice. All AI output requires attorney review and professional judgment.
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <Button 
                className="bg-brand-gold hover:bg-brand-gold/90 text-black font-medium flex items-center gap-2 hover-scale"
                onClick={() => {
                  console.log('Button clicked, opening dialog');
                  setShowEarlyAccessDialog(true);
                }}
              >
                Get Early Access + Updates
                <Mail className="h-4 w-4" />
              </Button>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-700/80 to-gray-600/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-200 border border-gray-500/30 shadow-lg">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                Coming Soon
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="p-4 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
                  <FeatureCard
                    title="Document Upload & Analysis"
                    description="Upload PDFs and Word docs for instant AI analysis"
                    icon={<div className="flex items-center justify-center w-8 h-8 rounded-md bg-brand-burgundy bg-opacity-80">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                      </svg>
                    </div>}
                  />
                </div>
                
                <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
                  <FeatureCard
                    title="Document Template Assistance"
                    description="Upload firm templates for research assistance - Attorney review required"
                    icon={<div className="flex items-center justify-center w-8 h-8 rounded-md bg-green-700 bg-opacity-80">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <path d="M16 13H8"></path>
                        <path d="M16 17H8"></path>
                        <path d="M10 9H8"></path>
                      </svg>
                    </div>}
                  />
                </div>
                
                <div className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
                  <FeatureCard
                    title="Case Law Discovery"
                    description="Find similar cases and relevant precedents automatically"
                    icon={<div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-700 bg-opacity-80">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="M21 21l-4.35-4.35"></path>
                        <path d="M11 6v10"></path>
                        <path d="M6 11h10"></path>
                      </svg>
                    </div>}
                  />
                </div>
                
                <div className="animate-fade-in" style={{ animationDelay: "0.6s" }}>
                  <FeatureCard
                    title="100% Texas Law Focus"
                    description="No hallucinations or made-up statutes"
                    icon={<div className="flex items-center justify-center w-8 h-8 rounded-md bg-purple-700 bg-opacity-80">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                      </svg>
                    </div>}
                  />
                </div>
                
                <div className="animate-fade-in" style={{ animationDelay: "0.7s" }}>
                  <FeatureCard
                    title="Real-Time Research Assistance"
                    description="Research support requiring attorney supervision and verification"
                    icon={<div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-700 bg-opacity-80">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        <path d="M13 8H7"></path>
                        <path d="M17 12H7"></path>
                      </svg>
                    </div>}
                  />
                </div>
                
                <div className="animate-fade-in" style={{ animationDelay: "0.8s" }}>
                  <FeatureCard
                    title="Voice-Powered Tools"
                    description="Ask questions out loud no typing required"
                    icon={<div className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-700 bg-opacity-80">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="22"></line>
                        <line x1="8" y1="22" x2="16" y2="22"></line>
                      </svg>
                    </div>}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug info */}
      {showEarlyAccessDialog && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-2 z-[9999]">
          Dialog should be open: {showEarlyAccessDialog.toString()}
        </div>
      )}
      
      <EarlyAccessDialog 
        open={showEarlyAccessDialog} 
        onOpenChange={setShowEarlyAccessDialog} 
      />
    </section>
  );
};

export default HeroSection;
