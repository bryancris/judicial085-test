import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  metadata: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();
    
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    console.log('🔍 Starting PI document analysis for client:', clientId);

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.0");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey || !openAIApiKey) {
      throw new Error('Missing required environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all document chunks for this client
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('client_id', clientId);

    if (chunksError) {
      throw new Error(`Failed to fetch document chunks: ${chunksError.message}`);
    }

    if (!chunks || chunks.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No document chunks found for this client' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📄 Found ${chunks.length} document chunks to analyze`);

    // Group chunks by document
    const documentGroups = chunks.reduce((groups: Record<string, DocumentChunk[]>, chunk: DocumentChunk) => {
      if (!groups[chunk.document_id]) {
        groups[chunk.document_id] = [];
      }
      groups[chunk.document_id].push(chunk);
      return groups;
    }, {});

    // Process each document
    const analysisResults = {
      medicalAnalyses: 0,
      legalAnalyses: 0,
      timelineEvents: 0
    };

    for (const [documentId, documentChunks] of Object.entries(documentGroups)) {
      try {
        console.log(`🔬 Analyzing document: ${documentId} (${documentChunks.length} chunks)`);

        // Combine chunks into full document text
        const fullText = documentChunks
          .sort((a, b) => a.chunk_index - b.chunk_index)
          .map(chunk => chunk.content)
          .join(' ');

        // Add delay to prevent rate limiting (500ms between documents)
        if (analysisResults.medicalAnalyses + analysisResults.legalAnalyses > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Determine document type and analyze accordingly
        const documentType = await determineDocumentType(fullText, openAIApiKey);
        
        // Add small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (documentType === 'medical') {
          await analyzeMedicalDocument(supabase, clientId, documentId, fullText, openAIApiKey);
          analysisResults.medicalAnalyses++;
        } else if (documentType === 'legal') {
          await analyzeLegalDocument(supabase, clientId, documentId, fullText, openAIApiKey);
          analysisResults.legalAnalyses++;
        }

        // Add delay before timeline extraction
        await new Promise(resolve => setTimeout(resolve, 300));

        // Extract timeline events from any document
        const timelineEvents = await extractTimelineEvents(supabase, clientId, documentId, fullText, openAIApiKey);
        analysisResults.timelineEvents += timelineEvents;

        console.log(`✅ Successfully processed document ${documentId}`);
      } catch (error) {
        console.error(`❌ Error processing document ${documentId}:`, error);
        // Continue processing other documents even if one fails
      }
    }

    console.log('✅ Document analysis complete:', analysisResults);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document analysis completed successfully',
        results: analysisResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-pi-documents:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function parseJSONResponse(content: string): any {
  try {
    // First try to parse directly
    return JSON.parse(content);
  } catch (error) {
    // If direct parsing fails, try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    
    // If no code blocks, try to find JSON-like content
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return JSON.parse(content.substring(jsonStart, jsonEnd + 1));
    }
    
    throw new Error(`Unable to parse JSON from response: ${content.substring(0, 200)}...`);
  }
}

async function determineDocumentType(text: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Analyze this document text and determine if it's primarily a MEDICAL document (medical records, treatment notes, bills) or LEGAL document (incident reports, legal filings, contracts). Respond with only "medical" or "legal":

${text.substring(0, 2000)}`
        }],
        temperature: 0
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      return 'medical'; // Default fallback
    }

    const result = data.choices[0].message.content.toLowerCase().trim();
    return result.includes('medical') ? 'medical' : 'legal';
  } catch (error) {
    console.error('Error determining document type:', error);
    return 'medical'; // Default fallback to continue processing
  }
}

function mapDocumentType(openAIType: string): string {
  if (!openAIType) return 'medical_record';
  
  const type = openAIType.toLowerCase();
  
  // Map descriptive types to allowed constraint values
  if (type.includes('diagnostic') || type.includes('diagnosis') || type.includes('report') || type.includes('tbi')) {
    return 'diagnostic_report';
  }
  if (type.includes('imaging') || type.includes('xray') || type.includes('mri') || type.includes('ct scan')) {
    return 'imaging_result';
  }
  if (type.includes('treatment') || type.includes('therapy') || type.includes('chiropractic') || type.includes('notes')) {
    return 'treatment_note';
  }
  
  // Default fallback
  return 'medical_record';
}

async function analyzeMedicalDocument(supabase: any, clientId: string, documentId: string, text: string, apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Analyze this medical document and extract key information in JSON format:

{
  "document_type": "type of medical document",
  "estimated_costs": number (total medical costs if mentioned),
  "injuries": ["list of injuries mentioned"],
  "treatments": ["list of treatments provided"],
  "providers": ["healthcare providers mentioned"],
  "dates": ["treatment dates in YYYY-MM-DD format"],
  "diagnosis_codes": ["ICD-10 codes if mentioned"],
  "pain_levels": "pain level descriptions",
  "functional_impact": "impact on daily activities"
}

Document text:
${text.substring(0, 3000)}`
        }],
        temperature: 0
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure for medical document:', data);
      return;
    }

    try {
      const extractedData = parseJSONResponse(data.choices[0].message.content);
      const mappedDocumentType = mapDocumentType(extractedData.document_type);

      console.log(`🔄 Mapping document type: "${extractedData.document_type}" → "${mappedDocumentType}"`);

      const { error } = await supabase
        .from('medical_document_analyses')
        .insert({
          client_id: clientId,
          document_id: documentId,
          document_type: mappedDocumentType,
          extracted_data: extractedData,
          authenticity_score: 0.85, // Default high score for processed documents
          timeline_events: extractedData.dates?.map((date: string, index: number) => ({
            date,
            event_type: 'treatment',
            description: extractedData.treatments?.[index] || 'Medical treatment'
          })) || []
        });

      if (error) {
        console.error('❌ Error saving medical analysis:', error);
        console.error('Failed document type:', mappedDocumentType);
        console.error('Original document type:', extractedData.document_type);
      } else {
        console.log('✅ Successfully saved medical analysis for document:', documentId);
      }
    } catch (parseError) {
      console.error('Error parsing medical analysis response:', parseError);
      console.error('Raw OpenAI response:', data.choices[0].message.content);
    }
  } catch (error) {
    console.error('Error in analyzeMedicalDocument:', error);
  }
}

