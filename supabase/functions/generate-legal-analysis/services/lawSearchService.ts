
// Enhanced function to return proper Texas law references instead of searching documents
export async function searchRelevantLaw(searchTerms: string, caseType = "general") {
  console.log(`Searching for legal references with terms: ${searchTerms}, case type: ${caseType}`);
  
  // Return properly formatted Texas law references based on case type
  // This ensures we get actual statutes instead of document filenames
  return getRelevantLawReferences(caseType, searchTerms);
}

// Return actual Texas law references with proper formatting
function getRelevantLawReferences(caseType: string, searchTerms: string = "") {
  console.log(`Providing relevant law references for case type: ${caseType}`);
  
  const lawReferences = {
    "animal-protection": [
      {
        id: "tex-penal-42-092",
        title: "Texas Penal Code § 42.092 - Cruelty to Animals",
        url: null,
        content: "A person commits an offense if the person intentionally, knowingly, or recklessly tortures an animal or in a cruel manner kills or causes serious bodily injury to an animal. This section provides criminal penalties for animal cruelty."
      },
      {
        id: "tex-penal-42-09",
        title: "Texas Penal Code Chapter 42 - Disorderly Conduct and Related Offenses",
        url: null,
        content: "Chapter 42 addresses various forms of disorderly conduct including animal cruelty offenses. This chapter provides the framework for prosecuting animal-related criminal conduct in Texas."
      },
      {
        id: "tex-penal-42-091",
        title: "Texas Penal Code § 42.091 - Attack on Assistance Animal",
        url: null,
        content: "A person commits an offense if the person intentionally, knowingly, or recklessly attacks, disables, or causes bodily injury to an assistance animal."
      }
    ],
    "consumer-protection": [
      {
        id: "tex-bc-17-41",
        title: "Texas Business & Commerce Code § 17.41 - Legislative Findings",
        url: null,
        content: "The legislature finds that the practices covered by this subchapter are a matter of statewide concern and that this subchapter affects the public interest. The Texas Deceptive Trade Practices Act provides consumer protection."
      },
      {
        id: "tex-bc-17-46",
        title: "Texas Business & Commerce Code § 17.46 - Deceptive Trade Practices Unlawful",
        url: null,
        content: "False, misleading, or deceptive acts or practices in the conduct of any trade or commerce are hereby declared unlawful and are subject to action by the consumer protection division."
      },
      {
        id: "tex-bc-17-50",
        title: "Texas Business & Commerce Code § 17.50 - Consumer Protection",
        url: null,
        content: "A consumer may maintain an action where any of the following constitute a producing cause of economic damages or damages for mental anguish: the use or employment by any person of a false, misleading, or deceptive act or practice."
      },
      {
        id: "tex-bc-17-505",
        title: "Texas Business & Commerce Code § 17.505 - Notice; Inspection",
        url: null,
        content: "As a prerequisite to filing a suit seeking damages under this subchapter, a consumer shall give written notice to the person against whom such suit is contemplated."
      }
    ],
    "personal-injury": [
      {
        id: "tex-cprc-16-003",
        title: "Texas Civil Practice & Remedies Code § 16.003 - Two-Year Limitations Period",
        url: null,
        content: "A person must bring suit for trespass, for taking or detaining the personal property of another, for personal injury, for seduction, or for malicious prosecution not later than two years after the day the cause of action accrues."
      },
      {
        id: "tex-cprc-33-001",
        title: "Texas Civil Practice & Remedies Code Chapter 33 - Proportionate Responsibility",
        url: null,
        content: "This chapter applies to any cause of action based on tort in which a defendant, settling person, or responsible third party is found responsible for a percentage of the harm for which relief is sought."
      }
    ],
    "contract": [
      {
        id: "tex-bc-1-203",
        title: "Texas Business & Commerce Code § 1.203 - Obligation of Good Faith",
        url: null,
        content: "Every contract or duty within this title imposes an obligation of good faith in its performance and enforcement."
      },
      {
        id: "tex-bc-2-313",
        title: "Texas Business & Commerce Code § 2.313 - Express Warranties by Affirmation of Fact or Promise",
        url: null,
        content: "Express warranties by the seller are created as follows: Any affirmation of fact or promise made by the seller to the buyer which relates to the goods and becomes part of the basis of the bargain creates an express warranty."
      }
    ],
    "general": [
      {
        id: "tex-cprc-41-001",
        title: "Texas Civil Practice & Remedies Code Chapter 41 - Damages",
        url: null,
        content: "This chapter provides the framework for awarding damages in civil actions, including exemplary damages and caps on certain types of damages."
      },
      {
        id: "tex-gov-311-005",
        title: "Texas Government Code § 311.005 - General Definitions",
        url: null,
        content: "In the construction of a statute, words and phrases shall be read in context and construed according to the rules of grammar and common usage."
      }
    ]
  };

  // Get the appropriate law references for the case type
  let selectedReferences = lawReferences[caseType] || lawReferences["general"];
  
  // If we have search terms, try to filter for more relevant results
  if (searchTerms && searchTerms.trim()) {
    const terms = searchTerms.toLowerCase();
    
    // Add more specific references based on search terms
    if (terms.includes("animal") || terms.includes("cruelty") || terms.includes("dog") || terms.includes("cat")) {
      selectedReferences = lawReferences["animal-protection"];
    } else if (terms.includes("deceptive") || terms.includes("consumer") || terms.includes("trade") || terms.includes("dtpa")) {
      selectedReferences = lawReferences["consumer-protection"];
    } else if (terms.includes("injury") || terms.includes("negligence") || terms.includes("tort")) {
      selectedReferences = lawReferences["personal-injury"];
    } else if (terms.includes("contract") || terms.includes("breach") || terms.includes("agreement")) {
      selectedReferences = lawReferences["contract"];
    }
  }
  
  console.log(`Returning ${selectedReferences.length} law references for ${caseType}:`, selectedReferences.map(ref => ref.title));
  return selectedReferences;
}
