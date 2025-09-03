
import React from 'react';
import { Check, Clock, XCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const StreamlineSection: React.FC = () => {
  const painPoints = [
    {
      title: "Time-Consuming Research",
      description: "Instantly access relevant Texas legal information without wading through volumes of case law."
    },
    {
      title: "Complex Documentation",
      description: "Document template assistance with attorney review required for all outputs."
    },
    {
      title: "Client Information Management",
      description: "Organize client details and case information in one intuitive dashboard."
    },
    {
      title: "Strategic Case Research",
      description: "Research assistance for case preparation using AI analysis of precedents - Attorney judgment and verification required."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-6">Research Assistance That Saves Time</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            While other legal software overcomplicates your workflow, we focus on providing research assistance for the four key areas that consume most of your billable hours. All outputs require attorney review and professional judgment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {painPoints.map((point, index) => (
            <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto">
                  <Clock className="w-6 h-6 text-[#0EA5E9]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">{point.title}</h3>
                <p className="text-gray-600 text-center">{point.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-8 mt-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6">How We're Different</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Focused on Texas Law Only</strong> - No irrelevant information from other jurisdictions
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Clear, Simple Interface</strong> - Learn in minutes, not days
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>AI Research Assistance</strong> - Time-saving research support with required attorney verification
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>No Feature Bloat</strong> - Only what Texas attorneys actually need
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h4 className="text-xl font-bold mb-4 text-red-600 flex items-center">
                  <XCircle className="w-5 h-5 mr-2" /> Typical Legal Software
                </h4>
                <ul className="space-y-3 text-gray-600">
                  <li>• Bloated with rarely-used features</li>
                  <li>• Complex interface requires extensive training</li>
                  <li>• Generic legal information from all jurisdictions</li>
                  <li>• Steep learning curve steals billable hours</li>
                  <li>• Requires dedicated IT support</li>
                </ul>
                
                <h4 className="text-xl font-bold mt-8 mb-4 text-green-600 flex items-center">
                  <Check className="w-5 h-5 mr-2" /> Our Approach
                </h4>
                <ul className="space-y-3 text-gray-600">
                  <li>• Focus only on what Texas attorneys need daily</li>
                  <li>• Intuitive design you can use immediately</li>
                  <li>• Texas-specific legal resources</li>
                  <li>• Adds hours back to your practice</li>
                  <li>• Self-service simplicity</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StreamlineSection;
