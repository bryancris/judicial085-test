import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Fetch client and case information if available
    let clientInfo = null;
    let caseInfo = null;
    
    if (clientId) {
      const { data: client } = await supabase
        .from('clients')
        .select('first_name, last_name, email, phone, address, city, state, zip_code')
        .eq('id', clientId)
        .single();
      clientInfo = client;
    }
    
    if (caseId) {
      const { data: caseData } = await supabase
        .from('cases')
        .select('case_title, case_type, case_description, case_notes, status')
        .eq('id', caseId)
        .single();
      caseInfo = caseData;
    }

    // Prepare context for the AI
    const contextInfo = `
Current document context:
- Title: "${documentTitle}"
- Content: ${documentContent ? `"${documentContent}"` : "Empty document"}

${clientInfo ? `
Client Information:
- Name: ${clientInfo.first_name} ${clientInfo.last_name}
- Email: ${clientInfo.email}
- Phone: ${clientInfo.phone}
- Address: ${clientInfo.address ? `${clientInfo.address}, ${clientInfo.city}, ${clientInfo.state} ${clientInfo.zip_code}` : 'Not provided'}
` : ''}

${caseInfo ? `
Case Information:
- Case Title: ${caseInfo.case_title}
- Case Type: ${caseInfo.case_type || 'Not specified'}
- Case Description: ${caseInfo.case_description || 'Not provided'}
- Case Notes: ${caseInfo.case_notes || 'None'}
- Status: ${caseInfo.status}
` : ''}`;

    const systemPrompt = `You are an expert legal document assistant. You help users create, review, and improve legal documents. 

${contextInfo}

Guidelines:
- Provide specific, actionable advice about legal documents
- Suggest improvements for clarity, structure, and legal accuracy
- Help with grammar, formatting, and professional language
- When suggesting edits, be specific about what to change
- For empty documents, help with structure and content generation
- Consider legal best practices and common document standards
- Be concise but thorough in your responses

IMPORTANT: If the user is asking you to CREATE, WRITE, DRAFT, or GENERATE document content (not just advice), you must:
1. Generate the actual document content in proper HTML format
2. Include proper legal document structure and formatting
3. Use appropriate legal language and clauses
4. Start your response with "DOCUMENT_CONTENT:" followed by the complete HTML content
5. Then provide a separate chat response explaining what you created

Example format for document creation:
DOCUMENT_CONTENT:<div><h1>Document Title</h1><p>Document content here...</p></div>

I have created a [document type] for you. The document includes [brief description of what was included].

If the user asks you to review the document, provide specific feedback on structure, content, legal language, and areas for improvement.`;

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
        max_tokens: 1000
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
        
        // Try to find the end of the HTML (look for double newline or end of string)
        const lines = htmlContent.split('\n');
        let htmlLines = [];
        let foundEndMarker = false;
        
        for (const line of lines) {
          if (line.trim() === '' && htmlLines.length > 0) {
            // Empty line might mark end of HTML content
            foundEndMarker = true;
            break;
          }
          htmlLines.push(line);
        }
        
        if (htmlLines.length > 0) {
          generatedDocumentContent = htmlLines.join('\n').trim();
          // Remove the HTML content from chat text
          const remainingText = foundEndMarker ? 
            htmlContent.substring(generatedDocumentContent.length).trim() : 
            '';
          chatText = (parts[0] + '\n\n' + remainingText).trim();
          
          console.log(`📄 Extracted document content (${generatedDocumentContent.length} chars)`);
          console.log(`💬 Chat text after extraction (${chatText.length} chars)`);
        }
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