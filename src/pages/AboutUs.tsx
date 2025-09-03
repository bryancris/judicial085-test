import React from 'react';
import NavBar from '@/components/NavBar';
import { Card, CardContent } from '@/components/ui/card';
import { LegalFooter } from '@/components/legal/LegalFooter';

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-amber-500 bg-clip-text text-transparent">
              About Judicial Junction
            </h1>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              We're building the future of legal research assistance, designed specifically for Texas attorneys who need more than generic solutions.
            </p>
          </div>

          {/* Our Story */}
          <Card className="mb-8 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800/50 hover:shadow-xl transition-all duration-300 animate-fade-in">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-6">Our Story</h2>
              <p className="text-foreground leading-relaxed mb-4">
                We started Judicial Junction because we saw a fundamental problem in legal technology. While giants like Westlaw and LexisNexis 
                offer comprehensive databases, they treat every state the same. Working closely with Texas practitioners, we learned firsthand how frustrating 
                it was to pay premium prices for generic tools that didn't understand the nuances of Texas law.
              </p>
              <p className="text-foreground leading-relaxed">
                We believed there had to be a better way. What if we could combine cutting-edge AI with deep expertise in Texas law? What if we 
                could make powerful legal research tools accessible to solo practitioners and small firms, not just BigLaw? That's how 
                Judicial Junction was born.
              </p>
            </CardContent>
          </Card>

          {/* Our Mission */}
          <Card className="mb-8 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800/50 hover:shadow-xl transition-all duration-300 animate-fade-in">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-purple-800 dark:text-purple-300 mb-6">Our Mission</h2>
              <p className="text-foreground leading-relaxed mb-4">
                We're on a mission to democratize sophisticated legal AI for Texas practitioners. We believe that every attorney, regardless of 
                firm size, should have access to the same caliber of AI-powered research tools that large firms enjoy. But more than that, we 
                believe those tools should understand Texas law as deeply as you do.
              </p>
              <p className="text-foreground leading-relaxed">
                Our goal isn't to replace legal expertise—it's to support legal research. We want to give you more time to practice law by providing 
                research assistance, while ensuring all outputs require attorney review and verification for Texas-specific legal applications.
              </p>
            </CardContent>
          </Card>

          {/* Why Texas */}
          <Card className="mb-8 bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-950/30 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/50 hover:shadow-xl transition-all duration-300 animate-fade-in">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-amber-800 dark:text-amber-300 mb-6">Why We Focus on Texas ⭐</h2>
              <p className="text-foreground leading-relaxed mb-4">
                Texas isn't just another state—it's a legal ecosystem unto itself. With over 100,000 licensed attorneys and unique laws governing 
                everything from oil and gas to community property, Texas practitioners deal with complexities that generic platforms simply can't 
                handle effectively.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                We've seen too many attorneys struggle with platforms that understand federal law perfectly but stumble on Texas homestead exemptions, 
                security interest perfection under Texas UCC Article 9, or the intricacies of Texas contract law. By focusing exclusively on Texas, 
                we can build something truly specialized rather than broadly adequate.
              </p>
              <p className="text-foreground leading-relaxed">
                Plus, we're deeply connected to the Texas legal community. We understand the market, the culture, and the unique challenges facing practitioners in the Lone Star State.
              </p>
            </CardContent>
          </Card>

          {/* Our Technology */}
          <Card className="mb-8 bg-gradient-to-br from-cyan-50 to-blue-100/50 dark:from-cyan-950/30 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-800/50 hover:shadow-xl transition-all duration-300 animate-fade-in">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-cyan-800 dark:text-cyan-300 mb-6">Our Technology</h2>
              <p className="text-foreground leading-relaxed mb-4">
                We've built something different from the ground up. Instead of using a single AI model like most platforms, we use a multi-agent 
                system where different AI specialists handle different aspects of your research assistance. One agent specializes in case law research, another in 
                statute research, another in contract analysis—all trained specifically on Texas legal materials to support attorney research.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                We aggregate curated public datasets and trusted third‑party sources to keep our materials current and reliable. Our approach 
                emphasizes accuracy and comprehensiveness, with regular updates to ensure you have access to the most relevant legal research information. 
                All AI outputs require attorney review and professional judgment for legal application.
              </p>
              <p className="text-foreground leading-relaxed">
                And because we believe in the power of conversation, we've built voice chat functionality that lets you conduct research the way you think—by 
                talking through problems rather than typing keyword searches. All research results require attorney verification and analysis.
              </p>
            </CardContent>
          </Card>

          {/* Our Values */}
          <Card className="mb-8 bg-gradient-to-br from-emerald-50 to-green-100/50 dark:from-emerald-950/30 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800/50 hover:shadow-xl transition-all duration-300 animate-fade-in">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-emerald-800 dark:text-emerald-300 mb-6">Our Values</h2>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-foreground leading-relaxed">
                    <strong className="text-blue-700 dark:text-blue-300">Accessibility First:</strong> We believe powerful AI shouldn't be locked behind enterprise pricing. That's why we offer 
                    month-to-month pricing with no long-term contracts. You can get started for $300/month and scale up as you grow.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950/50 rounded-lg border-l-4 border-purple-500">
                  <p className="text-foreground leading-relaxed">
                    <strong className="text-purple-700 dark:text-purple-300">Privacy by Design:</strong> Your clients' information is sacred. We've built our platform with privacy as a core principle, 
                    not an afterthought. Your data stays your data.
                  </p>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-lg border-l-4 border-amber-500">
                  <p className="text-foreground leading-relaxed">
                    <strong className="text-amber-700 dark:text-amber-300">Texas Expertise:</strong> We don't try to be everything to everyone. We'd rather be excellent at serving Texas practitioners 
                    than mediocre at serving everyone.
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border-l-4 border-emerald-500">
                  <p className="text-foreground leading-relaxed">
                    <strong className="text-emerald-700 dark:text-emerald-300">Continuous Innovation:</strong> Legal AI is evolving rapidly, and so are we. We're constantly improving our models, adding 
                    new features, and deepening our Texas law expertise.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Commitment */}
          <Card className="mb-8 bg-gradient-to-br from-rose-50 to-pink-100/50 dark:from-rose-950/30 dark:to-pink-900/20 border-rose-200 dark:border-rose-800/50 hover:shadow-xl transition-all duration-300 animate-fade-in">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-rose-800 dark:text-rose-300 mb-6">Our Commitment to You</h2>
              <p className="text-foreground leading-relaxed mb-4">
                We're not just building software—we're building a research assistance platform that understands the unique challenges of practicing law in Texas. 
                Whether you're handling oil and gas transactions, real estate closings, business formations, or litigation, we're committed to 
                providing AI research assistance trained on Texas legal materials, with all outputs requiring attorney review and verification.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                We know that adopting new technology can be daunting, especially when it comes to something as critical as legal research. That's 
                why we offer comprehensive support, training, and a community of Texas practitioners who are as passionate about excellent legal 
                work as you are.
              </p>
              <p className="text-foreground leading-relaxed">
                Most importantly, we're committed to earning your trust every day. We're not a faceless corporation—we're deeply connected to the 
                Texas legal community and work closely with practitioners throughout the state, and we're here for the long haul.
              </p>
            </CardContent>
          </Card>

          {/* Looking Forward */}
          <Card className="mb-8 bg-gradient-to-br from-indigo-50 to-violet-100/50 dark:from-indigo-950/30 dark:to-violet-900/20 border-indigo-200 dark:border-indigo-800/50 hover:shadow-xl transition-all duration-300 animate-fade-in">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-indigo-800 dark:text-indigo-300 mb-6">Looking Forward</h2>
              <p className="text-foreground leading-relaxed mb-4">
                The legal profession is changing, and AI is going to be part of that change whether we embrace it or not. We believe the key is 
                building AI that enhances rather than replaces human judgment—AI that understands not just the law, but the law as it applies 
                in Texas courtrooms, with Texas judges, under Texas procedures.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                We're working on exciting new features like enhanced document analysis assistance, compliance research assistance for Texas-specific requirements, 
                and deeper integrations with the practice management tools you already use. All features provide research assistance requiring attorney 
                supervision and verification. But no matter how sophisticated our technology becomes, our focus remains the same: serving Texas practitioners who refuse to compromise on quality.
              </p>
              <p className="text-foreground leading-relaxed">
                We invite you to join us on this journey. Try Judicial Junction and experience what it's like to have AI research assistance trained on 
                Texas legal materials. Because when you're representing clients in the greatest state in the union, you deserve research tools that are as exceptional 
                as the work you do—with your professional expertise guiding every decision.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
};

export default AboutUs;