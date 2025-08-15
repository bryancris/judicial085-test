import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CourtListenerResult {
  resource_uri: string;
  id: string;
  court: string;
  caseName: string;
  snippet: string;
  absolute_url: string;
  date_filed?: string;
  date_decided?: string;
  citation?: {
    volume?: string;
    reporter?: string;
    page?: string;
  };
  cluster?: {
    case_name: string;
    citation_count: number;
    precedential_status: string;
    date_filed?: string;
    date_decided?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const courtListenerToken = Deno.env.get('COURTLISTENER_API_TOKEN')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { searchQueries = [] } = await req.json();
    
    // Default search queries for diverse legal content
    const defaultQueries = [
      'contract breach',
      'employment discrimination',
      'personal injury negligence',
      'intellectual property',
      'constitutional rights',
      'environmental law',
      'criminal procedure',
      'family law custody',
      'real estate property',
      'civil rights violation',
      'antitrust monopoly',
      'securities fraud',
      'medical malpractice',
      'workers compensation',
      'bankruptcy proceedings'
    ];

    const queries = searchQueries.length > 0 ? searchQueries : defaultQueries;
    let totalImported = 0;
    const errors: string[] = [];

    console.log(`🔍 Starting import process with ${queries.length} search queries`);

    for (const query of queries.slice(0, 5)) { // Limit to 5 queries to avoid overwhelming
      try {
        console.log(`Searching for: ${query}`);
        
        const searchUrl = `https://www.courtlistener.com/api/rest/v4/search/?q=${encodeURIComponent(query)}&type=o&order_by=score%20desc&stat_Published=on&page_size=10`;
        
        const response = await fetch(searchUrl, {
          headers: {
            'Authorization': `Token ${courtListenerToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          errors.push(`Search failed for "${query}": ${response.status} ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        const results = data.results || [];
        
        console.log(`Found ${results.length} results for "${query}"`);

        for (const result of results) {
          try {
            // Extract case information
            const caseData = {
              courtlistener_id: result.id.toString(),
              case_name: result.cluster?.case_name || result.caseName || 'Unknown Case',
              court: result.court || 'Unknown Court',
              court_name: result.court_name || '',
              citation: result.citation ? 
                `${result.citation.volume || ''} ${result.citation.reporter || ''} ${result.citation.page || ''}`.trim() :
                '',
              date_filed: result.cluster?.date_filed || result.date_filed || null,
              date_decided: result.cluster?.date_decided || result.date_decided || null,
              snippet: result.snippet || '',
              absolute_url: result.absolute_url || '',
              jurisdiction: result.jurisdiction || '',
              case_type: query.split(' ')[0], // Use first word of search as case type
              precedential_status: result.cluster?.precedential_status || 'Unknown'
            };

            // Check if case already exists
            const { data: existingCase } = await supabase
              .from('courtlistener_cases')
              .select('id')
              .eq('courtlistener_id', caseData.courtlistener_id)
              .single();

            if (!existingCase) {
              const { error: insertError } = await supabase
                .from('courtlistener_cases')
                .insert([caseData]);

              if (insertError) {
                console.error(`Failed to insert case ${caseData.courtlistener_id}:`, insertError);
                errors.push(`Insert failed for case ${caseData.courtlistener_id}: ${insertError.message}`);
              } else {
                totalImported++;
                console.log(`✅ Imported case: ${caseData.case_name}`);
              }
            } else {
              console.log(`⏭️  Case ${caseData.courtlistener_id} already exists, skipping`);
            }

          } catch (caseError) {
            console.error('Error processing case:', caseError);
            errors.push(`Case processing error: ${caseError.message}`);
          }
        }

        // Small delay between queries to be respectful to API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (queryError) {
        console.error(`Error processing query "${query}":`, queryError);
        errors.push(`Query "${query}" failed: ${queryError.message}`);
      }
    }

    console.log(`🎉 Import complete! Imported ${totalImported} new cases`);

    return new Response(
      JSON.stringify({
        success: true,
        imported_count: totalImported,
        errors: errors,
        message: `Successfully imported ${totalImported} cases from CourtListener`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Import function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        imported_count: 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});