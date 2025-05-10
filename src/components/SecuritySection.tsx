
import React from 'react';
import { Shield, Lock, Server, CheckCircle } from 'lucide-react';

const SecuritySection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Client Data Stays Private & Secure</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Unlike other legal platforms that share data across a common AI system, we prioritize 
            the security and confidentiality of your sensitive client information.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto">
              <Server className="w-6 h-6 text-[#0EA5E9]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Isolated Databases</h3>
            <p className="text-gray-600">
              Each attorney gets a dedicated Supabase database instance, ensuring your client data remains completely separate from others.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto">
              <Lock className="w-6 h-6 text-[#0EA5E9]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Cross-Client AI Learning</h3>
            <p className="text-gray-600">
              Your client information is never used to train AI models that other attorneys can access, protecting client confidentiality.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto">
              <Shield className="w-6 h-6 text-[#0EA5E9]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Enterprise-Grade Security</h3>
            <p className="text-gray-600">
              Encrypted data storage and transmission with industry-standard protocols ensures your sensitive information remains protected.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto">
              <CheckCircle className="w-6 h-6 text-[#0EA5E9]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Texas Ethics Compliant</h3>
            <p className="text-gray-600">
              Our system is designed to meet Texas Bar ethics requirements for client confidentiality and data protection.
            </p>
          </div>
        </div>
        
        <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <Shield className="w-12 h-12 text-brand-burgundy" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">How Our Security Differs From Other Legal AI Platforms</h3>
              <p className="text-gray-600">
                Most legal AI platforms pool client data across users to train their AI models, creating potential confidentiality risks. 
                We take a different approach by maintaining complete data isolation, ensuring your client information is never used 
                to enhance AI services for other attorneys or organizations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
