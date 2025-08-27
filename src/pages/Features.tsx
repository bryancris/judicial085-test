
import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, FileSearch, MessageSquare, Database, Shield, Clock, Scale, Mic, FileEdit, BookOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const Features = () => {
  const proFeatures = [
    {
      title: "Client Intake Management",
      description: "Streamline client onboarding with structured intake and organized profiles.",
      icon: Database,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "AI Case Analysis",
      description: "Assess case strengths, risks, and strategies with AI-generated insights.",
      icon: Gavel,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "Case Discussion & Voice Chat",
      description: "Discuss matters naturally using voice with real-time AI collaboration.",
      icon: Mic,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "Quick Consult",
      description: "Get instant answers and guidance with AI; save chats and convert them into clients.",
      icon: MessageSquare,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "Document Hub & Storage",
      description: "Upload, organize, and search across PDFs, Word docs, and text files.",
      icon: FileSearch,
      color: "text-brand-burgundy dark:text-brand-gold"
    }
  ];

  const enterprisePlusFeatures = [
    {
      title: "Contract Review & Drafting",
      description: "Analyze contracts under Texas law with risk flags and suggested edits.",
      icon: Scale,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "AI Document Creation",
      description: "Generate pleadings, motions, and letters with a Google Docs-style editor.",
      icon: FileEdit,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "Templates Library",
      description: "Use curated templates to accelerate drafting and maintain consistency.",
      icon: BookOpen,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "Discovery Management",
      description: "Manage discovery requests and responses with AI assistance. Coming soon.",
      icon: FileText,
      color: "text-brand-burgundy dark:text-brand-gold",
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="mb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Legal Practice Features by Plan</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Compare Professional ($300/mo) and Enterprise ($600/mo). Both include 1 Attorney + 1 Paralegal.
            </p>
          </div>

          {/* Professional Plan */}
          <article className="mb-12">
            <header className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Professional — $300/month</h2>
              <Link
                to="/pricing"
                className="px-4 py-2 bg-brand-burgundy dark:bg-brand-burgundy/90 text-white rounded-md hover:bg-brand-burgundy/90 dark:hover:bg-brand-burgundy/80 transition-colors"
              >
                Choose Professional
              </Link>
            </header>
            <p className="text-muted-foreground mb-6">Includes the core tools to run your practice.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
              {proFeatures.map((feature, index) => (
                <Card key={index} className={cn(
                  "dark-card hover:shadow-lg transition-all duration-300",
                  "lg:col-span-2",
                  index === 3 ? "lg:col-start-2" : "",
                  index === 4 ? "lg:col-start-4" : ""
                )}>
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center mb-4">
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </article>

          {/* Enterprise Plan */}
          <article>
            <header className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Enterprise — $600/month</h2>
              <Link
                to="/pricing"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-foreground rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                Choose Enterprise
              </Link>
            </header>
            <p className="text-muted-foreground mb-6">Everything in Professional, plus:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
              {enterprisePlusFeatures.map((feature, index) => (
                <Card key={index} className={cn(
                  "dark-card hover:shadow-lg transition-all duration-300",
                  "lg:col-span-2",
                  index === 3 ? "lg:col-start-3" : ""
                )}>
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center mb-4">
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      {feature.title}
                      {feature.comingSoon && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">Coming soon</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </article>
        </section>

        <section className="mb-16">
          <div className="bg-gray-50 dark:bg-gray-800/60 dark:border dark:border-gray-700/30 rounded-lg p-8 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-burgundy dark:bg-brand-burgundy/80 flex items-center justify-center text-white text-2xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Upload & Organize</h3>
                <p className="text-gray-600 dark:text-gray-300">Upload documents, create client profiles, and organize case information in our secure platform.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-burgundy dark:bg-brand-burgundy/80 flex items-center justify-center text-white text-2xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">AI Analysis & Insights</h3>
                <p className="text-gray-600 dark:text-gray-300">Our AI analyzes cases, contracts, and legal matters to provide strategic insights and recommendations.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-burgundy dark:bg-brand-burgundy/80 flex items-center justify-center text-white text-2xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Collaborate & Create</h3>
                <p className="text-gray-600 dark:text-gray-300">Use voice chat, document editors, and research tools to collaborate and create legal documents efficiently.</p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Features;
