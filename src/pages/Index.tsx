import React from 'react';
import NavBar from '@/components/NavBar';
import HeroSection from '@/components/HeroSection';
import StreamlineSection from '@/components/StreamlineSection';
import SecuritySection from '@/components/SecuritySection';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "I saved 15+ hours in my first week. The discovery response tool alone was worth the subscription.",
      author: "Linda M., Family Law Attorney",
      stars: 5
    },
    {
      quote: "Finally, legal software that doesn't require a training course to use. Easy to learn, easy to implement.",
      author: "Robert K., Solo Practitioner",
      stars: 5
    },
    {
      quote: "As a Texas attorney for 20 years, I've wasted time on complex legal platforms. This is refreshingly simple and effective.",
      author: "Michael T., Corporate Counsel",
      stars: 5
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">What Texas Attorneys Say</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex mb-4">
                {Array.from({ length: testimonial.stars }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-4">"{testimonial.quote}"</p>
              <p className="text-gray-600 font-medium">{testimonial.author}</p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button className="bg-brand-burgundy hover:bg-brand-burgundy/90 text-white font-medium flex items-center gap-2 hover-scale mx-auto">
            See Why Attorneys Choose Us
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

const ROISection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-[#0c2340] to-[#1a365d] rounded-xl p-8 md:p-12 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Reclaim Your Time & Increase Revenue</h2>
              <p className="text-lg opacity-90 mb-6">
                The average Texas attorney spends 30% of their time on administrative tasks. 
                Our platform can help you reclaim those hours for billable work.
              </p>
              <div className="flex items-center space-x-8 mb-6">
                <div>
                  <p className="text-4xl font-bold text-[#0EA5E9]">15+</p>
                  <p className="text-sm">Hours saved weekly</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#0EA5E9]">30%</p>
                  <p className="text-sm">Increase in billable hours</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#0EA5E9]">100%</p>
                  <p className="text-sm">Texas law focused</p>
                </div>
              </div>
              <Button className="bg-brand-gold hover:bg-brand-gold/90 text-black font-medium">
                Calculate Your ROI
              </Button>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4">Time Wasted on Traditional Legal Software:</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span>4.5 hours/week on discovery response formatting</span>
                </li>
                <li className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span>6 hours/week on case research across jurisdictions</span>
                </li>
                <li className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span>5 hours/week learning complex interfaces</span>
                </li>
                <li className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  <span>All time reclaimed with our simplified approach</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NavBar />
      <main className="flex-grow">
        <HeroSection />
        <SecuritySection />
        <StreamlineSection />
        <TestimonialsSection />
        <ROISection />
      </main>
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 Legal Assistant for Texas Law. All rights reserved.</p>
          <p className="mt-2 text-sm">Designed exclusively for Texas attorneys.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
