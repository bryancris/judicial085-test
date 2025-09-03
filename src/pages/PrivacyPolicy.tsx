import React from 'react';
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LegalFooter } from "@/components/legal/LegalFooter";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attorney-Client Privilege Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We recognize the critical importance of attorney-client privilege and take extensive measures 
                to protect confidential information uploaded to our platform.
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>All data is encrypted in transit and at rest</li>
                <li>Access to client data is strictly limited to your account</li>
                <li>We do not access, review, or use your client data for any purpose</li>
                <li>Data isolation ensures complete separation between different law firms</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We collect information necessary to provide our legal research platform:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email, law firm details, bar number</li>
                <li><strong>Client Data:</strong> Information you choose to upload for case analysis</li>
                <li><strong>Usage Data:</strong> How you interact with the platform (anonymized)</li>
                <li><strong>Technical Data:</strong> IP address, browser type, access times</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Your information is used solely for:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Providing AI-powered legal research tools</li>
                <li>Maintaining your account and platform access</li>
                <li>Improving platform functionality (using anonymized data only)</li>
                <li>Ensuring security and preventing unauthorized access</li>
                <li>Complying with legal obligations</li>
              </ul>
              <p className="font-semibold text-amber-700 dark:text-amber-300">
                We NEVER use your client data to train AI models or for any other purpose.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We implement enterprise-grade security measures:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>AES-256 encryption for data at rest</li>
                <li>TLS 1.3 encryption for data in transit</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure cloud infrastructure with compliance certifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We retain your data only as long as necessary to provide our services or as required by law. 
                You may request deletion of your data at any time, subject to any legal retention requirements. 
                Upon account termination, all client data is securely deleted within 30 days unless you specify otherwise.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We use limited third-party services that are essential for platform operation:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Cloud hosting providers with BAA agreements</li>
                <li>Payment processors for subscription management</li>
                <li>Security and monitoring services</li>
              </ul>
              <p>All third-party vendors are required to maintain the same level of data protection.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You have the right to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Access and review your personal data</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Export your data in a portable format</li>
                <li>Restrict processing of your data</li>
                <li>File complaints with regulatory authorities</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                For privacy-related questions or to exercise your rights, contact our privacy team at{" "}
                <a href="mailto:privacy@judicialjunction.com" className="text-primary hover:underline">
                  privacy@judicialjunction.com
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

export default PrivacyPolicy;