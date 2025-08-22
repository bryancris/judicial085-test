import React from 'react';
import NavBar from '@/components/NavBar';
import { Card, CardContent } from '@/components/ui/card';

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About Judicial Junction
            </h1>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
              We're building the future of legal AI, designed specifically for Texas practitioners who need more than generic solutions.
            </p>
          </div>

          {/* Our Story */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Story</h2>
              <p className="text-foreground leading-relaxed mb-4">
                We started Judicial Junction because we saw a fundamental problem in legal technology. While giants like Westlaw and LexisNexis 
                offer comprehensive databases, they treat every state the same. As Texas practitioners ourselves, we knew firsthand how frustrating 
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
          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
              <p className="text-foreground leading-relaxed mb-4">
                We're on a mission to democratize sophisticated legal AI for Texas practitioners. We believe that every attorney, regardless of 
                firm size, should have access to the same caliber of AI-powered research tools that large firms enjoy. But more than that, we 
                believe those tools should understand Texas law as deeply as you do.
              </p>
              <p className="text-foreground leading-relaxed">
                Our goal isn't to replace legal expertise—it's to amplify it. We want to give you more time to practice law by handling the 
                research heavy lifting, while ensuring everything we suggest is grounded in Texas-specific legal knowledge.
              </p>
            </CardContent>
          </Card>

          {/* Why Texas */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Why We Focus on Texas</h2>
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
                Plus, we're Texans ourselves. We understand the market, the culture, and the unique challenges facing practitioners in the Lone Star State.
              </p>
            </CardContent>
          </Card>

          {/* Our Technology */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Technology</h2>
              <p className="text-foreground leading-relaxed mb-4">
                We've built something different from the ground up. Instead of using a single AI model like most platforms, we use a multi-agent 
                system where different AI specialists handle different aspects of your research. One agent specializes in case law, another in 
                statutes, another in contracts—all trained specifically on Texas legal materials.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                We're also the only platform with native Court Listener integration, giving you real-time access to federal court data as cases 
                develop. No more waiting for traditional databases to update—you see new decisions and filings as they happen.
              </p>
              <p className="text-foreground leading-relaxed">
                And because we believe in the power of conversation, we've built voice chat functionality that lets you research the way you think—by 
                talking through problems rather than typing keyword searches.
              </p>
            </CardContent>
          </Card>

          {/* Our Values */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Values</h2>
              <p className="text-foreground leading-relaxed mb-4">
                <strong>Accessibility First:</strong> We believe powerful AI shouldn't be locked behind enterprise pricing. That's why we offer 
                month-to-month pricing with no long-term contracts. You can get started for $300/month and scale up as you grow.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                <strong>Privacy by Design:</strong> Your clients' information is sacred. We've built our platform with privacy as a core principle, 
                not an afterthought. Your data stays your data.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                <strong>Texas Expertise:</strong> We don't try to be everything to everyone. We'd rather be excellent at serving Texas practitioners 
                than mediocre at serving everyone.
              </p>
              <p className="text-foreground leading-relaxed">
                <strong>Continuous Innovation:</strong> Legal AI is evolving rapidly, and so are we. We're constantly improving our models, adding 
                new features, and deepening our Texas law expertise.
              </p>
            </CardContent>
          </Card>

          {/* Our Commitment */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Commitment to You</h2>
              <p className="text-foreground leading-relaxed mb-4">
                We're not just building software—we're building a platform that understands the unique challenges of practicing law in Texas. 
                Whether you're handling oil and gas transactions, real estate closings, business formations, or litigation, we're committed to 
                providing AI that thinks like a Texas lawyer.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                We know that adopting new technology can be daunting, especially when it comes to something as critical as legal research. That's 
                why we offer comprehensive support, training, and a community of Texas practitioners who are as passionate about excellent legal 
                work as you are.
              </p>
              <p className="text-foreground leading-relaxed">
                Most importantly, we're committed to earning your trust every day. We're not a faceless corporation—we're fellow members of the 
                Texas legal community, and we're here for the long haul.
              </p>
            </CardContent>
          </Card>

          {/* Looking Forward */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Looking Forward</h2>
              <p className="text-foreground leading-relaxed mb-4">
                The legal profession is changing, and AI is going to be part of that change whether we embrace it or not. We believe the key is 
                building AI that enhances rather than replaces human judgment—AI that understands not just the law, but the law as it applies 
                in Texas courtrooms, with Texas judges, under Texas procedures.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                We're working on exciting new features like enhanced document analysis, automated compliance checking for Texas-specific requirements, 
                and deeper integrations with the practice management tools you already use. But no matter how sophisticated our technology becomes, 
                our focus remains the same: serving Texas practitioners who refuse to compromise on quality.
              </p>
              <p className="text-foreground leading-relaxed">
                We invite you to join us on this journey. Try Judicial Junction and experience what it's like to have AI that truly understands 
                Texas law. Because when you're representing clients in the greatest state in the union, you deserve tools that are as exceptional 
                as the work you do.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AboutUs;