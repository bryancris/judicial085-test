import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star } from "lucide-react";
import NavBar from '@/components/NavBar';

const Pricing: React.FC = () => {
  const tier1Features = [
    "Client Intake Management",
    "AI-Powered Case Analysis", 
    "Case Discussion & Notes",
    "Quick Consult",
    "Document Hub & Storage",
    "1 Attorney + 1 Paralegal"
  ];

  const tier2Features = [
    "All Professional features",
    "Quick Consult",
    "Discovery Management",
    "Contract Generation & Management", 
    "AI Document Creation",
    "Legal Templates Library",
    "1 Attorney + 1 Paralegal"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      
      <main className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-brand-burgundy to-brand-gold bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose the perfect plan for your legal practice. Both tiers include 1 Attorney and 1 Paralegal access.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Tier 1 - Professional */}
          <Card className="relative border-2 hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Professional
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Perfect for growing practices
              </CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold text-brand-burgundy dark:text-brand-gold">$300</span>
                <span className="text-gray-600 dark:text-gray-300">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                {tier1Features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full bg-brand-burgundy hover:bg-brand-burgundy/90 text-white dark:bg-brand-gold dark:hover:bg-brand-gold/90 dark:text-gray-900"
                size="lg"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Tier 2 - Enterprise */}
          <Card className="relative border-2 border-brand-gold shadow-xl transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-brand-gold text-gray-900 px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                <Star className="h-4 w-4 mr-1" />
                Most Popular
              </div>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Enterprise
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Complete legal practice solution
              </CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold text-brand-burgundy dark:text-brand-gold">$600</span>
                <span className="text-gray-600 dark:text-gray-300">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 mb-8">
                {tier2Features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full bg-brand-gold hover:bg-brand-gold/90 text-gray-900"
                size="lg"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-6 text-gray-900 dark:text-white font-semibold">Features</th>
                  <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-semibold">Professional</th>
                  <th className="text-center py-4 px-6 text-gray-900 dark:text-white font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  { feature: "Client Intake", tier1: true, tier2: true },
                  { feature: "Case Analysis", tier1: true, tier2: true },
                  { feature: "Case Discussion", tier1: true, tier2: true },
                  { feature: "Quick Consult", tier1: true, tier2: true },
                  { feature: "Document Hub", tier1: true, tier2: true },
                  { feature: "Discovery Management", tier1: false, tier2: true },
                  { feature: "Contract Generation", tier1: false, tier2: true },
                  { feature: "AI Document Creation", tier1: false, tier2: true },
                  { feature: "Templates Library", tier1: false, tier2: true },
                ].map((row, index) => (
                  <tr key={index}>
                    <td className="py-4 px-6 text-gray-700 dark:text-gray-300">{row.feature}</td>
                    <td className="py-4 px-6 text-center">
                      {row.tier1 ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {row.tier2 ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Competitor Comparison Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg mt-16">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            How We Compare to Industry Leaders
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-8 max-w-4xl mx-auto">
            See why Texas attorneys are choosing our specialized platform over expensive, one-size-fits-all solutions
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-6 text-gray-900 dark:text-white font-semibold">Comparison</th>
                  <th className="text-center py-4 px-6 text-brand-burgundy dark:text-brand-gold font-semibold">Our Platform</th>
                  <th className="text-center py-4 px-6 text-gray-600 dark:text-gray-400 font-semibold">Westlaw/CoCounsel</th>
                  <th className="text-center py-4 px-6 text-gray-600 dark:text-gray-400 font-semibold">LexisNexis</th>
                  <th className="text-center py-4 px-6 text-gray-600 dark:text-gray-400 font-semibold">Harvey AI</th>
                  <th className="text-center py-4 px-6 text-gray-600 dark:text-gray-400 font-semibold">Bloomberg Law</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Monthly Cost</td>
                  <td className="py-4 px-6 text-center text-brand-burgundy dark:text-brand-gold font-semibold">$300-600</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">$3,000+ (Base + AI)</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">$2,400-12,000+</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">$1,200-3,000+/user</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">$6,000+/attorney</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Texas Law Focus</td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center text-gray-400">—</td>
                  <td className="py-4 px-6 text-center text-gray-400">—</td>
                  <td className="py-4 px-6 text-center text-gray-400">—</td>
                  <td className="py-4 px-6 text-center text-gray-400">—</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Data Privacy & Isolation</td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center text-red-500">Shared/Training</td>
                  <td className="py-4 px-6 text-center text-red-500">Standard</td>
                  <td className="py-4 px-6 text-center text-green-500">Zero Retention</td>
                  <td className="py-4 px-6 text-center text-red-500">Standard</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Target Market</td>
                  <td className="py-4 px-6 text-center text-brand-burgundy dark:text-brand-gold font-medium">Solo/Small Firms</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">Large Firms</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">Large Firms</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">BigLaw/Fortune 500</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">Large Firms</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">AI Features</td>
                  <td className="py-4 px-6 text-center text-brand-burgundy dark:text-brand-gold font-medium">Multi-Agent System</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">General AI</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">Lexis+ AI</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">Advanced GPT-4</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">Limited AI</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Setup Complexity</td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-green-500 font-medium">Simple</span>
                  </td>
                  <td className="py-4 px-6 text-center text-red-500">Complex</td>
                  <td className="py-4 px-6 text-center text-red-500">Complex</td>
                  <td className="py-4 px-6 text-center text-red-500">Enterprise Setup</td>
                  <td className="py-4 px-6 text-center text-red-500">Complex</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Contract Requirements</td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-green-500 font-medium">Month-to-Month</span>
                  </td>
                  <td className="py-4 px-6 text-center text-red-500">Multi-Year</td>
                  <td className="py-4 px-6 text-center text-red-500">Annual</td>
                  <td className="py-4 px-6 text-center text-red-500">Custom Enterprise</td>
                  <td className="py-4 px-6 text-center text-red-500">Annual Flat Rate</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Voice Interface</td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center text-gray-400">—</td>
                  <td className="py-4 px-6 text-center text-gray-400">—</td>
                  <td className="py-4 px-6 text-center text-gray-400">—</td>
                  <td className="py-4 px-6 text-center text-gray-400">—</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">Court Database Integration</td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-green-500 font-medium">Comprehensive Records</span>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">Limited Dockets</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">Limited</td>
                  <td className="py-4 px-6 text-center text-gray-400">—</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">Strong Docket Coverage</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Ready to join Texas attorneys who've made the switch to specialized, affordable legal AI?
            </p>
            <Button 
              size="lg"
              className="bg-brand-burgundy hover:bg-brand-burgundy/90 text-white dark:bg-brand-gold dark:hover:bg-brand-gold/90 dark:text-gray-900"
            >
              Get Started Today
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;