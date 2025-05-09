
import React from 'react';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, FileSearch, MessageSquare, Database, Shield, Clock } from 'lucide-react';

const Features = () => {
  const featuresList = [
    {
      title: "Legal Discovery Automation",
      description: "Streamline the discovery process with AI-powered analysis of requests and automated response generation.",
      icon: FileSearch,
      color: "text-brand-burgundy"
    },
    {
      title: "Client Case Management",
      description: "Efficiently organize client information, case details, and maintain comprehensive case history.",
      icon: Database,
      color: "text-brand-burgundy"
    },
    {
      title: "AI-Powered Legal Analysis",
      description: "Leverage advanced AI to analyze cases, predict outcomes, and identify relevant legal precedents.",
      icon: Gavel,
      color: "text-brand-burgundy"
    },
    {
      title: "Case Discussion Assistant",
      description: "Collaborate effectively with AI-assisted discussion tools for complex legal matters.",
      icon: MessageSquare,
      color: "text-brand-burgundy"
    },
    {
      title: "Secure Document Management",
      description: "Store and manage legal documents with enterprise-grade security and easy accessibility.",
      icon: Shield,
      color: "text-brand-burgundy"
    },
    {
      title: "Time-Saving Workflows",
      description: "Reduce manual work and increase billable hours with automated legal workflows.",
      icon: Clock,
      color: "text-brand-burgundy"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="mb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Features</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Judicial Junction provides powerful tools to streamline your legal practice
              and enhance productivity with AI-powered assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((feature, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-burgundy flex items-center justify-center text-white text-2xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Analyze Requests</h3>
                <p className="text-gray-600">Our AI analyzes discovery requests and extracts key information automatically.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-burgundy flex items-center justify-center text-white text-2xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">Generate Responses</h3>
                <p className="text-gray-600">Select from AI-suggested templates or create custom responses with automated assistance.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-burgundy flex items-center justify-center text-white text-2xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Review & Export</h3>
                <p className="text-gray-600">Review the final document and export to Microsoft Word format for further editing.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to transform your legal practice?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of legal professionals who are saving time and improving outcomes with Judicial Junction.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="/auth" 
                className="px-8 py-3 bg-brand-burgundy text-white font-medium rounded-md hover:bg-brand-burgundy/90 transition-colors"
              >
                Get Started Today
              </a>
              <a 
                href="#" 
                className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
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
