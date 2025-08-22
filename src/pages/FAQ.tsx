
import React from "react";
import NavBar from "@/components/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground text-lg">
            Get help with Judicial Junction's features and functionality
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Getting Started
                <Badge variant="secondary">Basics</Badge>
              </CardTitle>
              <CardDescription>
                Learn the fundamentals of using Judicial Junction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="what-is-judicial-junction">
                  <AccordionTrigger>What is Judicial Junction?</AccordionTrigger>
                  <AccordionContent>
                    Judicial Junction is a comprehensive legal practice management platform designed to streamline client intake, case analysis, document management, and legal research for law firms and attorneys.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="how-to-get-started">
                  <AccordionTrigger>How do I get started?</AccordionTrigger>
                  <AccordionContent>
                    Start by creating an account and logging in. Then you can begin by adding your first client through the Clients page, where you'll be guided through the client intake process.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Client Management
                <Badge variant="outline">Clients</Badge>
              </CardTitle>
              <CardDescription>
                Managing clients and their information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="add-client">
                  <AccordionTrigger>How do I add a new client?</AccordionTrigger>
                  <AccordionContent>
                    Navigate to the Clients page and click the "Add New Client" button. Fill out the comprehensive intake form with personal information, address details, and case information. The AI will help gather additional details through an interactive interview.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="client-intake">
                  <AccordionTrigger>What is the Client Intake feature?</AccordionTrigger>
                  <AccordionContent>
                    The Client Intake tab uses AI to conduct comprehensive interviews with clients, gathering detailed information about their legal situation, background, and case specifics through natural conversation.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="case-discussion">
                  <AccordionTrigger>What is the Case Discussion tab?</AccordionTrigger>
                  <AccordionContent>
                    The Case Discussion tab provides an AI-powered chat interface for analyzing case details, exploring legal strategies, and getting insights specific to your client's situation. This feature helps brainstorm approaches and understand case complexities.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="create-document">
                  <AccordionTrigger>How do I create documents for clients?</AccordionTrigger>
                  <AccordionContent>
                    The Create Document tab allows you to generate legal documents using AI assistance. Choose from templates or create custom documents tailored to your client's specific needs and case requirements.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="upload-documents">
                  <AccordionTrigger>How do I upload client documents?</AccordionTrigger>
                  <AccordionContent>
                    The Upload Documents tab lets you upload and organize client-specific files. Supported formats include PDF and Word documents, which are automatically processed and made searchable for case analysis.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="case-management">
                  <AccordionTrigger>How do I manage multiple cases for one client?</AccordionTrigger>
                  <AccordionContent>
                    Each client can have multiple cases. You can create new cases from the client detail page, and all case-specific documents and analysis will be organized separately while maintaining the client relationship.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tab-explanations">
                  <AccordionTrigger>How do I understand what each client tab does?</AccordionTrigger>
                  <AccordionContent>
                    Each client detail page has a "?" help button that opens a guide explaining all available tabs and their functions. This provides quick reference for all client management features.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Quick Consult
                <Badge variant="outline">AI Chat</Badge>
              </CardTitle>
              <CardDescription>
                Instant AI legal consultation and advice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="quick-consult">
                  <AccordionTrigger>What is Quick Consult?</AccordionTrigger>
                  <AccordionContent>
                    Quick Consult provides instant AI-powered legal advice and consultation. Ask questions about legal matters, get case analysis, and receive guidance without needing to create a formal client record first.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="consult-sessions">
                  <AccordionTrigger>How do consultation sessions work?</AccordionTrigger>
                  <AccordionContent>
                    Each Quick Consult creates a session that saves your conversation history. You can return to previous sessions, continue conversations, and even convert consultations into formal client records when needed.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="convert-to-client">
                  <AccordionTrigger>Can I convert a Quick Consult into a client record?</AccordionTrigger>
                  <AccordionContent>
                    Yes! If a Quick Consult session leads to a potential client, you can easily convert the consultation into a formal client record, preserving all the conversation history and insights gathered during the consultation.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Document Library
                <Badge variant="outline">Templates</Badge>
              </CardTitle>
              <CardDescription>
                Central repository for legal documents and templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="document-library">
                  <AccordionTrigger>What is the Document Library?</AccordionTrigger>
                  <AccordionContent>
                    The Document Library is a central repository of legal document templates, forms, and standardized documents that can be used across your practice. Access it from the main navigation or through the Templates dialog.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="template-categories">
                  <AccordionTrigger>What types of templates are available?</AccordionTrigger>
                  <AccordionContent>
                    The library includes various categories of legal documents including contracts, court filings, correspondence templates, and standard legal forms, all optimized for Texas law and practice.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="custom-templates">
                  <AccordionTrigger>Can I create custom templates?</AccordionTrigger>
                  <AccordionContent>
                    Yes, you can create and save custom document templates that can be reused across cases and clients. This helps standardize your practice and improve efficiency.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Document Management
                <Badge variant="outline">Documents</Badge>
              </CardTitle>
              <CardDescription>
                Working with documents and files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="supported-formats">
                  <AccordionTrigger>What file formats are supported?</AccordionTrigger>
                  <AccordionContent>
                    The system supports PDF and Microsoft Word documents (.docx). All uploaded documents are automatically processed and made searchable for case analysis and AI review.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="file-size-limits">
                  <AccordionTrigger>What are the file size limits?</AccordionTrigger>
                  <AccordionContent>
                    Individual documents can be up to 10MB in size. For larger documents, consider splitting them into smaller sections or contact support for assistance with bulk uploads.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="knowledge-tab">
                  <AccordionTrigger>What is the Knowledge tab?</AccordionTrigger>
                  <AccordionContent>
                    The Knowledge tab (found in client details) provides a Google Docs-style editor for creating and editing legal documents directly within the platform. Documents are automatically saved and can be updated in real-time.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="document-organization">
                  <AccordionTrigger>How are documents organized?</AccordionTrigger>
                  <AccordionContent>
                    Documents are organized by client and case. Each client has their own document repository, and you can further organize documents by case or category to maintain clear file structure.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Legal Analysis
                <Badge variant="outline">Analysis</Badge>
              </CardTitle>
              <CardDescription>
                AI-powered legal research and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="case-analysis">
                  <AccordionTrigger>How does case analysis work?</AccordionTrigger>
                  <AccordionContent>
                    The system analyzes uploaded documents and client information to provide comprehensive legal analysis, including case strengths and weaknesses, relevant law references, and potential outcomes based on Texas law.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="contract-review">
                  <AccordionTrigger>What is Contract Review?</AccordionTrigger>
                  <AccordionContent>
                    The Contracts tab provides AI-powered contract analysis specifically focused on Texas law. You can upload existing contracts for review or create new contracts using guided templates.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="discovery">
                  <AccordionTrigger>How does the Discovery feature work?</AccordionTrigger>
                  <AccordionContent>
                    The Discovery tab helps manage discovery requests and responses. The AI analyzes requests and generates appropriate responses based on case documents and Texas civil procedure rules.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Account & Access
                <Badge variant="secondary">Account</Badge>
              </CardTitle>
              <CardDescription>
                Account management and access information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="early-access">
                  <AccordionTrigger>What is the Early Access Program?</AccordionTrigger>
                  <AccordionContent>
                    Judicial Junction is currently in Early Access. To join, submit your information through our signup form. We're selectively onboarding legal professionals to ensure the best experience during our beta phase.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="account-setup">
                  <AccordionTrigger>How do I set up my account?</AccordionTrigger>
                  <AccordionContent>
                    Once approved for Early Access, you'll receive login credentials. Set up your profile, configure your law firm information, and begin adding clients through the intuitive interface.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="user-roles">
                  <AccordionTrigger>What are the different user roles?</AccordionTrigger>
                  <AccordionContent>
                    The system supports multiple user roles including attorneys, paralegals, administrators, and super administrators. Each role has specific permissions and access levels to ensure proper security and workflow management.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="password-reset">
                  <AccordionTrigger>How do I reset my password?</AccordionTrigger>
                  <AccordionContent>
                    Use the "Forgot Password" link on the login page to reset your password. You'll receive an email with instructions to create a new password securely.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Advanced Features
                <Badge variant="secondary">Pro</Badge>
              </CardTitle>
              <CardDescription>
                Advanced functionality for power users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="knowledge-base">
                  <AccordionTrigger>What is the Knowledge Base?</AccordionTrigger>
                  <AccordionContent>
                    The Knowledge page (available to super admins) contains a comprehensive database of Texas legal documents, statutes, and case law that powers the AI analysis across the platform.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="admin-features">
                  <AccordionTrigger>What admin features are available?</AccordionTrigger>
                  <AccordionContent>
                    Super administrators can access the Admin page to manage users, law firms, system-wide settings, and the Early Access program. This includes user role management, firm organization tools, and signup approval workflows.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="research-panel">
                  <AccordionTrigger>How does the Research Panel work?</AccordionTrigger>
                  <AccordionContent>
                    The Research Panel provides AI-powered legal research with contextual suggestions based on your case content. It can automatically suggest research queries and find similar cases relevant to your current work.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Technical Requirements
                <Badge variant="outline">System</Badge>
              </CardTitle>
              <CardDescription>
                System requirements and compatibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="browser-support">
                  <AccordionTrigger>What browsers are supported?</AccordionTrigger>
                  <AccordionContent>
                    Judicial Junction works best with modern browsers including Chrome (recommended), Firefox, Safari, and Edge. Ensure your browser is updated to the latest version for optimal performance.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="internet-requirements">
                  <AccordionTrigger>What internet speed do I need?</AccordionTrigger>
                  <AccordionContent>
                    A stable broadband connection is recommended for document uploads and AI processing. Minimum 5 Mbps download speed is suggested, with higher speeds recommended for large document processing.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="mobile-access">
                  <AccordionTrigger>Can I use Judicial Junction on mobile devices?</AccordionTrigger>
                  <AccordionContent>
                    Yes, Judicial Junction is responsive and works on tablets and smartphones. However, the full feature set is optimized for desktop use, especially for document creation and complex case management tasks.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Troubleshooting
                <Badge variant="destructive">Help</Badge>
              </CardTitle>
              <CardDescription>
                Common issues and solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="document-processing">
                  <AccordionTrigger>My document won't upload or process</AccordionTrigger>
                  <AccordionContent>
                    Ensure your document is in PDF or Word format and under 10MB. Check your internet connection and try refreshing the page. Clear your browser cache if issues persist. Complex formatting or corrupted files may require manual review.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="slow-analysis">
                  <AccordionTrigger>Why is the AI analysis taking so long?</AccordionTrigger>
                  <AccordionContent>
                    AI analysis time depends on the complexity and volume of documents being processed. Large cases with many documents may take several minutes to analyze thoroughly. The system will show progress indicators during processing.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="access-issues">
                  <AccordionTrigger>I can't access certain features</AccordionTrigger>
                  <AccordionContent>
                    Some features like the Knowledge base and Admin panel are restricted to users with appropriate permissions. Contact your system administrator if you believe you should have access to these features.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="login-problems">
                  <AccordionTrigger>I'm having trouble logging in</AccordionTrigger>
                  <AccordionContent>
                    Ensure you're using the correct email and password. Try the password reset feature if needed. Clear your browser cookies and cache, or try an incognito/private browser window. Contact support if issues persist.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="performance-issues">
                  <AccordionTrigger>The application is running slowly</AccordionTrigger>
                  <AccordionContent>
                    Slow performance can be caused by poor internet connection, browser issues, or system load. Try refreshing the page, clearing browser cache, closing other browser tabs, or switching to a different browser.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FAQ;
