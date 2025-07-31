import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatuteRequest {
  statuteRef: string;
  jurisdiction?: string;
}

interface StatuteResponse {
  statute: string;
  text: string;
  title?: string;
  url?: string;
  lastUpdated?: string;
}

// Common Texas statute patterns
const TEXAS_STATUTE_PATTERNS = [
  {
    pattern: /Texas Property Code\s*§?\s*(\d+\.\d+)/gi,
    baseUrl: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.',
    suffix: '.htm'
  },
  {
    pattern: /Property Code\s*§?\s*(\d+\.\d+)/gi,
    baseUrl: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.',
    suffix: '.htm'
  },
  {
    pattern: /Texas Business.*Code\s*§?\s*(\d+\.\d+)/gi,
    baseUrl: 'https://statutes.capitol.texas.gov/Docs/BC/htm/BC.',
    suffix: '.htm'
  },
  {
    pattern: /Texas Civil Practice.*Remedies Code\s*§?\s*(\d+\.\d+)/gi,
    baseUrl: 'https://statutes.capitol.texas.gov/Docs/CP/htm/CP.',
    suffix: '.htm'
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { statuteRef, jurisdiction = 'texas' }: StatuteRequest = await req.json();

    if (!statuteRef) {
      return new Response(
        JSON.stringify({ error: 'Statute reference is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching statute:', statuteRef);

    // Try to match against known Texas statute patterns
    let statuteUrl = '';
    let sectionNumber = '';
    
    for (const pattern of TEXAS_STATUTE_PATTERNS) {
      const match = pattern.pattern.exec(statuteRef);
      if (match) {
        sectionNumber = match[1];
        statuteUrl = `${pattern.baseUrl}${sectionNumber}${pattern.suffix}`;
        break;
      }
    }

    if (!statuteUrl) {
      // Fallback: try a general search approach
      return new Response(JSON.stringify({
        statute: statuteRef,
        text: `Statute text for ${statuteRef} not found in automated retrieval. Manual lookup required.`,
        url: 'https://statutes.capitol.texas.gov/',
        error: 'Specific statute pattern not recognized'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Attempting to fetch from:', statuteUrl);

    // Fetch the statute text from the official Texas statutes website
    const response = await fetch(statuteUrl, {
      headers: {
        'User-Agent': 'Legal Research Tool/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      console.log('Failed to fetch statute, status:', response.status);
      return new Response(JSON.stringify({
        statute: statuteRef,
        text: `Statute ${statuteRef} could not be retrieved automatically. Please refer to official Texas statutes at statutes.capitol.texas.gov`,
        url: statuteUrl,
        error: `HTTP ${response.status}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = await response.text();
    
    // Parse the HTML to extract statute text
    let statuteText = '';
    let title = '';
    
    // Look for the main content - Texas statute pages have specific patterns
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].replace(/\s+/g, ' ').trim();
    }

    // Extract the statute text - look for common patterns in Texas statute HTML
    const textPatterns = [
      /<div[^>]*class="[^"]*statute[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<section[^>]*>(.*?)<\/section>/gis,
      /<article[^>]*>(.*?)<\/article>/gis,
      /<div[^>]*id="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/gis
    ];

    for (const pattern of textPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        statuteText = matches[0]
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (statuteText.length > 100) break;
      }
    }

    // If we couldn't parse well, provide fallback
    if (!statuteText || statuteText.length < 50) {
      statuteText = `Texas Property Code § ${sectionNumber} - Automated text extraction failed. Please refer to the official statute at the provided URL.`;
    }

    return new Response(JSON.stringify({
      statute: statuteRef,
      text: statuteText,
      title: title || `Texas Property Code § ${sectionNumber}`,
      url: statuteUrl,
      lastUpdated: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in statute-retrieval function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});