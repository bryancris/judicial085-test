
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const CSS_STYLES = `
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    line-height: 1.6;
    color: #2c3e50;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 30px;
    background: white;
  }
  
  .header {
    text-align: center;
    border-bottom: 3px solid #3498db;
    padding-bottom: 20px;
    margin-bottom: 40px;
  }
  
  .header h1 {
    color: #2c3e50;
    font-size: 28px;
    margin: 0;
    font-weight: bold;
  }
  
  .header .subtitle {
    color: #7f8c8d;
    font-size: 14px;
    margin-top: 10px;
  }
  
  h2 {
    color: #2c3e50;
    font-size: 20px;
    margin-top: 35px;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 2px solid #ecf0f1;
  }
  
  h3 {
    color: #34495e;
    font-size: 16px;
    margin-top: 25px;
    margin-bottom: 10px;
  }
  
  .info-section {
    background: #f8f9fa;
    padding: 20px;
    border-left: 4px solid #3498db;
    margin: 20px 0;
    border-radius: 0 5px 5px 0;
  }
  
  .info-row {
    margin: 8px 0;
    display: flex;
  }
  
  .info-label {
    font-weight: bold;
    color: #2c3e50;
    min-width: 120px;
    margin-right: 10px;
  }
  
  .info-value {
    color: #34495e;
    flex: 1;
  }
  
  .analysis-content {
    background: #fff;
    padding: 25px;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin: 20px 0;
    white-space: pre-wrap;
    font-size: 14px;
    line-height: 1.8;
  }
  
  .similar-case, .reference, .note, .document {
    margin: 15px 0;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #3498db;
  }
  
  .similar-case {
    background: #f1f2f6;
    border-left-color: #9b59b6;
  }
  
  .reference {
    background: #e8f4f8;
    border-left-color: #3498db;
  }
  
  .note {
    background: #fff3cd;
    border-left-color: #f39c12;
  }
  
  .document {
    background: #f8f9fa;
    border-left-color: #95a5a6;
  }
  
  .case-title {
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 5px;
  }
  
  .case-details {
    font-size: 14px;
    color: #34495e;
    margin-bottom: 8px;
  }
  
  .case-outcome {
    font-style: italic;
    color: #7f8c8d;
    font-size: 13px;
  }
  
  .reference-title {
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 5px;
  }
  
  .reference-meta {
    color: #7f8c8d;
    font-size: 13px;
    margin-bottom: 8px;
  }
  
  .reference-snippet {
    color: #34495e;
    font-size: 14px;
  }
  
  .note-date {
    font-weight: bold;
    color: #f39c12;
    margin-bottom: 5px;
  }
  
  .note-content {
    color: #34495e;
  }
  
  .doc-name {
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 5px;
  }
  
  .doc-meta {
    color: #7f8c8d;
    font-size: 13px;
  }
  
  .footer {
    margin-top: 60px;
    padding-top: 20px;
    border-top: 1px solid #ecf0f1;
    text-align: center;
    font-size: 12px;
    color: #95a5a6;
  }
  
  .page-break {
    page-break-before: always;
  }
  
  .outcome-prediction {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #ddd;
  }
  
  .prediction-item {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
  }
  
  .prediction-label {
    font-weight: bold;
    color: #2c3e50;
  }
  
  .prediction-value {
    color: #3498db;
    font-weight: bold;
  }
  
  .prediction-bar {
    height: 20px;
    background: #ecf0f1;
    border-radius: 10px;
    overflow: hidden;
    margin-top: 15px;
  }
  
  .prediction-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #27ae60, #f39c12);
    transition: width 0.3s ease;
  }
  
  .strengths-weaknesses {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .strengths, .weaknesses {
    background: #fff;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #ddd;
  }
  
  .strengths h3 {
    color: #27ae60;
    margin-top: 0;
  }
  
  .weaknesses h3 {
    color: #e74c3c;
    margin-top: 0;
  }
  
  .strengths ul, .weaknesses ul {
    list-style: none;
    padding: 0;
  }
  
  .strengths li {
    padding: 5px 0;
    border-left: 3px solid #27ae60;
    padding-left: 10px;
    margin: 5px 0;
  }
  
  .weaknesses li {
    padding: 5px 0;
    border-left: 3px solid #e74c3c;
    padding-left: 10px;
    margin: 5px 0;
  }
  
  .analysis-subsection {
    margin: 20px 0;
    padding: 15px;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #ddd;
  }
  
  .analysis-summary {
    background: #e8f4f8;
    padding: 15px;
    border-radius: 8px;
    font-style: italic;
    color: #2c3e50;
  }
  
  .follow-up-questions {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #ddd;
  }
  
  .follow-up-questions li {
    margin: 10px 0;
    padding: 5px 0;
  }
  
  @media print {
    body { margin: 0; padding: 20px; }
    .page-break { page-break-before: always; }
  }
`
