
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function identifyCaseType(clientId: string): Promise<string> {
  try {
    console.log(`Identifying case type for client ${clientId}`);
    
    // First check if we already have a case type in legal_analyses
    const { data: analyses, error: analysesError } = await supabase
      .from('legal_analyses')
      .select('case_type')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (analysesError) {
      console.error("Error fetching analyses:", analysesError);
    } else if (analyses && analyses.length > 0 && analyses[0].case_type) {
      console.log(`Found existing case type: ${analyses[0].case_type}`);
      return analyses[0].case_type;
    }
    
    // Check cases table for case_type
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('case_type')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (casesError) {
      console.error("Error fetching cases:", casesError);
    } else if (cases && cases.length > 0 && cases[0].case_type) {
      console.log(`Found case type in cases table: ${cases[0].case_type}`);
      return cases[0].case_type;
    }
    
    // If we still don't have a case type, check client messages
    const { data: messages, error: messagesError } = await supabase
      .from('client_messages')
      .select('content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return "general";
    }
    
    if (!messages || messages.length === 0) {
      console.log("No messages found to determine case type");
      return "general";
    }
    
    // Combine all messages to analyze content
    const combinedContent = messages.map(msg => msg.content).join(' ');
    
    // Define case type patterns
    const caseTypePatterns = [
      { type: "consumer-protection", patterns: [
        /deceptive trade practice/i, /dtpa/i, /consumer protection/i, /false advertising/i,
        /warranty breach/i, /misleading/i, /section 17\.4[0-9]/i
      ]},
      { type: "personal-injury", patterns: [
        /personal injury/i, /injury/i, /negligence/i, /damages/i, /slip and fall/i,
        /accident/i, /wrongful death/i, /medical malpractice/i
      ]},
      { type: "real-estate", patterns: [
        /real estate/i, /property/i, /title/i, /deed/i, /lease/i,
        /landlord/i, /tenant/i, /eviction/i, /foreclosure/i
      ]},
      { type: "contract", patterns: [
        /contract/i, /agreement/i, /breach/i, /terms/i, /consideration/i,
        /void/i, /voidable/i, /enforceable/i, /specific performance/i
      ]},
      { type: "family", patterns: [
        /divorce/i, /custody/i, /child support/i, /alimony/i, /spousal support/i,
        /visitation/i, /conservatorship/i, /adoption/i, /family/i
      ]},
      { type: "criminal", patterns: [
        /criminal/i, /misdemeanor/i, /felony/i, /arrest/i, /charge/i,
        /defendant/i, /guilty/i, /innocent/i, /plea/i, /bail/i
      ]}
    ];
    
    // Check each pattern against the combined content
    for (const { type, patterns } of caseTypePatterns) {
      if (patterns.some(pattern => pattern.test(combinedContent))) {
        console.log(`Detected case type from messages: ${type}`);
        return type;
      }
    }
    
    // Default case type if no patterns match
    console.log("No specific case type detected, using general");
    return "general";
  } catch (error) {
    console.error("Error identifying case type:", error);
    return "general";
  }
}
