
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { Card } from "@/components/ui/card";

const FeatureCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ 
  title, 
  description,
  icon 
}) => {
  return (
    <Card className="dark-card text-foreground p-4 flex flex-col items-start">
      <div className="mb-2">{icon}</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </Card>
  );
};

const HeroSection: React.FC = () => {
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
              AI-Powered <span className="gold-text">Legal Assistant</span> for Texas Law
            </h2>
            
            <p className="text-gray-300 text-lg animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Navigate complex legal workflows with confidence using our 
              specialized AI assistant trained exclusively on Texas law.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <Button className="bg-brand-gold hover:bg-brand-gold/90 text-black font-medium flex items-center gap-2 hover-scale">
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
            <div className="p-4 max-w-md mx-auto">
              <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <FeatureCard
                  title="Case Analysis"
                  description="Faster insights from legal documents"
                  icon={<div className="flex items-center justify-center w-8 h-8 rounded-md bg-brand-burgundy bg-opacity-80">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>}
                />
              </div>
              
              <div className="mt-6 animate-fade-in" style={{ animationDelay: "0.5s" }}>
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
