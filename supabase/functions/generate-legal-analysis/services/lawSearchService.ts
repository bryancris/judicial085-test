
// Enhanced function to search for relevant legal documents with improved search logic
export async function searchRelevantLaw(searchTerms: string, caseType = "general") {
  console.log(`Searching for legal references with terms: ${searchTerms}, case type: ${caseType}`);
  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return [];
    }

    // Define case-type specific law mappings for better relevance
    const lawMappings = {
      "consumer-protection": [
        "Texas Deceptive Trade Practices", "DTPA", "Business Commerce Code 17",
        "Consumer Protection", "Deceptive Trade Practices", "17.41", "17.46", "17.50"
      ],
      "animal-protection": [
        "Texas Penal Code 42.092", "Animal Cruelty", "Penal Code Chapter 42",
        "Animal Protection", "Cruelty to Animals", "42.09", "42.092"
      ],
      "personal-injury": [
        "Civil Practice Remedies Code", "CPRC", "Negligence", "Tort", "Personal Injury"
      ],
      "contract": [
        "Contract Law", "Breach of Contract", "Business Commerce Code", "Agreement"
      ]
    };

    // Determine relevant search terms based on case content and type
    let relevantTerms = searchTerms.toLowerCase();
    let additionalTerms = [];

    // Add case-type specific terms
    if (caseType === "consumer-protection" || relevantTerms.includes("dtpa") || 
        relevantTerms.includes("deceptive") || relevantTerms.includes("consumer")) {
      additionalTerms = lawMappings["consumer-protection"];
    }
    
    if (relevantTerms.includes("animal") || relevantTerms.includes("pet") || 
        relevantTerms.includes("dog") || relevantTerms.includes("boarding")) {
      additionalTerms = [...additionalTerms, ...lawMappings["animal-protection"]];
    }

    // Create a comprehensive search query
    const allSearchTerms = [searchTerms, ...additionalTerms].join(" ");
    console.log(`Enhanced search terms: ${allSearchTerms}`);

    // First try searching document metadata with improved terms
    try {
      const metadataResponse = await fetch(
        `${supabaseUrl}/rest/v1/document_metadata?select=id,title,url&or=title.ilike.*${encodeURIComponent("Texas Business Commerce Code")}*,title.ilike.*${encodeURIComponent("DTPA")}*,title.ilike.*${encodeURIComponent("Penal Code")}*,title.ilike.*${encodeURIComponent("Animal Cruelty")}*&limit=5`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          }
        }
      );
      
      if (metadataResponse.ok) {
        const metadataResults = await metadataResponse.json();
        if (metadataResults && metadataResults.length > 0) {
          console.log(`Found ${metadataResults.length} relevant statute metadata results`);
          return metadataResults.map(doc => ({
            id: doc.id,
            title: doc.title || "Texas Law Document",
            url: doc.url || null,
            content: null
          }));
        }
      } else {
        console.warn(`Metadata search failed with status: ${metadataResponse.status}`);
      }
    } catch (metadataError) {
      console.error("Error in metadata search:", metadataError);
    }
    
    // Enhanced fallback: Try specific statute searches
    const statuteSearches = [
      "Texas Business Commerce Code",
      "Texas Penal Code", 
      "DTPA",
      "Deceptive Trade Practices",
      "Animal Cruelty"
    ];

    for (const statute of statuteSearches) {
      try {
        const documentsResponse = await fetch(
          `${supabaseUrl}/rest/v1/documents?select=id,content,metadata&content=ilike.*${encodeURIComponent(statute)}*&limit=3`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            }
          }
        );
        
        if (documentsResponse.ok) {
          const documents = await documentsResponse.json();
          if (documents && documents.length > 0) {
            console.log(`Found ${documents.length} documents for statute: ${statute}`);
            
            // Filter out irrelevant documents (like Parks and Wildlife Code)
            const relevantDocs = documents.filter(doc => {
              const content = (doc.content || "").toLowerCase();
              const metadata = doc.metadata || {};
              const title = (metadata?.title || metadata?.file_title || "").toLowerCase();
              
              // Exclude Parks and Wildlife Code and other irrelevant codes
              const irrelevantTerms = ["parks and wildlife", "water code", "agriculture code"];
              const hasIrrelevantContent = irrelevantTerms.some(term => 
                content.includes(term) || title.includes(term)
              );
              
              if (hasIrrelevantContent) {
                console.log(`Filtering out irrelevant document: ${title}`);
                return false;
              }
              
              return true;
            });
            
            if (relevantDocs.length > 0) {
              return relevantDocs.map(doc => {
                const metadata = doc.metadata || {};
                const content = doc.content || "";
                const snippet = content.length > 500 
                  ? content.substring(0, 500) + "..." 
                  : content;
                
                return {
                  id: metadata?.file_id || String(doc.id),
                  title: metadata?.title || metadata?.file_title || `Texas ${statute}`,
                  url: metadata?.file_path || null,
                  content: snippet
                };
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error searching for statute ${statute}:`, error);
      }
    }
    
    // If no relevant laws found, return empty array instead of irrelevant documents
    console.log("No relevant Texas statutes found in database");
    return [];
    
  } catch (error) {
    console.error("Exception in searchRelevantLaw:", error);
    return [];
  }
}
