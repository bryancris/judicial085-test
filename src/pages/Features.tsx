
import React from 'react';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, FileSearch, MessageSquare, Database, Shield, Clock, Scale, Mic, FileEdit, BookOpen } from 'lucide-react';

const Features = () => {
  const featuresList = [
    {
      title: "Contract Review & Analysis",
      description: "AI-powered contract analysis under Texas law with risk assessment, issue identification, and suggested modifications.",
      icon: Scale,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "Voice-Powered Legal Consultations",
      description: "Engage in natural voice conversations with AI for case discussions, strategy planning, and legal analysis.",
      icon: Mic,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "Document Creation & Editing",
      description: "Create and edit legal documents with our Google Docs-style editor, complete with templates and formatting tools.",
      icon: FileEdit,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "AI-Powered Case Analysis",
      description: "Comprehensive case analysis with outcome predictions, strength assessments, and strategic recommendations.",
      icon: Gavel,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "Scholarly Research Integration",
      description: "Access Google Scholar and legal databases to find relevant case law, statutes, and scholarly articles.",
      icon: BookOpen,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "Legal Discovery Automation",
      description: "Streamline discovery processes with AI analysis of requests and automated response generation.",
      icon: FileSearch,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "Client Case Management",
      description: "Organize client information, case details, and maintain comprehensive case histories with AI-powered intake.",
      icon: Database,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "Multi-Format Document Processing",
      description: "Upload and process PDFs, Word documents, and text files with AI-powered content extraction and analysis.",
      icon: Shield,
      color: "text-brand-burgundy dark:text-brand-gold"
    },
    {
      title: "Intelligent Case Discussion",
      description: "Collaborate with AI assistants for complex legal strategy discussions and case preparation.",
      icon: MessageSquare,
      color: "text-brand-burgundy dark:text-brand-gold"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="mb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Comprehensive Legal Practice Management</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Judicial Junction combines AI-powered analysis, voice technology, and document management 
              to transform how legal professionals work with clients and cases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((feature, index) => (
              <Card key={index} className="dark-card hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center mb-4">
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
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

        <section>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-6">Ready to transform your legal practice?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Join legal professionals who are using AI to enhance their practice, save time, and deliver better outcomes for clients.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="/auth" 
                className="px-8 py-3 bg-brand-burgundy dark:bg-brand-burgundy/90 text-white font-medium rounded-md hover:bg-brand-burgundy/90 dark:hover:bg-brand-burgundy/80 transition-colors"
              >
                Start Your Practice
              </a>
              <a 
                href="#" 
                className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                Schedule a Demo
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Features;
