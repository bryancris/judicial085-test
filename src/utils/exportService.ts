
import { supabase } from "@/integrations/supabase/client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface ExportOptions {
  clientId: string;
  caseId?: string;
  format: 'pdf' | 'word';
  sections?: string[];
}

export const exportCaseAnalysis = async (options: ExportOptions): Promise<void> => {
  try {
    console.log('Starting export with options:', options);

    if (options.format === 'pdf') {
      // Use client-side PDF generation
      await generateClientSidePDF(options);
    } else {
      // Use server-side Word generation
      await generateServerSideDocument(options);
    }

  } catch (error: any) {
    console.error('Export error:', error);
    throw new Error(error.message || 'Failed to export case analysis');
  }
};

const generateClientSidePDF = async (options: ExportOptions): Promise<void> => {
  try {
    console.log('Generating PDF using client-side approach...');

    // Get case data from the server
    const caseData = await fetchCaseData(options);
    
    // Create HTML content
    const htmlContent = generateHTMLContent(caseData);
    
    // Create a temporary div to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '40px';
    tempDiv.style.fontFamily = 'Georgia, "Times New Roman", serif';
    tempDiv.style.lineHeight = '1.6';
    tempDiv.style.color = '#2c3e50';
    
    document.body.appendChild(tempDiv);

    // Generate canvas from HTML
    const canvas = await html2canvas(tempDiv, {
      width: 800,
      height: tempDiv.scrollHeight,
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    // Remove temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename and download
    const filename = generateFilename(options);
    pdf.save(filename);

    console.log('Client-side PDF generated successfully');

  } catch (error: any) {
    console.error('Client-side PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

const generateServerSideDocument = async (options: ExportOptions): Promise<void> => {
  // Get the current session for authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required for export');
  }

  // Use direct fetch for server-side Word generation
  const response = await fetch(`https://ghpljdgecjmhkwkfctgy.supabase.co/functions/v1/export-case-analysis`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocGxqZGdlY2ptaGt3a2ZjdGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDEyNjIsImV4cCI6MjA2MTc3NzI2Mn0._GXOu4i6i7iITULVAWiyZnY5G7AWcuuM2A9_t5C4bUI'
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Server-side export error:', errorText);
    throw new Error(`Export failed: ${response.status} - ${errorText}`);
  }

  // Handle the response as a blob for binary data
  const blob = await response.blob();
  
  if (blob.size === 0) {
    throw new Error('Received empty file from export service');
  }

  console.log('Server-side export successful, file size:', blob.size);
  downloadFile(blob, generateFilename(options));
};

const fetchCaseData = async (options: ExportOptions) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  // Fetch client data
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', options.clientId)
    .single();

  // Fetch case data if provided
  let caseData = null;
  if (options.caseId) {
    const { data: caseResult } = await supabase
      .from('cases')
      .select('*')
      .eq('id', options.caseId)
      .single();
    caseData = caseResult;
  }

  // Fetch legal analysis
  let analysisQuery = supabase
    .from('legal_analyses')
    .select('*')
    .eq('client_id', options.clientId);

  if (options.caseId) {
    analysisQuery = analysisQuery.eq('case_id', options.caseId);
  } else {
    analysisQuery = analysisQuery.is('case_id', null);
  }

  const { data: analysis } = await analysisQuery
    .order('created_at', { ascending: false })
    .limit(1);

  return {
    client,
    case: caseData,
    analysis: analysis && analysis.length > 0 ? analysis[0] : null
  };
};

const generateHTMLContent = (data: any): string => {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #2c3e50; max-width: 800px; margin: 0 auto; padding: 40px; background: white;">
      <div style="text-align: center; border-bottom: 3px solid #3498db; padding-bottom: 20px; margin-bottom: 40px;">
        <h1 style="color: #2c3e50; font-size: 28px; margin: 0; font-weight: bold;">Case Analysis Report</h1>
        <div style="color: #7f8c8d; font-size: 14px; margin-top: 10px;">Confidential Attorney Work Product</div>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin: 20px 0; border-radius: 0 5px 5px 0;">
        <h2 style="color: #2c3e50; font-size: 20px; margin-top: 0; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #ecf0f1;">Client Information</h2>
        <div style="margin: 8px 0; display: flex;">
          <span style="font-weight: bold; color: #2c3e50; min-width: 120px; margin-right: 10px;">Name:</span>
          <span style="color: #34495e; flex: 1;">${data.client?.first_name || ''} ${data.client?.last_name || ''}</span>
        </div>
        <div style="margin: 8px 0; display: flex;">
          <span style="font-weight: bold; color: #2c3e50; min-width: 120px; margin-right: 10px;">Email:</span>
          <span style="color: #34495e; flex: 1;">${data.client?.email || 'N/A'}</span>
        </div>
        <div style="margin: 8px 0; display: flex;">
          <span style="font-weight: bold; color: #2c3e50; min-width: 120px; margin-right: 10px;">Phone:</span>
          <span style="color: #34495e; flex: 1;">${data.client?.phone || 'N/A'}</span>
        </div>
      </div>
      
      ${data.case ? `
        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin: 20px 0; border-radius: 0 5px 5px 0;">
          <h2 style="color: #2c3e50; font-size: 20px; margin-top: 0; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #ecf0f1;">Case Information</h2>
          <div style="margin: 8px 0; display: flex;">
            <span style="font-weight: bold; color: #2c3e50; min-width: 120px; margin-right: 10px;">Case Title:</span>
            <span style="color: #34495e; flex: 1;">${data.case.case_title}</span>
          </div>
          <div style="margin: 8px 0; display: flex;">
            <span style="font-weight: bold; color: #2c3e50; min-width: 120px; margin-right: 10px;">Case Type:</span>
            <span style="color: #34495e; flex: 1;">${data.case.case_type || 'N/A'}</span>
          </div>
          <div style="margin: 8px 0; display: flex;">
            <span style="font-weight: bold; color: #2c3e50; min-width: 120px; margin-right: 10px;">Status:</span>
            <span style="color: #34495e; flex: 1;">${data.case.status}</span>
          </div>
        </div>
      ` : ''}
      
      ${data.analysis ? `
        <h2 style="color: #2c3e50; font-size: 20px; margin-top: 35px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #ecf0f1;">Legal Analysis</h2>
        <div style="margin: 8px 0; display: flex;">
          <span style="font-weight: bold; color: #2c3e50; min-width: 120px; margin-right: 10px;">Case Type:</span>
          <span style="color: #34495e; flex: 1;">${data.analysis.case_type || 'N/A'}</span>
        </div>
        <h3 style="color: #34495e; font-size: 16px; margin-top: 25px; margin-bottom: 10px;">Analysis Content:</h3>
        <div style="background: #fff; padding: 25px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; font-size: 14px; line-height: 1.8;">${data.analysis.content || 'No analysis content available.'}</div>
      ` : ''}
      
      <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #ecf0f1; text-align: center; font-size: 12px; color: #95a5a6;">
        <p>Generated on ${new Date().toLocaleDateString()} | Confidential Attorney Work Product</p>
      </div>
    </div>
  `;
};

const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

const generateFilename = (options: ExportOptions): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = options.format === 'pdf' ? 'pdf' : 'docx';
  return `CaseAnalysis_${timestamp}.${extension}`;
};
