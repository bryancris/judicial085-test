
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();

    console.log(`Searching for similar cases to client ID: ${clientId}`);

    // Get the client's name for reference
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('first_name, last_name')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('Error fetching client data:', clientError);
      throw new Error('Could not find client data');
    }

    // Fetch the current client's legal analysis
    const { data: currentAnalysis, error: analysisError } = await supabase
      .from('legal_analyses')
      .select('content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (analysisError || !currentAnalysis) {
      console.error('Error fetching current analysis:', analysisError);
      throw new Error('No legal analysis found for this client');
    }

    // Fetch all other clients' legal analyses
    const { data: otherAnalyses, error: otherAnalysesError } = await supabase
      .from('legal_analyses')
      .select('content, client_id, created_at')
      .neq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (otherAnalysesError) {
      console.error('Error fetching other analyses:', otherAnalysesError);
      throw new Error('Failed to search for similar cases');
    }

    // Group analyses by client and take the most recent one for each
    const latestAnalysesByClient = otherAnalyses.reduce((acc, analysis) => {
      if (!acc[analysis.client_id] || new Date(analysis.created_at) > new Date(acc[analysis.client_id].created_at)) {
        acc[analysis.client_id] = analysis;
      }
      return acc;
    }, {});

    // Extract key information from the current analysis
    const currentRelevantLaw = extractSection(currentAnalysis.content, 'RELEVANT TEXAS LAW');
    const currentPreliminaryAnalysis = extractSection(currentAnalysis.content, 'PRELIMINARY ANALYSIS');
    const currentIssues = extractSection(currentAnalysis.content, 'POTENTIAL LEGAL ISSUES');

    // Combine the sections to create a search document
    const currentSearchDocument = [
      currentRelevantLaw,
      currentPreliminaryAnalysis, 
      currentIssues
    ].join(' ');

    // For each client, calculate similarity score
    const similarityResults = await Promise.all(
      Object.values(latestAnalysesByClient).map(async (analysis: any) => {
        const relevantLaw = extractSection(analysis.content, 'RELEVANT TEXAS LAW');
        const preliminaryAnalysis = extractSection(analysis.content, 'PRELIMINARY ANALYSIS');
        const issues = extractSection(analysis.content, 'POTENTIAL LEGAL ISSUES');

        const searchDocument = [relevantLaw, preliminaryAnalysis, issues].join(' ');
        
        // Calculate similarity score (simple text-based similarity for now)
        const similarityScore = calculateSimilarity(currentSearchDocument, searchDocument);

        // Get the client details
        const { data: otherClient } = await supabase
          .from('clients')
          .select('first_name, last_name')
          .eq('id', analysis.client_id)
          .single();

        // Get potential outcome prediction from the analysis
        const outcomeText = extractOutcomePrediction(analysis.content);
        
        return {
          clientId: analysis.client_id,
          clientName: otherClient ? `${otherClient.first_name} ${otherClient.last_name}` : 'Unknown Client',
          similarity: similarityScore,
          relevantFacts: extractRelevantFacts(analysis.content),
          outcome: outcomeText
        };
      })
    );

    // Sort by similarity score (highest first)
    const sortedResults = similarityResults
      .filter(result => result.similarity > 0.2) // Only include results with at least 20% similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Top 5 most similar

    console.log(`Found ${sortedResults.length} similar cases`);

    return new Response(
      JSON.stringify({ 
        similarCases: sortedResults,
        currentClient: `${clientData.first_name} ${clientData.last_name}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-similar-cases function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to search for similar cases' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to extract a section from the analysis content
function extractSection(content: string, sectionName: string): string {
  const regex = new RegExp(`\\*\\*${sectionName}:\\*\\*([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

// Simple text similarity function based on word overlap
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Extract relevant facts from the analysis content
function extractRelevantFacts(content: string): string {
  const preliminaryAnalysis = extractSection(content, 'PRELIMINARY ANALYSIS');
  // Take the first 200 characters as a summary
  return preliminaryAnalysis.length > 200 
    ? preliminaryAnalysis.substring(0, 200) + '...'
    : preliminaryAnalysis;
}

// Extract outcome prediction from the analysis content
function extractOutcomePrediction(content: string): string {
  // Look for sentences containing outcome predictions
  const sentences = content.split(/\.\s+/);
  
  const outcomeKeywords = [
    'likely outcome', 'probability', 'chances', 'likelihood', 
    'favorable', 'unfavorable', 'success', 'prevail', 'win', 'lose'
  ];
  
  const outcomeSentences = sentences.filter(sentence => 
    outcomeKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
  );
  
  if (outcomeSentences.length > 0) {
    return outcomeSentences[0].trim() + '.';
  }
  
  // Default outcome if no prediction found
  return "No specific outcome prediction available.";
}
