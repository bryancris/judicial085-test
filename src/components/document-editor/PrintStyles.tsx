
import React from 'react';

const PrintStyles: React.FC = () => {
  return (
    <style>
      {`
        @media print {
          @page {
            margin: 1in;
            size: letter;
          }
          
          /* Hide everything by default */
          * {
            visibility: hidden !important;
          }
          
          /* Show only the document content and its children */
          .print-document-title,
          .print-document-title *,
          .print-document-content,
          .print-document-content * {
            visibility: visible !important;
          }
          
          /* Hide specific UI elements */
          .print-hide,
          .print-hide *,
          nav,
          nav *,
          header,
          header *,
          .navbar,
          .navbar *,
          .toolbar,
          .toolbar *,
          .sidebar,
          .sidebar *,
          button,
          button *,
          .button,
          .button *,
          .tabs,
          .tabs *,
          .tab-content > :not(.print-show),
          .tab-content > :not(.print-show) * {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Ensure print content is shown */
          .print-show,
          .print-show * {
            display: block !important;
            visibility: visible !important;
          }
          
          /* Reset body and html for clean print */
          html, body {
            font-family: Arial, sans-serif !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
          
          /* Document title styling */
          .print-document-title {
            display: block !important;
            visibility: visible !important;
            font-size: 18pt !important;
            font-weight: bold !important;
            margin: 0 0 24px 0 !important;
            text-align: center !important;
            border-bottom: 2px solid #333 !important;
            padding-bottom: 12px !important;
            color: black !important;
            width: 100% !important;
          }
          
          /* Document content styling */
          .print-document-content {
            display: block !important;
            visibility: visible !important;
            font-size: 12pt !important;
            line-height: 1.6 !important;
            color: black !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          
          /* Content typography */
          .print-document-content h1 { 
            font-size: 16pt !important; 
            margin: 18px 0 12px 0 !important; 
            color: black !important;
          }
          .print-document-content h2 { 
            font-size: 14pt !important; 
            margin: 16px 0 10px 0 !important; 
            color: black !important;
          }
          .print-document-content h3 { 
            font-size: 13pt !important; 
            margin: 14px 0 8px 0 !important; 
            color: black !important;
          }
          .print-document-content p { 
            margin: 8px 0 !important; 
            color: black !important;
          }
          .print-document-content ul, .print-document-content ol { 
            margin: 8px 0 !important; 
            padding-left: 24px !important; 
          }
          .print-document-content li { 
            margin: 4px 0 !important; 
            color: black !important;
          }
          
          /* Prevent orphans and widows */
          .print-document-content p, .print-document-content li { 
            orphans: 2; 
            widows: 2; 
          }
          .print-document-content h1, .print-document-content h2, .print-document-content h3 { 
            page-break-after: avoid; 
          }
          
          /* Ensure no borders or shadows on print */
          .print-document-content,
          .print-document-content * {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}
    </style>
  );
};

export default PrintStyles;
