# Case Analysis Revamp Implementation Plan

## Agent Role Definitions

**GEMINI (Orchestrator)**: Lead coordinator responsible for organizing and synthesizing data from OpenAI and Perplexity agents. Manages the workflow sequence, ensures quality control, and produces the final structured output.

**OPENAI (Legal Logic Brain)**: Specialized in legal reasoning, IRAC analysis, case law interpretation, and complex legal logic. Handles all analytical heavy lifting.

**PERPLEXITY (Research Agent)**: Finds up-to-date legal data, case law, statutes, and precedents with proper citations. Provides current legal authority and references.

## 9-Step Sequential Workflow

GEMINI must execute this workflow in exact order. Do not skip steps or work out of sequence.

### Step 1: CASE SUMMARY (Organized Fact Pattern)
**GEMINI Tasks:**
- Process and organize the raw fact pattern into clear, structured format
- Extract key factual elements from vectorized documents
- Create chronological timeline if relevant
- Identify parties, relationships, and critical events
- Present facts objectively without legal conclusions

**Output Format:**
```
CASE SUMMARY
- Parties: [List all relevant parties]
- Timeline: [Key dates and events]
- Core Facts: [Organized factual narrative]
- Key Documents: [Reference to important evidence]
```

### Step 2: PRELIMINARY ANALYSIS (AI-assisted broad issue spotting)
**GEMINI Tasks:**
- Coordinate with OPENAI to conduct initial legal issue identification
- Use vectorized documents to spot potential legal problems
- Create preliminary strategic roadmap
- Identify areas requiring focused research

**OPENAI Tasks:**
- Analyze fact pattern for potential legal issues
- Apply legal pattern recognition to identify possible claims/defenses
- Suggest areas of law that may apply
- Prioritize issues by potential viability and strategic importance

**Output Format:**
```
PRELIMINARY ANALYSIS
- Potential Legal Areas: [Contract, Tort, Criminal, etc.]
- Preliminary Issues Identified: [List 5-8 potential issues]
- Research Priorities: [Which issues need immediate focus]
- Strategic Notes: [Early tactical observations]
```

### Step 3: Relevant Texas Laws (Targeted legal research)
**PERPLEXITY Tasks:**
- Research Texas statutes related to preliminary issues identified
- Find recent legislative changes or updates
- Provide proper statutory citations
- Focus research based on Step 2 priorities

**GEMINI Tasks:**
- Organize statutory research by legal issue area
- Cross-reference with preliminary analysis
- Ensure comprehensive coverage of identified issues

**Output Format:**
```
RELEVANT TEXAS LAWS
- [Legal Area 1]: [Statute citations with current text]
- [Legal Area 2]: [Statute citations with current text]
- Recent Updates: [Any 2024-2025 changes]
- Key Provisions: [Most relevant statutory language]
```

### Step 4: Additional Case Law (Precedent research)
**PERPLEXITY Tasks:**
- Search for recent Texas case law on identified issues
- Find federal cases if applicable
- Prioritize recent decisions (last 5 years preferred)
- Provide complete citations in proper format
- Include both favorable and adverse precedents

**GEMINI Tasks:**
- Organize cases by legal issue
- Create case law hierarchy (Texas Supreme Court → Appeals → Federal)
- Cross-reference cases with statutory analysis

**Output Format:**
```
ADDITIONAL CASE LAW
- [Issue 1 Cases]: [Case name, citation, holding, relevance]
- [Issue 2 Cases]: [Case name, citation, holding, relevance]
- Favorable Precedents: [Cases supporting client position]
- Adverse Precedents: [Cases opposing client position]
- Distinguishing Factors: [How adverse cases differ]
```

### Step 5: IRAC Legal Analysis (Comprehensive deep analysis)
**OPENAI Tasks:**
- Conduct systematic IRAC analysis for each viable legal issue
- Apply statutes and case law from Steps 3-4 to the facts
- Use rigorous legal reasoning and logic
- Address counterarguments and alternative interpretations
- Provide detailed legal conclusions

**GEMINI Tasks:**
- Ensure IRAC format is followed for each issue
- Integrate statutory and case law research seamlessly
- Maintain logical flow and legal precision

**IRAC Format for Each Issue:**
```
ISSUE: [Specific legal question]
RULE: [Applicable law - statutes and cases]
APPLICATION: [How law applies to these specific facts]
CONCLUSION: [Legal outcome for this issue]
```

### Step 6: LEGAL ISSUES ASSESSMENT (Issues validated through analysis)
**GEMINI Tasks:**
- Coordinate with OPENAI to evaluate which issues survived IRAC analysis
- Rank issues by strength and strategic importance
- Eliminate weak or unviable claims
- Provide confidence ratings

