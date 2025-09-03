import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, documentTitle, documentContent, clientId, caseId } = await req.json();

    // Check if this is a document creation request - improved detection
    const messageLower = userMessage.toLowerCase();
    const draftingKeywords = ['create', 'write', 'draft', 'generate', 'make', 'prepare'];
    const documentTypes = ['document', 'contract', 'letter', 'memo', 'brief', 'discovery', 'motion', 'pleading', 'agreement', 'will', 'trust', 'waiver', 'lease', 'policy', 'form', 'template', 'notice'];
    
    const hasDraftingKeyword = draftingKeywords.some(keyword => messageLower.includes(keyword));
    const hasDocumentType = documentTypes.some(docType => messageLower.includes(docType));
    const isDocumentCreationRequest = hasDraftingKeyword && hasDocumentType;
    
    console.log(`📄 Document Creation Analysis:
    - User message: "${userMessage}"
    - Has drafting keyword: ${hasDraftingKeyword}
    - Has document type: ${hasDocumentType}
    - Is document creation request: ${isDocumentCreationRequest}`);

    // Get comprehensive case data
    let clientInfo = null;
    let caseInfo = null;
    let clientMessages = [];
    let legalAnalyses = [];
    let caseDiscussions = [];
    let documentMetadata = [];
    
    if (clientId) {
      // Fetch all relevant data in parallel
      const [clientResult, messagesResult, analysesResult, discussionsResult, documentsResult] = await Promise.all([
        supabaseAdmin.from('clients').select('*').eq('id', clientId).single(),
        supabaseAdmin.from('client_messages').select('*').eq('client_id', clientId).order('created_at', { ascending: true }),
        supabaseAdmin.from('legal_analyses').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabaseAdmin.from('case_discussions').select('*').eq('client_id', clientId).order('created_at', { ascending: true }),
        supabaseAdmin.from('document_metadata').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
      ]);
      
      clientInfo = clientResult.data;
      clientMessages = messagesResult.data || [];
      legalAnalyses = analysesResult.data || [];
      caseDiscussions = discussionsResult.data || [];
      documentMetadata = documentsResult.data || [];
    }
    
    if (caseId) {
      const { data: case_data } = await supabaseAdmin
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();
      caseInfo = case_data;
    }

    // Build comprehensive context for the AI
    let contextInfo = `
CURRENT DOCUMENT:
- Title: "${documentTitle}"
- Content: ${documentContent ? `"${documentContent}"` : "Empty document"}

`;
    
    if (clientInfo) {
      contextInfo += `CLIENT INFORMATION:
- Name: ${clientInfo.first_name} ${clientInfo.last_name}
- Email: ${clientInfo.email}
- Phone: ${clientInfo.phone}`;
      
      if (clientInfo.address) {
        contextInfo += `\n- Address: ${clientInfo.address}`;
        if (clientInfo.city) contextInfo += `, ${clientInfo.city}`;
        if (clientInfo.state) contextInfo += `, ${clientInfo.state}`;
        if (clientInfo.zip_code) contextInfo += ` ${clientInfo.zip_code}`;
      }
      
      if (clientInfo.case_description) {
        contextInfo += `\n- Case Description: ${clientInfo.case_description}`;
      }
      
      if (clientInfo.case_types && clientInfo.case_types.length > 0) {
        contextInfo += `\n- Case Types: ${clientInfo.case_types.join(', ')}`;
      }
      
      contextInfo += '\n\n';
    }
    
    if (caseInfo) {
      contextInfo += `CASE INFORMATION:
- Title: ${caseInfo.case_title}
- Type: ${caseInfo.case_type || 'Not specified'}
- Status: ${caseInfo.status}`;
      
      if (caseInfo.case_number) {
        contextInfo += `\n- Case Number: ${caseInfo.case_number}`;
      }
      
      if (caseInfo.case_description) {
        contextInfo += `\n- Description: ${caseInfo.case_description}`;
      }
      
      if (caseInfo.case_notes) {
        contextInfo += `\n- Notes: ${caseInfo.case_notes}`;
      }
      
      contextInfo += '\n\n';
    }

    // Add chronological case facts from client messages
    if (clientMessages.length > 0) {
      contextInfo += `CASE FACTS & CONVERSATION HISTORY:\n`;
      clientMessages.forEach((message, index) => {
        const timestamp = message.timestamp || new Date(message.created_at).toLocaleDateString();
        contextInfo += `${index + 1}. [${timestamp}] ${message.role.toUpperCase()}: ${message.content}\n`;
      });
      contextInfo += '\n';
    }

    // Add existing legal analyses
    if (legalAnalyses.length > 0) {
      contextInfo += `EXISTING LEGAL ANALYSES:\n`;
      legalAnalyses.forEach((analysis, index) => {
        const timestamp = analysis.timestamp || new Date(analysis.created_at).toLocaleDateString();
        contextInfo += `Analysis ${index + 1} [${timestamp}]:\n${analysis.content}\n\n`;
      });
    }

    // Add case discussions
    if (caseDiscussions.length > 0) {
      contextInfo += `ATTORNEY-CLIENT DISCUSSIONS:\n`;
      caseDiscussions.forEach((discussion, index) => {
        const timestamp = discussion.timestamp || new Date(discussion.created_at).toLocaleDateString();
        contextInfo += `${index + 1}. [${timestamp}] ${discussion.role.toUpperCase()}: ${discussion.content}\n`;
      });
      contextInfo += '\n';
    }

    // Add available documents
    if (documentMetadata.length > 0) {
      contextInfo += `AVAILABLE DOCUMENTS:\n`;
      documentMetadata.forEach((doc, index) => {
        contextInfo += `${index + 1}. ${doc.title} (${new Date(doc.created_at).toLocaleDateString()})\n`;
      });
      contextInfo += '\n';
    }

    const systemPrompt = `You are an expert legal document assistant with comprehensive knowledge of legal writing, formatting, and document types. You have access to complete case information including client details, conversation history, legal analyses, and case facts.

${contextInfo}

CORE CAPABILITIES:
- Create ANY type of legal document: pleadings, motions, discovery requests/responses, demand letters, contracts, briefs, timelines, witness lists, factual summaries, settlement agreements, etc.
- Edit and improve existing documents with full case context
- Generate chronological timelines from case facts
- Draft discovery requests based on case issues
- Create demand letters with specific damages and facts
- Write motions with relevant legal theories and precedents
- Format documents with proper legal structure and citations

DOCUMENT INTELLIGENCE:
- Automatically detect document type from user request
- Extract relevant facts from case history for specific document needs
- Include appropriate legal standards and citations
- Structure information chronologically for timelines
- Organize issues and evidence for legal briefs
- Personalize with correct client/case information

FORMATTING STANDARDS:
- Use proper legal document structure and headings
- Include case captions when appropriate
- Format dates consistently (MM/DD/YYYY)
- Use formal legal language and tone
- Include proper signature blocks and verification language
- Apply court-specific formatting when jurisdiction is known

CONTENT INTEGRATION:
- Use actual case facts from conversation history
- Reference existing legal analyses and conclusions
- Include specific dates, events, and communications from case timeline
- Incorporate client information (names, addresses, contact details)
- Reference relevant documents and evidence available

When creating substantial document content, use the marker "DOCUMENT_CONTENT:" followed by properly formatted HTML:
- <h1>, <h2>, <h3> for headings and sections
- <p> for paragraphs with proper spacing
- <strong> for legal emphasis and defined terms
- <ul>/<ol> and <li> for organized lists and elements
- <table> for structured data when appropriate
- Clean, professional HTML formatting

CRITICAL: Always use actual case facts, dates, names, and details from the provided context. Never use placeholder text when real information is available.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log(`🤖 OpenAI Response received (length: ${generatedText.length})`);
    console.log(`📝 Response preview: ${generatedText.substring(0, 200)}...`);

    // Parse response for document content
    let chatText = generatedText;
    let generatedDocumentContent = null;

    if (generatedText.includes('DOCUMENT_CONTENT:')) {
      console.log(`✅ Found DOCUMENT_CONTENT marker in response`);
      const parts = generatedText.split('DOCUMENT_CONTENT:');
      if (parts.length >= 2) {
        // Extract the HTML content between DOCUMENT_CONTENT: and the next section
        const htmlContent = parts[1];
        
        // Look for the end of HTML content - find where explanation text starts
        // This usually happens after the closing </div> or similar tags
        let htmlEndIndex = htmlContent.length;
        
        // Look for patterns that indicate the start of explanation text
        const explanationPatterns = [
          /\n\nI have created/i,
          /\n\nThis waiver/i,
          /\n\nThe document/i,
          /\n\nPlease note/i,
          /\n\nImportant/i
        ];
        
        for (const pattern of explanationPatterns) {
          const match = htmlContent.match(pattern);
          if (match) {
            htmlEndIndex = match.index;
            break;
          }
        }
        
        // Extract the HTML content up to the explanation
        generatedDocumentContent = htmlContent.substring(0, htmlEndIndex).trim();
        
        // The chat text is the part before DOCUMENT_CONTENT: plus any explanation after
        const explanationText = htmlContent.substring(htmlEndIndex).trim();
        chatText = parts[0].trim();
        if (explanationText) {
          chatText += '\n\n' + explanationText;
        }
        
        console.log(`📄 Extracted document content (${generatedDocumentContent.length} chars)`);
        console.log(`💬 Chat text after extraction (${chatText.length} chars)`);
        console.log(`🔍 Document content preview: ${generatedDocumentContent.substring(0, 100)}...`);
      }
    } else {
      console.log(`❌ No DOCUMENT_CONTENT marker found in response`);
    }

    return new Response(JSON.stringify({ 
      text: chatText || generatedText,
      documentContent: generatedDocumentContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-document-chat-completion function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});