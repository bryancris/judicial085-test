
// Enhanced function to search for relevant legal documents with improved search logic
export async function searchRelevantLaw(searchTerms: string, caseType = "general") {
  console.log(`Searching for legal references with terms: ${searchTerms}, case type: ${caseType}`);
  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return getDefaultLawReferences(caseType);
    }

    // Define case-type specific law mappings for better relevance
    const lawMappings = {
      "consumer-protection": [
        "Texas Business Commerce Code", "DTPA", "Deceptive Trade Practices", 
        "17.41", "17.46", "17.50", "Consumer Protection"
      ],
      "animal-protection": [
        "Texas Penal Code", "Animal Cruelty", "42.092", "42.09", 
        "Penal Code Chapter 42", "Cruelty to Animals"
      ],
      "personal-injury": [
        "Civil Practice Remedies Code", "CPRC", "Negligence", "Tort", "Personal Injury"
      ],
      "contract": [
        "Contract Law", "Breach of Contract", "Business Commerce Code", "Agreement"
      ]
    };

    // Get case-specific search terms
    let enhancedSearchTerms = [];
    let additionalTerms = lawMappings[caseType] || [];
    
    // For animal protection cases, prioritize Penal Code
    if (caseType === "animal-protection") {
      enhancedSearchTerms = [
        "Texas Penal Code",
        "Animal Cruelty", 
        "42.092",
        "Cruelty to Animals",
        "Penal Code Chapter 42"
      ];
    } else if (caseType === "consumer-protection") {
      enhancedSearchTerms = [
        "Texas Business Commerce Code",
        "DTPA",
        "Deceptive Trade Practices",
        "17.41",
        "17.46"
      ];
    } else {
      enhancedSearchTerms = additionalTerms;
    }

    console.log(`Enhanced search terms for ${caseType}: ${enhancedSearchTerms.join(", ")}`);

    // Try specific searches for case type
    for (const searchTerm of enhancedSearchTerms) {
      try {
        console.log(`Searching for: ${searchTerm}`);
        
        const documentsResponse = await fetch(
          `${supabaseUrl}/rest/v1/documents?select=id,content,metadata&content=ilike.*${encodeURIComponent(searchTerm)}*&limit=3`,
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
            console.log(`Found ${documents.length} documents for search term: ${searchTerm}`);
            
            // Filter for relevant documents
            const relevantDocs = documents.filter(doc => {
              const content = (doc.content || "").toLowerCase();
              const metadata = doc.metadata || {};
              const title = (metadata?.title || metadata?.file_title || "").toLowerCase();
              
              // For animal protection, prioritize Penal Code documents
              if (caseType === "animal-protection") {
                return title.includes("penal") || content.includes("penal code") || 
                       content.includes("42.092") || content.includes("animal cruelty");
              }
              
              // For consumer protection, prioritize Business & Commerce Code
              if (caseType === "consumer-protection") {
                return title.includes("business") || title.includes("commerce") ||
                       content.includes("dtpa") || content.includes("17.4");
              }
              
              return true;
            });
            
            if (relevantDocs.length > 0) {
              console.log(`Returning ${relevantDocs.length} relevant documents for ${caseType}`);
              return relevantDocs.map(doc => {
                const metadata = doc.metadata || {};
                const content = doc.content || "";
                const snippet = content.length > 500 
                  ? content.substring(0, 500) + "..." 
                  : content;
                
                return {
                  id: metadata?.file_id || String(doc.id),
                  title: metadata?.title || metadata?.file_title || `Texas ${searchTerm}`,
                  url: metadata?.file_path || null,
                  content: snippet
                };
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error searching for ${searchTerm}:`, error);
      }
    }
    
    // If no relevant documents found, return default references
    console.log(`No relevant documents found in database for ${caseType}, using default references`);
    return getDefaultLawReferences(caseType);
    
  } catch (error) {
    console.error("Exception in searchRelevantLaw:", error);
    return getDefaultLawReferences(caseType);
  }
}

// Default law references when database search fails
function getDefaultLawReferences(caseType: string) {
  console.log(`Providing default law references for case type: ${caseType}`);
  
  const defaultReferences = {
    "animal-protection": [
      {
        id: "penal-42-092",
        title: "Texas Penal Code § 42.092 - Cruelty to Animals",
        url: null,
        content: "A person commits an offense if the person intentionally, knowingly, or recklessly tortures an animal or in a cruel manner kills or causes serious bodily injury to an animal."
      },
      {
        id: "penal-42-09",
        title: "Texas Penal Code Chapter 42 - Disorderly Conduct and Related Offenses",
        url: null,
        content: "This chapter addresses various forms of disorderly conduct including animal cruelty offenses and related criminal conduct."
      }
    ],
    "consumer-protection": [
      {
        id: "dtpa-17-41",
        title: "Texas Business & Commerce Code § 17.41 - Deceptive Trade Practices",
        url: null,
        content: "The legislature finds that the practices covered by this subchapter are a matter of statewide concern and that this subchapter affects the public interest."
      },
      {
        id: "dtpa-17-46",
        title: "Texas Business & Commerce Code § 17.46 - Deceptive Trade Practices Unlawful",
        url: null,
        content: "False, misleading, or deceptive acts or practices in the conduct of any trade or commerce are hereby declared unlawful."
      }
    ],
    "general": [
      {
        id: "general-contract",
        title: "Texas Contract Law Principles",
        url: null,
        content: "Texas follows general contract law principles including offer, acceptance, consideration, and performance requirements."
      }
    ]
  };

  return defaultReferences[caseType] || defaultReferences["general"];
}