async function analyzeLegalDocument(supabase: any, clientId: string, documentId: string, text: string, apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Analyze this legal document for personal injury case elements in JSON format:

{
  "document_type": "type of legal document",
  "legal_elements": [
    {
      "element_type": "duty|breach|causation|damages",
      "confidence": 0.0-1.0,
      "evidence_strength": 0.0-1.0,
      "description": "explanation"
    }
  ],
  "case_strength": {
    "strengths": ["positive factors"],
    "weaknesses": ["risk factors"]
  },
  "key_issues": ["main legal issues identified"],
  "liability_factors": ["factors affecting liability"]
}

Document text:
${text.substring(0, 3000)}`
        }],
        temperature: 0
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure for legal document:', data);
      return;
    }
    
    try {
      const extractedData = parseJSONResponse(data.choices[0].message.content);

    const { error } = await supabase
      .from('legal_document_analyses')
      .insert({
        client_id: clientId,
        document_id: documentId,
        document_type: extractedData.document_type || 'legal_document',
        legal_elements: extractedData.legal_elements || [],
        case_strength: extractedData.case_strength || {},
        key_issues: extractedData.key_issues || [],
        source_credibility: 0.8, // Default score for processed documents
        information_classification: {
          liability_factors: extractedData.liability_factors || []
        },
        arguments_analysis: extractedData.case_strength || {}
      });

      if (error) {
        console.error('Error saving legal analysis:', error);
      }
    } catch (parseError) {
      console.error('Error parsing legal analysis response:', parseError);
      console.error('Raw OpenAI response:', data.choices[0].message.content);
    }
  } catch (error) {
    console.error('Error in analyzeLegalDocument:', error);
  }
}

async function extractTimelineEvents(supabase: any, clientId: string, documentId: string, text: string, apiKey: string): Promise<number> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Extract chronological events from this document for a personal injury timeline in JSON format:

[
  {
    "event_date": "YYYY-MM-DD",
    "event_type": "injury|treatment|diagnosis|legal|incident",
    "description": "brief description",
    "reliability_score": 0.0-1.0,
    "source_reference": "reference to document section"
  }
]

Only include events with specific dates. Document text:
${text.substring(0, 3000)}`
        }],
        temperature: 0
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure for timeline events:', data);
      return 0;
    }
    
    try {
      const events = parseJSONResponse(data.choices[0].message.content);

    if (!Array.isArray(events) || events.length === 0) {
      return 0;
    }

    for (const event of events) {
      const { error } = await supabase
        .from('pi_timeline_events')
        .insert({
          client_id: clientId,
          event_date: event.event_date,
          event_type: event.event_type,
          description: event.description,
          reliability_score: event.reliability_score || 0.7,
          source_document: event.source_reference || documentId,
          source_type: 'document_analysis'
        });
        
      if (error) {
        console.error('❌ Error saving timeline event:', error);
        console.error('Event data:', event);
      }
    }

      return events.length;
    } catch (parseError) {
      console.error('Error parsing timeline events response:', parseError);
      console.error('Raw OpenAI response:', data.choices[0].message.content);
      return 0;
    }
  } catch (error) {
    console.error('Error in extractTimelineEvents:', error);
    return 0;
  }
}