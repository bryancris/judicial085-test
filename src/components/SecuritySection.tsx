
import React from 'react';
import { Shield, Lock, Server, CheckCircle, Database, Key, Clock, FileSearch, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";

const SecuritySection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Client Data Stays Private & Secure</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the industry's leading legal platform built with attorney-client privilege at its core. 
            While competitors sacrifice confidentiality for AI training, we guarantee 100% data isolation 
            on our fortress-like secure infrastructure that Texas attorneys trust.
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

        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm mb-12">
          <h3 className="text-2xl font-bold mb-4 text-center">Simple, Focused Tools That Save You Precious Hours</h3>
          <p className="text-lg text-gray-700 text-center mb-8 max-w-4xl mx-auto">
            Unlike bloated legal software that wastes your time, our streamlined platform targets the exact pain points 
            that consume most of your billable hours. Texas attorneys report saving <span className="text-brand-burgundy font-semibold">15+ hours weekly</span> with our focused approach.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto">
                <Users className="w-7 h-7 text-[#0EA5E9]" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-center">Client Intake Simplified</h4>
              <p className="text-gray-600">
                Reduce intake time by 75% with AI-assisted forms that gather essential information while maintaining complete data security. No more repetitive paperwork or lost intake notes.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto">
                <FileSearch className="w-7 h-7 text-[#0EA5E9]" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-center">Discovery Response Automation</h4>
              <p className="text-gray-600">
                Transform 6+ hours of discovery response preparation into 45 minutes with our Texas-specific AI tools that maintain attorney oversight while eliminating tedious formatting work.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto">
                <Clock className="w-7 h-7 text-[#0EA5E9]" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-center">Case Analysis In Minutes</h4>
              <p className="text-gray-600">
                Analyze case strengths and weaknesses in minutes, not hours, with our Texas law-trained AI that provides actionable insights while keeping your client information completely secure.
              </p>
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