**OPENAI Tasks:**
- Assess viability of each issue after comprehensive analysis
- Consider procedural requirements, statute of limitations, standing
- Evaluate strength of legal and factual support

**Output Format:**
```
LEGAL ISSUES ASSESSMENT
- Strong Issues: [Issues with high probability of success]
- Moderate Issues: [Issues with reasonable prospects]
- Weak Issues: [Issues unlikely to succeed]
- Eliminated Issues: [Issues with insufficient support]
- Strategic Priorities: [Which issues to pursue first]
```

### Step 7: Case Strengths & Weaknesses
**OPENAI Tasks:**
- Analyze overall case strength based on completed legal analysis
- Identify factual and legal strengths
- Acknowledge weaknesses and potential vulnerabilities
- Reference specific legal authority for each assessment

**GEMINI Tasks:**
- Organize strengths and weaknesses clearly
- Ensure all assessments are supported by prior analysis
- Maintain objectivity and accuracy

**Output Format:**
```
CASE STRENGTHS & WEAKNESSES

STRENGTHS:
- [Strength 1]: [Supporting authority and reasoning]
- [Strength 2]: [Supporting authority and reasoning]

WEAKNESSES:
- [Weakness 1]: [Legal/factual basis and potential impact]
- [Weakness 2]: [Legal/factual basis and potential impact]

MITIGATION STRATEGIES:
- [How to address each weakness]
```

### Step 8: REFINED ANALYSIS (Comprehensive synthesis + Risk Assessment)
**GEMINI Tasks:**
- Synthesize all previous analysis into comprehensive strategic overview
- Coordinate final risk assessment with OPENAI
- Provide executive summary with clear recommendations
- Include strategic considerations and litigation positioning

**OPENAI Tasks:**
- Conduct final legal risk analysis
- Provide strategic recommendations based on complete analysis
- Consider cost-benefit and practical implications

**Output Format:**
```
REFINED ANALYSIS

EXECUTIVE SUMMARY:
[2-3 paragraph synthesis of entire case analysis]

RISK ASSESSMENT:
- High Risk Factors: [Issues that could derail case]
- Medium Risk Factors: [Issues requiring monitoring]
- Risk Mitigation: [Steps to reduce identified risks]

STRATEGIC RECOMMENDATIONS:
- Primary Strategy: [Recommended approach]
- Alternative Strategies: [Backup options]
- Immediate Priorities: [Next steps to take]

LIKELIHOOD OF SUCCESS:
[Overall assessment with reasoning]
```

### Step 9: Recommended Follow-up Questions
**GEMINI Tasks:**
- Identify information gaps revealed during analysis
- Generate specific questions to strengthen case development
- Prioritize questions by importance and urgency
- Consider discovery and investigation needs

**Output Format:**
```
RECOMMENDED FOLLOW-UP QUESTIONS

CRITICAL INFORMATION NEEDED:
1. [Question about key factual gap]
2. [Question about legal clarification]
3. [Question about evidence/documentation]

ADDITIONAL INVESTIGATION:
- [Areas requiring further factual development]
- [Potential witnesses to interview]
- [Documents to obtain]

EXPERT CONSULTATION:
- [Whether specialized experts needed]
- [Areas requiring additional legal research]
```

## Quality Control Requirements

**GEMINI Responsibilities:**
- Ensure each step builds logically on previous steps
- Maintain consistency across all sections
- Verify all citations are properly formatted
- Cross-reference analysis throughout workflow
- Flag any inconsistencies or gaps for resolution

**Citation Standards:**
- All case law must include full citation
- Statutes must include current section numbers
- Use Texas citation format
- Verify accuracy of all legal references

**Workflow Integrity:**
- Complete each step fully before proceeding
- Do not skip steps or work out of sequence
- Each step should reference and build upon prior steps
- Maintain professional legal writing standards throughout

## Implementation Status
**Phase 1**: ✅ COMPLETED - Plan created and ai-agent-coordinator transformed to sequential workflow
**Phase 2**: 🔄 IN PROGRESS - Testing 9-step implementation
**Phase 3**: ⏳ PENDING - Quality control validation
**Phase 4**: ⏳ PENDING - Frontend integration

## Success Metrics
1. All 9 steps execute in exact sequential order
2. Each step produces properly formatted output
3. Quality control prevents progression with incomplete steps
4. Final analysis demonstrates logical building across all steps
5. Citations meet Texas legal standards
6. Analysis includes current 2024-2025 legal updates
