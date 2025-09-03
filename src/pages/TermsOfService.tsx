import React from 'react';
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LegalFooter } from "@/components/legal/LegalFooter";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground text-lg">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attorney Use Only</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This platform is designed exclusively for licensed attorneys and legal professionals. 
                By using this service, you represent and warrant that you are a licensed attorney in good standing.
              </p>
              <p>
                <strong>This software is NOT a substitute for attorney advice.</strong> All AI-generated content, 
                analysis, and recommendations must be reviewed, verified, and validated by a licensed attorney 
                before use in any legal matter.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>No Attorney-Client Relationship</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Use of this platform does not create an attorney-client relationship between you and Judicial Junction 
                or any of its affiliates. The platform provides research assistance tools only and does not provide 
                legal advice, legal conclusions, or legal representation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Responsibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                You are solely responsible for ensuring that your use of this platform complies with all applicable 
                rules of professional conduct, including but not limited to:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Maintaining client confidentiality</li>
                <li>Providing competent representation</li>
                <li>Supervising all AI-generated work product</li>
                <li>Making independent professional judgments</li>
                <li>Complying with all applicable ethical rules</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Tool Limitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This platform uses artificial intelligence to assist with legal research and document analysis. 
                You acknowledge and understand that:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>AI systems may produce inaccurate or incomplete results</li>
                <li>All AI output requires human attorney review and validation</li>
                <li>The platform provides research assistance, not legal conclusions</li>
                <li>You must exercise independent professional judgment on all matters</li>
                <li>The platform cannot replace attorney expertise and analysis</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Texas Law Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                This platform is specifically designed for Texas law practice. While we strive for accuracy, 
                you are responsible for verifying all legal citations, statutes, and case law references. 
                Laws change frequently, and you must ensure all information is current and applicable.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Judicial Junction provides this platform "as is" without warranties. We are not liable for any 
                damages arising from your use of the platform, including but not limited to professional malpractice 
                claims, client damages, or regulatory sanctions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance with Texas UPL Laws</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This platform is designed in compliance with Texas Government Code Section 81.101 regarding 
                the unauthorized practice of law. The platform:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Provides software tools for attorney use only</li>
                <li>Does not provide legal advice to the general public</li>
                <li>Does not analyze legal situations for non-attorneys</li>
                <li>Clearly states it is not a substitute for attorney advice</li>
                <li>Requires attorney supervision of all work product</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                For questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:legal@judicialjunction.com" className="text-primary hover:underline">
                  legal@judicialjunction.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
};

export default TermsOfService;