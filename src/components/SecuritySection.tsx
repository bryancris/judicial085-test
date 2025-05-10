
import React from 'react';
import { Shield, Lock, Server, CheckCircle, Database, Key } from 'lucide-react';
import { Button } from "@/components/ui/button";

const SecuritySection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Client Data Stays Private & Secure</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlike other legal platforms that share data across a common AI system, we prioritize 
            the security and confidentiality of your sensitive client information with dedicated secure servers.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-gray-100 p-6 rounded-xl border border-blue-100 shadow-sm mb-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white p-6 rounded-full shadow-md">
              <Shield className="w-16 h-16 text-brand-burgundy" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">Attorney-Client Privilege Protected</h3>
              <p className="text-lg text-gray-700">
                Most legal platforms pool client data across users to train their AI models, creating serious confidentiality risks. 
                <strong className="text-brand-burgundy"> Our approach is fundamentally different</strong> - we maintain complete data isolation on dedicated secure servers, 
                ensuring your client information never leaves your control and is never used to enhance services for other attorneys.
                Your clients' data belongs to you and you alone.
              </p>
              <Button className="mt-4 bg-brand-burgundy hover:bg-brand-burgundy/90 text-white">
                Learn More About Our Security
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto">
              <Database className="w-7 h-7 text-[#0EA5E9]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Dedicated Secure Servers</h3>
            <p className="text-gray-600">
              Each attorney gets a dedicated database on our secure servers, ensuring your client data remains completely separate from others.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto">
              <Lock className="w-7 h-7 text-[#0EA5E9]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Cross-Client AI Learning</h3>
            <p className="text-gray-600">
              Your client information is never used to train AI models that other attorneys can access, protecting client confidentiality.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto">
              <Key className="w-7 h-7 text-[#0EA5E9]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Military-Grade Encryption</h3>
            <p className="text-gray-600">
              Military-grade encryption for data storage and transmission ensures your sensitive client information remains protected at all times.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto">
              <CheckCircle className="w-7 h-7 text-[#0EA5E9]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Texas Ethics Compliant</h3>
            <p className="text-gray-600">
              Our system is designed to exceed Texas Bar ethics requirements for client confidentiality and data protection.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
